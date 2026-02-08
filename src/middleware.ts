/**
 * MAKKO INTELLIGENCE - Route Protection Middleware
 * Strict role separation: DRIVER vs PASSENGER (RIDER)
 * Supabase Auth + Role-based redirects
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Role from Supabase user metadata (set during signup/onboarding)
type AppRole = 'DRIVER' | 'PASSENGER' | 'RIDER' | 'ADMIN';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options ?? { path: '/' })
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const isDriverRoute = pathname.startsWith('/driver');
  const isRideRoute = pathname.startsWith('/ride');
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');
  const isAuthCallback = pathname.startsWith('/auth/callback');

  // Get role from user metadata (set during signup, verified by DB in server action)
  const role = (user?.user_metadata?.role as AppRole) ?? (user?.app_metadata?.role as AppRole);

  // Not logged in - protect /driver/* and /ride/*
  if (!user) {
    if (isDriverRoute || isRideRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isAuthCallback) return supabaseResponse;
    return supabaseResponse;
  }

  // Logged in - role-based route protection
  if (isDriverRoute) {
    if (role !== 'DRIVER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/ride/map', request.url));
    }
  }

  if (isRideRoute) {
    if (role !== 'PASSENGER' && role !== 'RIDER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/driver/dashboard', request.url));
    }
  }

  // Redirect from auth pages if already logged in
  if (isAuthRoute) {
    const redirectTo = role === 'DRIVER' ? '/driver/dashboard' : '/ride/map';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Logged-in users on landing page -> redirect to their app
  if (pathname === '/' && (role === 'DRIVER' || role === 'ADMIN' || role === 'PASSENGER' || role === 'RIDER')) {
    const redirectTo = role === 'DRIVER' ? '/driver/dashboard' : '/ride/map';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
