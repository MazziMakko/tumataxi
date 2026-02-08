/**
 * Health Check API - Simple endpoint to verify deployment
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const hasDatabase = !!process.env.DATABASE_URL;
  let databaseStatus = 'not_configured';

  if (hasDatabase && prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'connection_failed';
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'TumaTaxi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    database: {
      configured: hasDatabase,
      status: databaseStatus,
    },
    mode: hasDatabase ? 'full_stack' : 'frontend_only',
  });
}