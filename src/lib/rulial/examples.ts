/**
 * RULIAL LOGIC - Examples & Documentation
 * Usage patterns for the 17% Commission System
 */

import { calculateCommission, formatMZN, validateTierEligibility } from '@/lib/rulial';
import { DriverMetrics } from '@/types';
import Decimal from 'decimal.js';

// ============================================================================
// EXAMPLE 1: Bronze Driver (Default 17% Commission)
// ============================================================================

const bronzeDriver: DriverMetrics = {
  currentTier: 'BRONZE',
  totalRidesCompleted: 10,
  weeklyRidesCompleted: 3,
  rating: 4.5,
};

const bronzeResult = calculateCommission('driver_001', 500, bronzeDriver);

console.log('=== BRONZE TIER EXAMPLE ===');
console.log(`Driver Tier: ${bronzeResult.appliedTier}`);
console.log(`Final Fare: ${formatMZN(bronzeResult.finalFareMZN.toNumber())}`);
console.log(`Commission Rate: ${bronzeResult.commissionRate}%`);
console.log(`Commission Amount: ${formatMZN(bronzeResult.commissionMZN.toNumber())}`);
console.log(`Driver Payout: ${formatMZN(bronzeResult.driverPayoutMZN.toNumber())}`);
console.log(`Reason: ${bronzeResult.reason}`);
console.log(`Instant Payout Eligible: ${bronzeResult.instantPayoutEligible}`);
console.log();

/**
 * Expected Output:
 * === BRONZE TIER EXAMPLE ===
 * Driver Tier: BRONZE
 * Final Fare: MZN 500.00
 * Commission Rate: 17%
 * Commission Amount: MZN 85.00
 * Driver Payout: MZN 415.00
 * Reason: BRONZE tier (default) → 17% commission
 * Instant Payout Eligible: false
 */

// ============================================================================
// EXAMPLE 2: Silver Driver (15% Commission - 50+ Weekly Rides)
// ============================================================================

const silverDriver: DriverMetrics = {
  currentTier: 'SILVER',
  totalRidesCompleted: 250,
  weeklyRidesCompleted: 62, // Exceeded 50-ride threshold
  rating: 4.6,
};

const silverResult = calculateCommission('driver_002', 1200, silverDriver);

console.log('=== SILVER TIER EXAMPLE ===');
console.log(`Driver Tier: ${silverResult.appliedTier}`);
console.log(`Final Fare: ${formatMZN(silverResult.finalFareMZN.toNumber())}`);
console.log(`Commission Rate: ${silverResult.commissionRate}%`);
console.log(`Commission Amount: ${formatMZN(silverResult.commissionMZN.toNumber())}`);
console.log(`Driver Payout: ${formatMZN(silverResult.driverPayoutMZN.toNumber())}`);
console.log(`Reason: ${silverResult.reason}`);
console.log(`Instant Payout Eligible: ${silverResult.instantPayoutEligible}`);
console.log();

/**
 * Expected Output:
 * === SILVER TIER EXAMPLE ===
 * Driver Tier: SILVER
 * Final Fare: MZN 1200.00
 * Commission Rate: 15%
 * Commission Amount: MZN 180.00
 * Driver Payout: MZN 1020.00
 * Reason: SILVER tier activated: 62 weekly rides (≥50) → 15% commission
 * Instant Payout Eligible: false
 */

// ============================================================================
// EXAMPLE 3: Gold Driver (12% Commission - 4.9+ Rating)
// ============================================================================

const goldDriver: DriverMetrics = {
  currentTier: 'GOLD',
  totalRidesCompleted: 550,
  weeklyRidesCompleted: 85,
  rating: 4.92, // Exceeded 4.9 threshold
};

const goldResult = calculateCommission('driver_003', 2000, goldDriver);

