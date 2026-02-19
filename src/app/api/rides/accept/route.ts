/**
 * MAKKO INTELLIGENCE - RIDE ACCEPTANCE API
 * Handles driver accepting ride requests with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rideAcceptSchema } from '@/lib/validations/schemas';
import { parseOr400 } from '@/lib/validations/parse';

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not configured', message: 'This endpoint requires database configuration' },
        { status: 503 }
      );
    }

    const parsed = await parseOr400(request, rideAcceptSchema);
    if (!parsed.success) return parsed.response;
    const { rideId, driverId, acceptedAt } = parsed.data;

    // Check if ride exists and is available
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

    if (ride.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Ride is no longer available' },
        { status: 409 }
      );
    }

    // Update ride with driver acceptance
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        driverId,
        status: 'MATCHED',
        matchedAt: acceptedAt ? new Date(acceptedAt) : new Date(),
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        }
      }
    });

    // Update driver profile to online (accepting rides)
    await prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        isOnline: true,
        lastOnlineAt: new Date()
      }
    });

    // TODO: Send real-time notification to passenger
    // await notifyPassenger(ride.passengerId, {
    //   type: 'RIDE_ACCEPTED',
    //   rideId,
    //   driver: updatedRide.driver,
    //   estimatedArrival
    // });

    // TODO: Send SMS notification to passenger
    // await sendSMS(ride.rider.phoneNumber, 
    //   `Your TumaTaxi ride has been accepted! Driver: ${updatedRide.driver.firstName}. ETA: ${estimatedArrival}`
    // );

    return NextResponse.json({
      success: true,
      ride: updatedRide,
      message: 'Ride accepted successfully'
    });

  } catch (error) {
    console.error('Ride acceptance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}