/**
 * MAKKO INTELLIGENCE — Request Ride API (Rulial logic)
 * POST /api/ride/create
 * 1. Reject if rider already has an active ride (status not COMPLETED/CANCELLED).
 * 2. Reject if no online drivers in the region.
 * 3. Create Ride with status REQUESTED, driverId null.
 * All coordinates use dynamic geo config.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { rideCreateSchema } from '@/lib/validations/schemas';
import { parseOr400 } from '@/lib/validations/parse';
import { getGeoConfig, generateSimulatedRideCoordinates } from '@/config/geo';

const GEO_CONFIG = getGeoConfig();
const { pickup: DEFAULT_PICKUP, dropoff: DEFAULT_DROPOFF } = generateSimulatedRideCoordinates();

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

    // 2. Online drivers in region — must have at least one
    const onlineDriversCount = await prisma.driverProfile.count({
      where: {
        isOnline: true,
        verificationStatus: 'APPROVED',
      },
    });
    if (onlineDriversCount === 0) {
      return NextResponse.json(
        { error: `No drivers available in ${GEO_CONFIG.displayName}.` },
        { status: 503 }
      );
    }

    const parsed = await parseOr400(request, rideCreateSchema);
    if (!parsed.success) return parsed.response;
    const body = parsed.data;
    const pickupLat = body.pickupLat ?? DEFAULT_PICKUP.lat;
    const pickupLng = body.pickupLng ?? DEFAULT_PICKUP.lng;
    const dropLat = body.dropLat ?? DEFAULT_DROPOFF.lat;
    const dropLng = body.dropLng ?? DEFAULT_DROPOFF.lng;
    const price = body.price != null && body.price >= 0 ? body.price : 150;
    const vehicleType = body.vehicleType ?? 'ECONOMY';
    const pickupAddress = body.pickupAddress ?? `${GEO_CONFIG.displayName}, Centro`;
    const dropoffAddress = body.dropoffAddress ?? `${GEO_CONFIG.displayName}, Destino`;

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
