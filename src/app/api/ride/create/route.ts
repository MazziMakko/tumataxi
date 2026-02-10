/**
 * MAKKO INTELLIGENCE — Request Ride API (Rulial logic)
 * POST /api/ride/create
 * 1. Reject if rider already has an active ride (status not COMPLETED/CANCELLED).
 * 2. Reject if no online drivers in Maputo.
 * 3. Create Ride with status REQUESTED, driverId null.
 * All coordinates default to Maputo when missing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const MAPUTO_PICKUP = { lat: -25.9692, lng: 32.5732 };
const MAPUTO_DROPOFF = { lat: -25.9732, lng: 32.5792 };

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'User profile not found. Complete signup first.' },
        { status: 404 }
      );
    }

    // 1. Active ride check — Rulial: one active ride per rider
    const activeRide = await prisma.ride.findFirst({
      where: {
        riderId: rider.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    });
    if (activeRide) {
      return NextResponse.json(
        { rideId: activeRide.id, message: 'You already have an active ride.', status: activeRide.status },
        { status: 200 }
      );
    }

    // 2. Online drivers in Maputo — must have at least one
    const onlineDriversCount = await prisma.driverProfile.count({
      where: {
        isOnline: true,
        verificationStatus: 'APPROVED',
      },
    });
    if (onlineDriversCount === 0) {
      return NextResponse.json(
        { error: 'No drivers available in Maputo.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pickupLat = typeof body.pickupLat === 'number' ? body.pickupLat : MAPUTO_PICKUP.lat;
    const pickupLng = typeof body.pickupLng === 'number' ? body.pickupLng : MAPUTO_PICKUP.lng;
    const dropLat = typeof body.dropLat === 'number' ? body.dropLat : MAPUTO_DROPOFF.lat;
    const dropLng = typeof body.dropLng === 'number' ? body.dropLng : MAPUTO_DROPOFF.lng;
    const price = typeof body.price === 'number' && body.price >= 0 ? body.price : 150;
    const vehicleType = typeof body.vehicleType === 'string' ? body.vehicleType : 'ECONOMY';
    const pickupAddress = typeof body.pickupAddress === 'string' ? body.pickupAddress : 'Maputo, Centro';
    const dropoffAddress = typeof body.dropoffAddress === 'string' ? body.dropoffAddress : 'Maputo, Destino';

    // 3. Create Ride — status REQUESTED, no driver yet (Rulial: match later)
    const ride = await prisma.ride.create({
      data: {
        riderId: rider.id,
        driverId: null,
        status: 'REQUESTED',
        rideType: vehicleType === 'BODA' ? 'BODA' : vehicleType === 'COMFORT' ? 'COMFORT' : 'ECONOMY',
        vehicleType,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        pickupAddress,
        dropoffLatitude: dropLat,
        dropoffLongitude: dropLng,
        dropoffAddress,
        estimatedDistanceKm: 0,
        estimatedDurationMin: 0,
        price,
        baseFareMZN: price,
        finalFareMZN: price,
        commissionMZN: 0,
        driverPayoutMZN: price,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ rideId: ride.id, status: ride.status });
  } catch (e) {
    console.error('Ride create error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
