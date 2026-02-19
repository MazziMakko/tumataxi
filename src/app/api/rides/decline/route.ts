/**
 * MAKKO INTELLIGENCE - RIDE DECLINE API
 * Handles driver declining ride requests with analytics tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rideDeclineSchema } from '@/lib/validations/schemas';
import { parseOr400 } from '@/lib/validations/parse';

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not configured', message: 'This endpoint requires database configuration' },
        { status: 503 }
      );
    }

    const parsed = await parseOr400(request, rideDeclineSchema);
    if (!parsed.success) return parsed.response;
    const { rideId, driverId, declinedAt, reason } = parsed.data;

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true }
    });

    if (!ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // Record the decline for analytics
    await prisma.rideDecline.create({
      data: {
        rideId,
        driverId,
        reason: reason ?? 'driver_declined',
        declinedAt: declinedAt ? new Date(declinedAt) : new Date(),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update driver profile last online time
    await prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        lastOnlineAt: new Date()
      }
    });

    // If this is the first decline, try to match with next available driver
    const declineCount = await prisma.rideDecline.count({
      where: { rideId }
    });

    if (declineCount === 1 && ride.status === 'REQUESTED') {
      // TODO: Implement automatic re-matching with next closest driver
      // await findAndNotifyNextDriver(rideId);
      console.log(`Ride ${rideId} declined by driver ${driverId}. Re-matching needed.`);
    }

    // If too many declines, mark ride as failed
    if (declineCount >= 5) {
      await prisma.ride.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED',
          cancelReason: 'NO_DRIVERS_AVAILABLE',
          updatedAt: new Date()
        }
      });

      // TODO: Notify passenger of ride failure
      // await notifyPassenger(ride.riderId, {
      //   type: 'RIDE_FAILED',
      //   rideId,
      //   reason: 'No drivers available'
      // });
    }

    return NextResponse.json({
      success: true,
      message: 'Ride decline recorded successfully',
      declineCount,
      rideStatus: declineCount >= 5 ? 'CANCELLED' : ride.status
    });

  } catch (error) {
    console.error('Ride decline error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}