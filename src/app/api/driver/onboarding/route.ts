/**
 * Driver Onboarding API
 * Creates User + DriverProfile in DB (Supabase Auth already created user)
 * SECURITY: Validates authId matches authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';

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

    const body = await request.json();
    const {
      authId,
      email,
      firstName,
      lastName,
      phone,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      licensePlate,
      vehicleColor,
      vehicleType,
      licenseFrontUrl,
      licenseBackUrl,
      insuranceUrl,
      vehicleRegistrationUrl,
    } = body;

    if (!authId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: authId, email, firstName, lastName' },
        { status: 400 }
      );
    }

    if (authId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Upsert User (may already exist from auth)
    const user = await prisma.user.upsert({
      where: { authId: authId as string },
      update: {
        firstName,
        lastName,
        phoneNumber: phone || null,
        emailVerified: true,
      },
      create: {
        authId: authId as string,
        email,
        firstName,
        lastName,
        phoneNumber: phone || null,
        role: 'DRIVER',
        emailVerified: true,
      },
    });

    // Create DriverProfile (PENDING until admin approves)
    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: {
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || 'Unknown',
        vehicleYear: vehicleYear || 2020,
        licensePlate: licensePlate || 'TBD',
        vehicleColor: vehicleColor || 'Unknown',
        vehicleType: vehicleType || 'TAXI',
        licenseFrontUrl: licenseFrontUrl || null,
        licenseBackUrl: licenseBackUrl || null,
        insuranceUrl: insuranceUrl || null,
        vehicleRegistrationUrl: vehicleRegistrationUrl || null,
        verificationStatus: process.env.NEXT_PUBLIC_DEV_AUTO_APPROVE === 'true' ? 'APPROVED' : 'PENDING',
      },
      create: {
        userId: user.id,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || 'Unknown',
        vehicleYear: vehicleYear || 2020,
        licensePlate: licensePlate || 'TBD',
        vehicleColor: vehicleColor || 'Unknown',
        vehicleType: vehicleType || 'TAXI',
        licenseFrontUrl: licenseFrontUrl || null,
        licenseBackUrl: licenseBackUrl || null,
        insuranceUrl: insuranceUrl || null,
        vehicleRegistrationUrl: vehicleRegistrationUrl || null,
        verificationStatus: process.env.NEXT_PUBLIC_DEV_AUTO_APPROVE === 'true' ? 'APPROVED' : 'PENDING',
        documentUrls: [],
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return NextResponse.json(
          { error: 'Driver profile already exists' },
          { status: 409 }
        );
      }
    }
    console.error('Driver onboarding error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
