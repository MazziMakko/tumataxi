/**
 * RULIAL LOGIC - Deterministic Commission Calculator
 * Mozambique Ride-Hailing Platform (Tuma Taxi)
 *
 * Commission Tiers:
 * - BRONZE (Default): 17% commission
 * - SILVER (50+ rides/week OR 4.8+ rating): 15% commission
 * - GOLD (100+ rides/week OR 4.9+ rating): 12% + instant payout access
 */

import Decimal from 'decimal.js';
import { DriverMetrics, CommissionOutput } from '@/types';
import { roundMZN } from './utils';

// ============================================================================
// COMMISSION CONSTANTS (Mozambique MZN)
// ============================================================================

const COMMISSION_RATES = {
  BRONZE: 17.0,
  SILVER: 15.0,
  GOLD: 12.0,
} as const;

const TIER_THRESHOLDS = {
  SILVER: {
    minWeeklyRides: 50,
    minRating: 4.8,
  },
  GOLD: {
    minWeeklyRides: 100,
    minRating: 4.9,
  },
} as const;

// ============================================================================
// MAIN COMMISSION CALCULATOR
// ============================================================================

/**
 * Calculate commission for a driver based on Rulial Logic
 * @param driverId - Unique driver identifier
 * @param finalFareMZN - Final ride fare in MZN (Mozambican Metical)
 * @param metrics - Driver metrics (tier, rides, rating)
 * @returns CommissionOutput with exact MZN splits
 */
export function calculateCommission(
  _driverId: string,
  finalFareMZN: number | string,
  metrics: DriverMetrics
): CommissionOutput {
  // Convert fare to number
  const fare = typeof finalFareMZN === 'string' ? parseFloat(finalFareMZN) : finalFareMZN;

  // Validate inputs
  if (fare < 0) {
    throw new Error('Fare amount cannot be negative');
  }

  if (metrics.rating < 1.0 || metrics.rating > 5.0) {
    throw new Error('Driver rating must be between 1.0 and 5.0');
  }

  // Determine commission tier and rate using Rulial Logic
  const { appliedTier, commissionRate, reason } = determineCommissionTier(metrics);

  // Calculate exact MZN amounts
  const commissionAmount = roundMZN((fare * commissionRate) / 100);
  const driverPayout = roundMZN(fare - commissionAmount);

  return {
    commissionRate,
    finalFareMZN: new Decimal(fare),
    commissionMZN: new Decimal(commissionAmount),
    driverPayoutMZN: new Decimal(driverPayout),
    appliedTier,
    reason,
    instantPayoutEligible: appliedTier === 'GOLD',
  };
}

// ============================================================================
// TIER DETERMINATION LOGIC
// ============================================================================

interface TierDecision {
  appliedTier: 'BRONZE' | 'SILVER' | 'GOLD';
  commissionRate: number;
  reason: string;
}

/**
 * Determine driver tier based on Rulial Logic
 * Priority: Check GOLD → SILVER → Default to BRONZE
 */
