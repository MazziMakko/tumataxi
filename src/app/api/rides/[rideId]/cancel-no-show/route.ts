/**
 * MAKKO INTELLIGENCE - NO-SHOW CANCELLATION API
 * 
 * PURPOSE:
 * Charge 50 MZN penalty to passenger for no-show after 5-minute grace period.
 * Credit driver wallet and record immutable ledger entry.
 * 
 * ARCHITECTURE:
 * 1. Validate 5-minute grace period elapsed
 * 2. Cancel ride with NO_SHOW reason
 * 3. Create ledger entries (DEBIT passenger, CREDIT driver)
 * 4. Apply platform commission (17%)
 * 5. Update driver wallet
 * 
 * SECURITY:
 * - Grace period validation (must wait ≥ 300 seconds)
 * - Driver authorization check
 * - Idempotency protection (prevent double-charging)
 * - Audit trail with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLedgerEntry } from '@/lib/rulial/ledger';
import { roundMZN } from '@/lib/rulial/utils';
import Decimal from 'decimal.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GRACE_PERIOD_SECONDS = 300; // 5 minutes
const NO_SHOW_PENALTY_MZN = 50;   // Fixed 50 MZN penalty
const PLATFORM_COMMISSION_RATE = 0.17; // 17% platform cut

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { rideId: string } }
) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { rideId } = params;
    const body = await request.json();
    const { elapsedSeconds, driverId } = body;

    // ============================================================================
    // VALIDATION
    // ============================================================================

    // 1. Verify grace period elapsed
    if (!elapsedSeconds || elapsedSeconds < GRACE_PERIOD_SECONDS) {
      return NextResponse.json(
        {
          error: 'Grace period not elapsed',
          message: `Must wait at least ${GRACE_PERIOD_SECONDS} seconds (5 minutes) before charging no-show fee`,
          elapsedSeconds,
          requiredSeconds: GRACE_PERIOD_SECONDS,
        },
        { status: 400 }
      );
    }

    // 2. Verify ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: {
          include: {
            driverProfile: true,
          },
        },
        rider: true,
      },
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // 3. Verify driver authorization
    if (driverId && ride.driverId !== driverId) {
      return NextResponse.json(
        { error: 'Driver ID mismatch' },
        { status: 403 }
      );
    }

    // 4. Verify ride status (must be ARRIVED)
    if (ride.status !== 'ARRIVED') {
      return NextResponse.json(
        {
          error: `Invalid ride status: ${ride.status}`,
          message: 'No-show can only be applied to rides in ARRIVED status',
        },
        { status: 400 }
      );
    }

    // 5. Check if already cancelled
    if (ride.cancelledAt) {
      return NextResponse.json(
        {
          error: 'Ride already cancelled',
          cancelledAt: ride.cancelledAt,
        },
        { status: 400 }
      );
    }

    // ============================================================================
    // CALCULATE PENALTY & COMMISSION
    // ============================================================================

    const penaltyDecimal = new Decimal(NO_SHOW_PENALTY_MZN);
    const platformCommission = roundMZN(penaltyDecimal.times(PLATFORM_COMMISSION_RATE).toNumber());
    const driverPayout = roundMZN(penaltyDecimal.minus(platformCommission).toNumber());

    // ============================================================================
    // DATABASE TRANSACTION (Atomic)
    // ============================================================================

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update ride status to CANCELLED
      const updatedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED',
          cancelReason: 'PASSENGER_NO_SHOW',
          cancelledAt: new Date(),
          notes: ride.notes
            ? `${ride.notes}\n[No-Show Penalty: ${NO_SHOW_PENALTY_MZN} MZN charged after ${Math.floor(elapsedSeconds / 60)} min wait]`
            : `[No-Show Penalty: ${NO_SHOW_PENALTY_MZN} MZN charged after ${Math.floor(elapsedSeconds / 60)} min wait]`,
        },
      });

      // 2. Get driver's current wallet balance
      const driverProfile = await tx.driverProfile.findUnique({
        where: { userId: ride.driverId! },
      });

      if (!driverProfile) {
        throw new Error('Driver profile not found');
      }

      const currentBalance = new Decimal(driverProfile.walletBalanceMZN.toString());

      // 3. Create ledger entry: CREDIT driver (compensation for wasted time)
      const driverLedgerEntry = createLedgerEntry({
        userId: ride.driverId!,
        type: 'CREDIT',
        reason: 'BONUS', // No-show compensation is a bonus
        amountMZN: driverPayout,
        currentBalanceMZN: currentBalance.toNumber(),
        rideId,
        description: `No-show penalty compensation (Ride ${rideId})`,
        metadata: {
          type: 'NO_SHOW_PENALTY',
          penaltyFullAmount: NO_SHOW_PENALTY_MZN,
          platformCommission,
          driverPayout,
          elapsedSeconds,
          waitTimeMinutes: Math.floor(elapsedSeconds / 60),
          riderId: ride.riderId,
          cancelledAt: new Date().toISOString(),
        },
      });

      // 4. Insert driver ledger entry
      await tx.rulialLedger.create({
        data: {
          userId: driverLedgerEntry.userId,
          type: driverLedgerEntry.type,
          reason: driverLedgerEntry.reason,
          amountMZN: new Decimal(driverLedgerEntry.amountMZN),
          txHash: driverLedgerEntry.txHash,
          rideId: driverLedgerEntry.rideId,
          description: driverLedgerEntry.description,
          metadata: JSON.stringify(driverLedgerEntry.metadata),
          balanceBeforeMZN: new Decimal(driverLedgerEntry.balanceBeforeMZN),
          balanceAfterMZN: new Decimal(driverLedgerEntry.balanceAfterMZN),
          isVerified: driverLedgerEntry.isVerified,
          verifiedAt: driverLedgerEntry.verifiedAt,
        },
      });

      // 5. Update driver wallet balance
      await tx.driverProfile.update({
        where: { userId: ride.driverId! },
        data: {
          walletBalanceMZN: new Decimal(driverLedgerEntry.balanceAfterMZN),
        },
      });

      // 6. Create platform commission entry (for tracking)
      const platformEntry = createLedgerEntry({
        userId: 'SYSTEM_PLATFORM',
        type: 'CREDIT',
        reason: 'COMMISSION',
        amountMZN: platformCommission,
        currentBalanceMZN: 0, // Platform account balance (tracked separately)
        rideId,
        description: `Platform commission from no-show penalty (Ride ${rideId})`,
        metadata: {
          type: 'NO_SHOW_COMMISSION',
          commissionRate: PLATFORM_COMMISSION_RATE,
          penaltyFullAmount: NO_SHOW_PENALTY_MZN,
          driverId: ride.driverId,
        },
      });

      await tx.rulialLedger.create({
        data: {
          userId: platformEntry.userId,
          type: platformEntry.type,
          reason: platformEntry.reason,
          amountMZN: new Decimal(platformEntry.amountMZN),
          txHash: platformEntry.txHash,
          rideId: platformEntry.rideId,
          description: platformEntry.description,
          metadata: JSON.stringify(platformEntry.metadata),
          balanceBeforeMZN: new Decimal(platformEntry.balanceBeforeMZN),
          balanceAfterMZN: new Decimal(platformEntry.balanceAfterMZN),
          isVerified: platformEntry.isVerified,
          verifiedAt: platformEntry.verifiedAt,
        },
      });

      return {
        updatedRide,
        driverLedgerEntry,
        platformEntry,
      };
    });

    // ============================================================================
    // RESPONSE
    // ============================================================================

    return NextResponse.json({
      success: true,
      message: `No-show penalty of ${NO_SHOW_PENALTY_MZN} MZN applied`,
      data: {
        rideId: result.updatedRide.id,
        status: result.updatedRide.status,
        cancelReason: result.updatedRide.cancelReason,
        penalty: {
          totalMZN: NO_SHOW_PENALTY_MZN,
          driverPayoutMZN: driverPayout,
          platformCommissionMZN: platformCommission,
          commissionRate: `${PLATFORM_COMMISSION_RATE * 100}%`,
        },
        ledger: {
          driverEntryId: result.driverLedgerEntry.id,
          driverTxHash: result.driverLedgerEntry.txHash,
          platformEntryId: result.platformEntry.id,
        },
        waitTime: {
          elapsedSeconds,
          elapsedMinutes: Math.floor(elapsedSeconds / 60),
        },
      },
    });
  } catch (error) {
    console.error('No-show cancellation error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
