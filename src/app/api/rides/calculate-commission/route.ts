/**
 * API Route: Calculate Commission
 * POST /api/rides/calculate-commission
 * 
 * Calculates driver commission using Rulial Logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCommission } from '@/lib/rulial';
import { DriverMetrics } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { driverId, fareMZN, metrics } = body as {
      driverId: string;
      fareMZN: number | string;
      metrics: DriverMetrics;
    };

    // Validate inputs
    if (!driverId || !fareMZN || !metrics) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: driverId, fareMZN, metrics',
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Calculate commission using Rulial Logic
    const result = calculateCommission(driverId, fareMZN, metrics);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        finalFareMZN: result.finalFareMZN.toString(),
        commissionMZN: result.commissionMZN.toString(),
        driverPayoutMZN: result.driverPayoutMZN.toString(),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Commission calculation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date(),
        },
      { status: 500 }
    );
  }
}
