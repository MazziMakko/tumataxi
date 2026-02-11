/**
 * Supabase Auth Callback (Yango-style)
 * Handles OAuth redirects and email confirmation links.
 * Ensures User exists in DB; drivers without DriverProfile go to onboarding.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user && prisma) {
        const { user } = data;
        const meta = user.user_metadata ?? {};
        const role = (meta.role as string) ?? 'PASSENGER';
        let dbUser = await prisma.user.findUnique({
          where: { authId: user.id },
          include: { driverProfile: true },
        });
        if (!dbUser) {
          try {
            dbUser = await prisma.user.create({
              data: {
                authId: user.id,
                email: user.email ?? '',
                firstName: meta.first_name ?? meta.firstName ?? user.email?.split('@')[0] ?? 'User',
                lastName: meta.last_name ?? meta.lastName ?? '',
                role: role === 'DRIVER' ? 'DRIVER' : 'PASSENGER',
                emailVerified: true,
              },
              include: { driverProfile: true },
            });
          } catch (e) {
            if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code !== 'P2002') {
              console.error('Auth callback user create error:', e);
            }
            dbUser = await prisma.user.findUnique({
              where: { authId: user.id },
              include: { driverProfile: true },
            });
          }
        }
        // Sync DB role to Supabase auth so middleware sees it (stops drivers being sent to /ride/map)
        if (dbUser) {
          try {
            await supabase.auth.updateUser({
              data: { ...(typeof user.user_metadata === 'object' && user.user_metadata !== null ? user.user_metadata : {}), role: dbUser.role },
            });
          } catch {
            // non-fatal
          }
        }
        const dbRole = (dbUser?.role ?? role) as string;
        let dest = next !== '/' ? next : dbRole === 'DRIVER' ? '/driver/dashboard' : '/ride/map';
        if (next === '/' && dbRole === 'DRIVER' && dbUser && !dbUser.driverProfile) {
          dest = '/driver/onboarding';
        }
        return NextResponse.redirect(`${origin}${dest}`);
      }
    } catch (e) {
      console.error('Auth callback error:', e);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
