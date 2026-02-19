/**
 * Toggle driver online status + update location
 * SECURITY: Validates authId matches authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { goOnlineSchema } from '@/lib/validations/schemas';
import { parseOr400 } from '@/lib/validations/parse';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseOr400(request, goOnlineSchema);
    if (!parsed.success) return parsed.response;
    const { authId, isOnline, lat, lng } = parsed.data;

    if (authId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const user = await prisma.user.findUnique({
      where: { authId },
      include: { driverProfile: true },
    });

    if (!user?.driverProfile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    await prisma.driverProfile.update({
      where: { userId: user.id },
      data: {
        isOnline: !!isOnline,
        lastOnlineAt: new Date(),
        currentLatitude: lat ?? user.driverProfile.currentLatitude,
        currentLongitude: lng ?? user.driverProfile.currentLongitude,
        lastLocationUpdate: new Date(),
      },
    });

    return NextResponse.json({ isOnline: !!isOnline });
  } catch (e) {
    console.error('Go online error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
