/**
 * Supabase Auth Callback
 * Handles OAuth redirects and email confirmation links.
 * Ensures User exists in DB before redirect.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user && prisma) {
      const { user } = data;
      const meta = user.user_metadata ?? {};
      const role = (meta.role as string) ?? 'PASSENGER';
      const existing = await prisma.user.findUnique({ where: { authId: user.id } });
      if (!existing) {
        try {
          await prisma.user.create({
            data: {
              authId: user.id,
              email: user.email ?? '',
              firstName: meta.first_name ?? meta.firstName ?? user.email?.split('@')[0] ?? 'User',
              lastName: meta.last_name ?? meta.lastName ?? '',
              role: role === 'DRIVER' ? 'DRIVER' : 'PASSENGER',
              emailVerified: true,
            },
          });
        } catch (e) {
          if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code !== 'P2002') {
            console.error('Auth callback user create error:', e);
          }
        }
      }
      const dest = next === '/' ? (role === 'DRIVER' ? '/driver/dashboard' : '/ride/map') : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