console.log('=== GOLD TIER EXAMPLE ===');
console.log(`Driver Tier: ${goldResult.appliedTier}`);
console.log(`Final Fare: ${formatMZN(goldResult.finalFareMZN.toNumber())}`);
console.log(`Commission Rate: ${goldResult.commissionRate}%`);
console.log(`Commission Amount: ${formatMZN(goldResult.commissionMZN.toNumber())}`);
console.log(`Driver Payout: ${formatMZN(goldResult.driverPayoutMZN.toNumber())}`);
console.log(`Reason: ${goldResult.reason}`);
console.log(`Instant Payout Eligible: ${goldResult.instantPayoutEligible}`);
console.log();

/**
 * Expected Output:
 * === GOLD TIER EXAMPLE ===
 * Driver Tier: GOLD
 * Final Fare: MZN 2000.00
 * Commission Rate: 12%
 * Commission Amount: MZN 240.00
 * Driver Payout: MZN 1760.00
 * Reason: GOLD tier activated: 4.92 rating (≥4.9) → 12% commission + instant payout access
 * Instant Payout Eligible: true
 */

// ============================================================================
// EXAMPLE 4: Tier Eligibility Check
// ============================================================================

const almostSilverDriver: DriverMetrics = {
  currentTier: 'BRONZE',
  totalRidesCompleted: 45,
  weeklyRidesCompleted: 48, // 2 rides short of SILVER
  rating: 4.5,
};

const eligibility = validateTierEligibility(almostSilverDriver);

console.log('=== TIER ELIGIBILITY CHECK ===');
console.log(`Eligible for SILVER: ${eligibility.isEligibleForSilver}`);
console.log(`Eligible for GOLD: ${eligibility.isEligibleForGold}`);
console.log(`Next Milestones:`);
eligibility.nextMilestones.forEach(milestone => {
  console.log(`  • ${milestone}`);
});
console.log();

/**
 * Expected Output:
 * === TIER ELIGIBILITY CHECK ===
 * Eligible for SILVER: false
 * Eligible for GOLD: false
 * Next Milestones:
 *   • Complete 2 more rides this week
 *   • Improve rating by 0.30
 */

// ============================================================================
// EXAMPLE 5: Handling Decimal Precision in MZN
// ============================================================================

console.log('=== DECIMAL PRECISION TEST ===');
const precisionTestFare = new Decimal('1250.75');
const precisionResult = calculateCommission('driver_004', precisionTestFare.toNumber(), bronzeDriver);

console.log(`Input Fare: MZN ${precisionTestFare.toString()}`);
console.log(`Commission (17%): ${formatMZN(precisionResult.commissionMZN.toNumber())}`);
console.log(`Driver Payout: ${formatMZN(precisionResult.driverPayoutMZN.toNumber())}`);
console.log(`Sum Check: ${formatMZN(
  precisionResult.commissionMZN.plus(precisionResult.driverPayoutMZN).toNumber()
)} (should equal original fare)`);
console.log();

// ============================================================================
// NOTES FOR DEVELOPERS
// ============================================================================

/**
 * KEY POINTS:
 *
 * 1. COMMISSION TIERS ARE DETERMINISTIC
 *    - Based on driver metrics at time of calculation
 *    - Historical rides: 50+ or 100+ in current week
 *    - Rating thresholds: 4.8 for SILVER, 4.9 for GOLD
 *
 * 2. DECIMAL PRECISION IS CRITICAL
 *    - Use Decimal.js for all financial calculations
 *    - MZN only supports 2 decimal places
 *    - Always validate with isValidMZNAmount()
 *
 * 3. INSTANT PAYOUT (GOLD ONLY)
 *    - Only GOLD tier drivers get instant payout access
 *    - Reduces withdrawal delay from 24h to <5min
 *    - Requires verified banking details
 *
 * 4. IMMUTABLE TRANSACTION HASHES
 *    - Each calculation generates a unique txHash
 *    - Used for ledger integrity verification
 *    - Cannot be modified after creation
 *
 * 5. WEEKLY COUNTER RESETS
 *    - Reset occurs every Sunday (Africa/Maputo timezone)
 *    - Check shouldResetWeeklyCounter() before calculations
 *    - Affects SILVER/GOLD tier eligibility
 *
 * 6. OPTIMIZATION FOR 3G NETWORKS
 *    - Use CompressedRideData for mobile clients
 *    - Minimal payload transmission
 *    - Local calculation where possible
 */