function determineCommissionTier(metrics: DriverMetrics): TierDecision {
  const { weeklyRidesCompleted, rating } = metrics;

  // GOLD TIER: 100+ rides/week OR 4.9+ rating
  if (
    weeklyRidesCompleted >= TIER_THRESHOLDS.GOLD.minWeeklyRides ||
    rating >= TIER_THRESHOLDS.GOLD.minRating
  ) {
    return {
      appliedTier: 'GOLD',
      commissionRate: COMMISSION_RATES.GOLD,
      reason: `GOLD tier activated: ${
        weeklyRidesCompleted >= TIER_THRESHOLDS.GOLD.minWeeklyRides
          ? `${weeklyRidesCompleted} weekly rides (≥100)`
          : `${rating.toFixed(2)} rating (≥4.9)`
      } → 12% commission + instant payout access`,
    };
  }

  // SILVER TIER: 50+ rides/week OR 4.8+ rating
  if (
    weeklyRidesCompleted >= TIER_THRESHOLDS.SILVER.minWeeklyRides ||
    rating >= TIER_THRESHOLDS.SILVER.minRating
  ) {
    return {
      appliedTier: 'SILVER',
      commissionRate: COMMISSION_RATES.SILVER,
      reason: `SILVER tier activated: ${
        weeklyRidesCompleted >= TIER_THRESHOLDS.SILVER.minWeeklyRides
          ? `${weeklyRidesCompleted} weekly rides (≥50)`
          : `${rating.toFixed(2)} rating (≥4.8)`
      } → 15% commission`,
    };
  }

  // BRONZE TIER: Default
  return {
    appliedTier: 'BRONZE',
    commissionRate: COMMISSION_RATES.BRONZE,
    reason: 'BRONZE tier (default) → 17% commission',
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format MZN amount for display
 */
export function formatMZN(amount: number | string, precision: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `MZN ${num.toFixed(precision)}`;
}

/**
 * Calculate total earnings breakdown
 */
export interface EarningsBreakdown {
  totalFareMZN: number;
  totalCommissionMZN: number;
  totalPayoutMZN: number;
  averageCommissionRate: number;
  rideCount: number;
}

export function calculateEarningsBreakdown(
  rides: Array<{
    fareMZN: number | string;
    commissionRate: number;
  }>
): EarningsBreakdown {
  if (rides.length === 0) {
    return {
      totalFareMZN: 0,
      totalCommissionMZN: 0,
      totalPayoutMZN: 0,
      averageCommissionRate: 0,
      rideCount: 0,
    };
  }

  let totalFare = 0;
  let totalCommission = 0;

  rides.forEach(({ fareMZN, commissionRate }) => {
    const fare = typeof fareMZN === 'string' ? parseFloat(fareMZN) : fareMZN;
    totalFare += fare;
    const commission = roundMZN((fare * commissionRate) / 100);
    totalCommission += commission;
  });

  totalFare = roundMZN(totalFare);
  totalCommission = roundMZN(totalCommission);
  const totalPayout = roundMZN(totalFare - totalCommission);
  const averageCommissionRate = totalFare > 0 ? parseFloat(((totalCommission / totalFare) * 100).toFixed(2)) : 0;

  return {
    totalFareMZN: totalFare,
    totalCommissionMZN: totalCommission,
    totalPayoutMZN: totalPayout,
    averageCommissionRate,
    rideCount: rides.length,
  };
}

// ============================================================================
// VALIDATION & EDGE CASES
// ============================================================================

/**
 * Validate driver eligibility for tier upgrade
 */
export function validateTierEligibility(metrics: DriverMetrics): {
  isEligibleForSilver: boolean;
  isEligibleForGold: boolean;
  nextMilestones: string[];
} {
  const { weeklyRidesCompleted, rating } = metrics;

  const isEligibleForSilver =
    weeklyRidesCompleted >= TIER_THRESHOLDS.SILVER.minWeeklyRides ||
    rating >= TIER_THRESHOLDS.SILVER.minRating;

  const isEligibleForGold =
    weeklyRidesCompleted >= TIER_THRESHOLDS.GOLD.minWeeklyRides ||
    rating >= TIER_THRESHOLDS.GOLD.minRating;

  const nextMilestones: string[] = [];

  if (!isEligibleForSilver) {
    const ridesNeeded = Math.max(0, TIER_THRESHOLDS.SILVER.minWeeklyRides - weeklyRidesCompleted);
    const ratingNeeded = Math.max(0, TIER_THRESHOLDS.SILVER.minRating - rating);

    if (ridesNeeded > 0) {
      nextMilestones.push(`Complete ${ridesNeeded} more rides this week`);
    }
    if (ratingNeeded > 0) {
      nextMilestones.push(`Improve rating by ${ratingNeeded.toFixed(2)}`);
    }
  }

  if (!isEligibleForGold) {
    const ridesNeeded = Math.max(0, TIER_THRESHOLDS.GOLD.minWeeklyRides - weeklyRidesCompleted);
    const ratingNeeded = Math.max(0, TIER_THRESHOLDS.GOLD.minRating - rating);

    if (ridesNeeded > 0 && !nextMilestones.some(m => m.includes('more rides'))) {
      nextMilestones.push(`Complete ${ridesNeeded} more rides this week for GOLD`);
    }
    if (ratingNeeded > 0 && !nextMilestones.some(m => m.includes('rating'))) {
      nextMilestones.push(`Improve rating by ${ratingNeeded.toFixed(2)} for GOLD`);
    }
  }

  return {
    isEligibleForSilver,
    isEligibleForGold,
    nextMilestones,
  };
}
