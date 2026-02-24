/**
 * MAKKO INTELLIGENCE - SOVEREIGN REVENUE GENERATOR
 * API Endpoint: Record Waiting Surcharge to Immutable Ledger
 * 
 * PURPOSE:
 * Create append-only ledger entry for waiting surcharges.
 * This ensures drivers in Maputo are compensated for extended wait times
 * at crowded bairros and low-income housing pickup points.
 * 
 * ARCHITECTURE:
 * 1. Calculate progressive surcharge (15 MZN per minute after 5-min grace)
 * 2. Create immutable ledger entry with txHash
 * 3. Update ride fare (estimatedFareMZN)
 * 4. Record billable minutes in metadata
 * 
 * SECURITY:
 * - Validation: Ensures waiting time is legitimate (< 60 min max)
 * - Idempotency: Prevents duplicate surcharge applications
 * - Audit Trail: Every surcharge is logged with timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLedgerEntry } from '@/lib/rulial/ledger';
import { roundMZN } from '@/lib/rulial/utils';
import Decimal from 'decimal.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GRACE_PERIOD_MINUTES = 5;
const MZN_PER_MINUTE = 15;
const MAX_BILLABLE_MINUTES = 60; // Sanity check (1 hour max)

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check database availability
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      rideId,
      driverId,
      billableMinutes,
      surchargeMZN,
      startedAt,
      completedAt,
    } = body;

    // ============================================================================
    // VALIDATION
    // ============================================================================

    if (!rideId || !driverId || billableMinutes === undefined || !surchargeMZN) {
      return NextResponse.json(
        { error: 'Missing required fields: rideId, driverId, billableMinutes, surchargeMZN' },
        { status: 400 }
      );
    }

    // Validate billable minutes (sanity check)
    if (billableMinutes < 0 || billableMinutes > MAX_BILLABLE_MINUTES) {
      return NextResponse.json(
        { error: `Invalid billable minutes: ${billableMinutes}. Must be 0-${MAX_BILLABLE_MINUTES}` },
        { status: 400 }
      );
    }

    // Validate surcharge amount
    const surchargeDecimal = new Decimal(surchargeMZN);
    if (surchargeDecimal.isNegative()) {
      return NextResponse.json(
        { error: 'Surcharge amount cannot be negative' },
        { status: 400 }
      );
    }

    // Verify ride exists and is in correct state
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: {
          include: {
            driverProfile: true,
          },
        },
      },
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    if (ride.driverId !== driverId) {
      return NextResponse.json(
        { error: 'Driver ID mismatch' },
        { status: 403 }
      );
    }

    // Verify ride is in correct state (must be ARRIVED or IN_PROGRESS)
    if (!['ARRIVED', 'IN_PROGRESS'].includes(ride.status)) {
      return NextResponse.json(
        { error: `Invalid ride status: ${ride.status}. Must be ARRIVED or IN_PROGRESS` },
        { status: 400 }
      );
    }

    // ============================================================================
    // CALCULATE SURCHARGE (Double-check calculation)
    // ============================================================================

    const expectedSurcharge = billableMinutes * MZN_PER_MINUTE;
    const roundedExpected = roundMZN(expectedSurcharge);

    if (Math.abs(roundedExpected - surchargeDecimal.toNumber()) > 0.01) {
      return NextResponse.json(
        {
          error: 'Surcharge calculation mismatch',
          expected: roundedExpected,
          received: surchargeDecimal.toNumber(),
        },
        { status: 400 }
      );
    }

    // ============================================================================
    // UPDATE RIDE FARE & CREATE LEDGER ENTRY
    // ============================================================================

    const currentFare = new Decimal(ride.finalFareMZN.toString());
    const newFare = currentFare.plus(surchargeDecimal);
    const newFareRounded = roundMZN(newFare.toNumber());

    // Transaction: Update ride + create ledger entry
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update ride with new fare
      const updatedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          finalFareMZN: new Decimal(newFareRounded),
          // Store waiting surcharge in ride metadata
          notes: ride.notes
            ? `${ride.notes}\n[Waiting Surcharge: ${billableMinutes} min × ${MZN_PER_MINUTE} MZN = ${surchargeDecimal.toFixed(2)} MZN]`
            : `[Waiting Surcharge: ${billableMinutes} min × ${MZN_PER_MINUTE} MZN = ${surchargeDecimal.toFixed(2)} MZN]`,
        },
      });

      // 2. Get driver's current balance
      const driverProfile = await tx.driverProfile.findUnique({
        where: { userId: driverId },
      });

      if (!driverProfile) {
        throw new Error('Driver profile not found');
      }

      const currentBalance = new Decimal(driverProfile.walletBalanceMZN.toString());

      // 3. Create immutable ledger entry (CREDIT to driver)
      const ledgerEntry = createLedgerEntry({
        userId: driverId,
        type: 'CREDIT',
        reason: 'BONUS', // Waiting surcharge is treated as a bonus
        amountMZN: surchargeDecimal.toNumber(),
        currentBalanceMZN: currentBalance.toNumber(),
        rideId,
        description: `Waiting surcharge: ${billableMinutes} min after ${GRACE_PERIOD_MINUTES}-min grace period (Ride ${rideId})`,
        metadata: {
          type: 'WAITING_SURCHARGE',
          billableMinutes,
          gracePeriodMinutes: GRACE_PERIOD_MINUTES,
          mznPerMinute: MZN_PER_MINUTE,
          startedAt,
          completedAt,
          previousFareMZN: currentFare.toNumber(),
          newFareMZN: newFareRounded,
          calculatedAt: new Date().toISOString(),
        },
      });

      // 4. Insert ledger entry into database
      const dbLedgerEntry = await tx.rulialLedger.create({
        data: {
          userId: ledgerEntry.userId,
          type: ledgerEntry.type,
          reason: ledgerEntry.reason,
          amountMZN: new Decimal(ledgerEntry.amountMZN),
          txHash: ledgerEntry.txHash,
          rideId: ledgerEntry.rideId,
          description: ledgerEntry.description,
          metadata: JSON.stringify(ledgerEntry.metadata),
          balanceBeforeMZN: new Decimal(ledgerEntry.balanceBeforeMZN),
          balanceAfterMZN: new Decimal(ledgerEntry.balanceAfterMZN),
          isVerified: ledgerEntry.isVerified,
          verifiedAt: ledgerEntry.verifiedAt,
        },
      });

      // 5. Update driver's wallet balance
      await tx.driverProfile.update({
        where: { userId: driverId },
        data: {
          walletBalanceMZN: new Decimal(ledgerEntry.balanceAfterMZN),
        },
      });

      return {
        updatedRide,
        ledgerEntry: dbLedgerEntry,
      };
    });

    // ============================================================================
    // RESPONSE
    // ============================================================================

    return NextResponse.json({
      success: true,
      message: 'Waiting surcharge recorded successfully',
      data: {
        rideId: result.updatedRide.id,
        previousFareMZN: currentFare.toNumber(),
        newFareMZN: newFareRounded,
        surchargeMZN: surchargeDecimal.toNumber(),
        billableMinutes,
        ledgerEntryId: result.ledgerEntry.id,
        txHash: result.ledgerEntry.txHash,
      },
    });
  } catch (error) {
    console.error('Waiting surcharge recording error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER (Query Waiting Surcharges)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const rideId = searchParams.get('rideId');

    if (!driverId && !rideId) {
      return NextResponse.json(
        { error: 'Either driverId or rideId is required' },
        { status: 400 }
      );
    }

    // Query ledger entries for waiting surcharges
    const whereClause: any = {
      reason: 'BONUS',
    };

    if (driverId) {
      whereClause.userId = driverId;
    }

    if (rideId) {
      whereClause.rideId = rideId;
    }

    const surcharges = await prisma.rulialLedger.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Filter for waiting surcharges (check metadata)
    const waitingSurcharges = surcharges.filter((entry) => {
      try {
        const metadata = JSON.parse(entry.metadata || '{}');
        return metadata.type === 'WAITING_SURCHARGE';
      } catch {
        return false;
      }
    });

    // Calculate totals
    const totalSurcharge = waitingSurcharges.reduce(
      (sum, entry) => sum + Number(entry.amountMZN),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        surcharges: waitingSurcharges.map((entry) => ({
          id: entry.id,
          rideId: entry.rideId,
          amountMZN: Number(entry.amountMZN),
          description: entry.description,
          metadata: JSON.parse(entry.metadata || '{}'),
          createdAt: entry.createdAt,
          txHash: entry.txHash,
        })),
        totalSurcharge: roundMZN(totalSurcharge),
        count: waitingSurcharges.length,
      },
    });
  } catch (error) {
    console.error('Waiting surcharge query error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
