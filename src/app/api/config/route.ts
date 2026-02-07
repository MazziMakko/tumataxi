/**
 * Configuration Check API - Shows environment status (development only)
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const config = {
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    publicVars: {
      timezone: process.env.NEXT_PUBLIC_TIMEZONE,
      locale: process.env.NEXT_PUBLIC_LOCALE,
      currency: process.env.NEXT_PUBLIC_CURRENCY,
      enableSOS: process.env.NEXT_PUBLIC_ENABLE_SOS,
      enableInstantPayout: process.env.NEXT_PUBLIC_ENABLE_INSTANT_PAYOUT,
      maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(config);
}