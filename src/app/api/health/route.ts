/**
 * Health Check API - Simple endpoint to verify deployment
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'TumaTaxi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
  });
}