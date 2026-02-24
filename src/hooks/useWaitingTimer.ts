/**
 * MAKKO INTELLIGENCE - SOVEREIGN REVENUE GENERATOR
 * 
 * useWaitingTimer Hook
 * 
 * PURPOSE: Calculate real-time waiting surcharges for Maputo pickup challenges
 * 
 * ARCHITECTURE:
 * - 5-minute grace period (300 seconds) - NO CHARGE
 * - After grace period: 15 MZN per minute (progressive)
 * - Append-Only ledger integration
 * - Decimal.js precision for financial calculations
 * 
 * MOZAMBIQUE CONTEXT:
 * Low-income housing (bairros) and crowded pickup points require driver
 * compensation for extended wait times. This logic ensures drivers are paid
 * fairly for the friction of navigating Maputo's challenging logistics.
 * 
 * EXAMPLE:
 * - 0:00 - 5:00 → 0 MZN (grace period)
 * - 5:01 - 6:00 → 15 MZN (1 billable minute)
 * - 6:01 - 7:00 → 30 MZN (2 billable minutes)
 * - 10:00 → 75 MZN (5 billable minutes)
 */

import { useState, useEffect, useMemo } from 'react';
import { useDriverStore } from '@/store/driverStore';
import Decimal from 'decimal.js';
import { roundMZN } from '@/lib/rulial/utils';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

const DEFAULT_GRACE_PERIOD_MINUTES = 5;
const DEFAULT_MZN_PER_MINUTE = 15;
const TICK_INTERVAL_MS = 1000; // Update every second

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WaitingTimerData {
  /** Formatted time display (MM:SS) */
  timeDisplay: string;
  
  /** Raw elapsed seconds since arrival */
  elapsedSeconds: number;
  
  /** Whether grace period has been exceeded */
  isOverGracePeriod: boolean;
  
  /** Current surcharge in MZN (Decimal for precision) */
  surchargeMZN: Decimal;
  
  /** Surcharge as formatted string with currency */
  surchargeFormatted: string;
  
  /** Number of billable minutes (after grace period) */
  billableMinutes: number;
  
  /** Percentage of grace period consumed (0-100) */
  gracePeriodPercent: number;
  
  /** Timestamp when waiting started (ISO string) */
  startedAt: Date | null;
  
  /** Whether the timer is currently active */
  isActive: boolean;
}

export interface WaitingTimerConfig {
  /** Grace period in minutes before surcharge begins */
  gracePeriodMinutes?: number;
  
  /** Surcharge per minute after grace period (MZN) */
  mznPerMinute?: number;
  
  /** Whether to round up partial minutes (default: true) */
  roundUpPartialMinutes?: boolean;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Sovereign Revenue Generator Hook
 * 
 * Tracks driver waiting time and calculates real-time MZN surcharges
 * 
 * @param config - Optional configuration for grace period and surcharge rate
 * @returns WaitingTimerData with all timing and surcharge information
 */
export function useWaitingTimer(config: WaitingTimerConfig = {}): WaitingTimerData {
  const {
    gracePeriodMinutes = DEFAULT_GRACE_PERIOD_MINUTES,
    mznPerMinute = DEFAULT_MZN_PER_MINUTE,
    roundUpPartialMinutes = true,
  } = config;

  const { state, waitingTimer } = useDriverStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isActive = state === 'ARRIVED_AT_PICKUP' && waitingTimer.startedAt !== null;
  const gracePeriodSeconds = gracePeriodMinutes * 60;

  // ============================================================================
  // TIMER TICK LOGIC (1-second intervals)
  // ============================================================================

  useEffect(() => {
    if (!isActive || !waitingTimer.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate initial elapsed time
    const calculateElapsed = () => {
      if (!waitingTimer.startedAt) return 0;
      const now = Date.now();
      const startTime = new Date(waitingTimer.startedAt).getTime();
      return Math.floor((now - startTime) / 1000);
    };

    // Set initial value
    setElapsedSeconds(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isActive, waitingTimer.startedAt]);

  // ============================================================================
  // SURCHARGE CALCULATION (Decimal.js for precision)
  // ============================================================================

  const surchargeData = useMemo(() => {
    // No surcharge during grace period
    if (elapsedSeconds <= gracePeriodSeconds) {
      return {
        billableMinutes: 0,
        surchargeMZN: new Decimal(0),
      };
    }

    // Calculate billable seconds (after grace period)
    const billableSeconds = elapsedSeconds - gracePeriodSeconds;
    
    // Calculate billable minutes
    let billableMinutes: number;
    if (roundUpPartialMinutes) {
      // Round up (any partial minute counts as full minute)
      billableMinutes = Math.ceil(billableSeconds / 60);
    } else {
      // Use exact decimal minutes
      billableMinutes = billableSeconds / 60;
    }

    // Calculate surcharge with Decimal.js precision
    const surchargeDecimal = new Decimal(billableMinutes).times(mznPerMinute);
    const surchargeMZN = new Decimal(roundMZN(surchargeDecimal.toNumber()));

    return {
      billableMinutes: roundUpPartialMinutes ? billableMinutes : Math.floor(billableMinutes),
      surchargeMZN,
    };
  }, [elapsedSeconds, gracePeriodSeconds, mznPerMinute, roundUpPartialMinutes]);

  // ============================================================================
  // FORMATTED OUTPUTS
  // ============================================================================

  const timeDisplay = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const surchargeFormatted = useMemo(() => {
    return `MZN ${surchargeData.surchargeMZN.toFixed(2)}`;
  }, [surchargeData.surchargeMZN]);

  const gracePeriodPercent = useMemo(() => {
    if (elapsedSeconds >= gracePeriodSeconds) return 100;
    return Math.min(100, (elapsedSeconds / gracePeriodSeconds) * 100);
  }, [elapsedSeconds, gracePeriodSeconds]);

  // ============================================================================
  // RETURN DATA
  // ============================================================================

  return {
    timeDisplay,
    elapsedSeconds,
    isOverGracePeriod: elapsedSeconds > gracePeriodSeconds,
    surchargeMZN: surchargeData.surchargeMZN,
    surchargeFormatted,
    billableMinutes: surchargeData.billableMinutes,
    gracePeriodPercent,
    startedAt: waitingTimer.startedAt,
    isActive,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate ledger entry description for waiting surcharge
 */
export function generateWaitingSurchargeDescription(
  billableMinutes: number,
  surchargeMZN: Decimal,
  gracePeriodMinutes: number
): string {
  return `Waiting surcharge: ${billableMinutes} min after ${gracePeriodMinutes}-min grace period → ${surchargeMZN.toFixed(2)} MZN`;
}

/**
 * Calculate total fare with waiting surcharge
 */
export function calculateFareWithWaitingSurcharge(
  baseFareMZN: number | Decimal,
  surchargeMZN: Decimal
): Decimal {
  const baseFare = baseFareMZN instanceof Decimal ? baseFareMZN : new Decimal(baseFareMZN);
  return baseFare.plus(surchargeMZN);
}

/**
 * Determine surcharge tier for UI color coding
 */
export function getSurchargeTier(
  surchargeMZN: Decimal
): 'none' | 'low' | 'medium' | 'high' {
  const amount = surchargeMZN.toNumber();
  
  if (amount === 0) return 'none';
  if (amount <= 30) return 'low';      // 0-30 MZN (0-2 min)
  if (amount <= 75) return 'medium';   // 30-75 MZN (2-5 min)
  return 'high';                        // 75+ MZN (5+ min)
}
