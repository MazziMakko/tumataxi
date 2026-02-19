/**
 * Get current driver profile
 * SECURITY: Validates authId matches authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const authId = request.nextUrl.searchParams.get('authId');
  if (!authId) {
    return NextResponse.json({ error: 'authId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data?.user ?? null;
  if (!authUser || authUser.id !== authId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { authId },
    include: { driverProfile: true },
  });

  if (!user || !user.driverProfile) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }

  const { driverProfile } = user;
  return NextResponse.json({
    userId: user.id,
    verificationStatus: driverProfile.verificationStatus,
    isOnline: driverProfile.isOnline,
    todaysEarningsMZN: Number(driverProfile.walletBalanceMZN), // Simplified - would need daily aggregation
    totalRidesCompleted: driverProfile.totalRidesCompleted,
  });
}
