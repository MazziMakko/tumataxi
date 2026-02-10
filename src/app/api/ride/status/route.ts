/**
 * MAKKO INTELLIGENCE — Ride Status (for rider polling)
 * GET /api/ride/status?id=<rideId>
 * Returns ride status; caller must be the rider (auth).
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const rideId = request.nextUrl.searchParams.get('id');
    if (!rideId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const rider = await prisma.user.findUnique({
      where: { authId: authUser.id },
      select: { id: true },
    });
    if (!rider) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ride = await prisma.ride.findFirst({
      where: { id: rideId, riderId: rider.id },
      select: {
        id: true,
        status: true,
        driverId: true,
        driver: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        price: true,
        finalFareMZN: true,
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    const finalFare = ride.finalFareMZN != null ? Number(ride.finalFareMZN) : ride.price ?? 0;
    return NextResponse.json({
      id: ride.id,
      status: ride.status,
      driverId: ride.driverId,
      driver: ride.driver
        ? {
            firstName: ride.driver.firstName,
            lastName: ride.driver.lastName,
            phoneNumber: ride.driver.phoneNumber,
          }
        : null,
      price: ride.price ?? finalFare,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
    });
  } catch (e) {
    console.error('Ride status error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
