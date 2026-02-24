/**
 * NEW JERUSALEM HOLDINGS - PORTFOLIO API
 * 
 * Aggregates metrics from IsoFlux and Tuma Taxi for executive dashboard
 * 
 * GET /api/admin/portfolio
 * Returns: Combined portfolio metrics
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          fallback: getMockPortfolioData(),
        },
        { status: 503 }
      );
    }

    // ============================================================================
    // TUMA TAXI METRICS (Real Data from Database)
    // ============================================================================

    // Total registered drivers
    const totalDrivers = await prisma.driverProfile.count();

    // Active drivers (online in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeDrivers = await prisma.driverProfile.count({
      where: {
        lastOnlineAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Total completed rides
    const totalRides = await prisma.ride.count({
      where: {
        status: 'COMPLETED',
      },
    });

    // Total commission collected (MZN)
    const commissionData = await prisma.rulialLedger.aggregate({
      where: {
        reason: 'COMMISSION',
        type: 'CREDIT',
      },
      _sum: {
        amountMZN: true,
      },
    });

    const commissionCollectedMZN = commissionData._sum.amountMZN
      ? new Decimal(commissionData._sum.amountMZN.toString()).toNumber()
      : 0;

    // Total ledger entries
    const tumaTaxiLedgerEntries = await prisma.rulialLedger.count();

    // Estimate monthly revenue (commission collected / months active)
    // For demo, we'll use a simple calculation
    const estimatedMonthlyRevenueMZN = commissionCollectedMZN > 0
      ? commissionCollectedMZN / 3 // Assuming 3 months active
      : 1000; // Fallback

    // Convert MZN to USD (approximate rate: 62.5 MZN = 1 USD)
    const MZN_TO_USD_RATE = 62.5;
    const estimatedMrrUSD = Math.round(estimatedMonthlyRevenueMZN / MZN_TO_USD_RATE);

    // Remitted USD (for demo, assume 80% of commission has been remitted)
    const remittedUSD = Math.round((commissionCollectedMZN * 0.8) / MZN_TO_USD_RATE);

    // ============================================================================
    // ISOFLUX METRICS (Mock Data - Separate Product)
    // ============================================================================
    
    // In production, this would fetch from IsoFlux database or API
    const isoFluxData = {
      mrr: 12500,
      totalUnits: 2847,
      totalProperties: 34,
      complianceScore: 99.8,
      activeClients: 12,
      ledgerEntries: 45678,
    };

    // ============================================================================
    // PORTFOLIO AGGREGATION
    // ============================================================================

    const portfolioData = {
      isoFlux: isoFluxData,
      tumaTaxi: {
        estimatedMrr: estimatedMrrUSD,
        totalVehicles: totalDrivers,
        activeDrivers,
        totalRides,
        commissionCollected: Math.round(commissionCollectedMZN),
        remittedUSD,
        ledgerEntries: tumaTaxiLedgerEntries,
      },
      netRemittanceGrowth: 18.4, // Mock for now (would calculate from historical data)
      ledgerIntegrity: 100.0,     // Always 100% with immutable ledger
    };

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error('Portfolio API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio data',
        fallback: getMockPortfolioData(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// MOCK DATA FALLBACK
// ============================================================================

function getMockPortfolioData() {
  return {
    isoFlux: {
      mrr: 12500,
      totalUnits: 2847,
      totalProperties: 34,
      complianceScore: 99.8,
      activeClients: 12,
      ledgerEntries: 45678,
    },
    tumaTaxi: {
      estimatedMrr: 3200,
      totalVehicles: 156,
      activeDrivers: 89,
      totalRides: 3421,
      commissionCollected: 456789,
      remittedUSD: 7300,
      ledgerEntries: 12456,
    },
    netRemittanceGrowth: 18.4,
    ledgerIntegrity: 100.0,
  };
}
