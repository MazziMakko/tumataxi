/**
 * RULIAL LOGIC - Utility Functions
 * Immutable transaction hash generation and validation
 */

import crypto from 'crypto';

/**
 * Generate immutable transaction hash for ledger entry
 * Format: SHA256(driverId + fare + direction + timestamp)
 */
export function generateTxHash(
  driverId: string,
  fareMZN: number,
  direction: number, // 1 for CREDIT, -1 for DEBIT
  timestamp: Date = new Date()
): string {
  const data = `${driverId}:${fareMZN.toFixed(2)}:${direction}:${timestamp.getTime()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate transaction hash integrity
 */
export function validateTxHash(
  txHash: string,
  driverId: string,
  fareMZN: number,
  direction: number,
  timestamp: Date
): boolean {
  const expectedHash = generateTxHash(driverId, fareMZN, direction, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(txHash),
    Buffer.from(expectedHash)
  );
}

/**
 * Round MZN amount to nearest valid currency unit
 * Mozambican Metical (MZN) - 2 decimal places
 */
export function roundMZN(amount: number | string, direction: 'up' | 'down' | 'nearest' = 'nearest'): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const multiplied = Math.round(num * 100); // Convert to cents
  
  if (direction === 'up') {
    return Math.ceil(multiplied) / 100;
  }
  if (direction === 'down') {
    return Math.floor(multiplied) / 100;
  }

  return multiplied / 100;
}

/**
 * Check if MZN amount is valid (non-negative, proper precision)
 */
export function isValidMZNAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Must be non-negative
  if (num < 0) return false;

  // Check for proper decimal places (max 2)
  const decimalPart = (num * 100) % 1;
  if (decimalPart !== 0) return false;

  return true;
}

/**
 * Convert between currency rates (future-proofing for multi-currency)
 */
export const EXCHANGE_RATES = {
  MZN_to_USD: 0.016, // Approximate as of 2024
  USD_to_MZN: 62.5,  // Inverse
} as const;

/**
 * Calculate percentage of an amount in MZN
 */
export function calculatePercentage(baseMZN: number | string, percentageRate: number): number {
  const base = typeof baseMZN === 'string' ? parseFloat(baseMZN) : baseMZN;
  return roundMZN(base * (percentageRate / 100));
}

/**
 * Determine driver's week boundary (Sunday-Saturday, Africa/Maputo timezone)
 */
export function getWeekBoundary(dateInMaputo: Date = new Date()) {
  // Convert to Africa/Maputo timezone
  const formatter = new Intl.DateTimeFormat('pt-MZ', {
    timeZone: 'Africa/Maputo',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(dateInMaputo);
  const weekday = parts.find(p => p.type === 'weekday')?.value;

  // Calculate Sunday of current week
  const utcDate = new Date(dateInMaputo);
  const dayOfWeek = utcDate.getUTCDay();
  const diffToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;

  const weekStart = new Date(utcDate);
  weekStart.setUTCDate(utcDate.getUTCDate() - diffToSunday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return {
    weekStart,
    weekEnd,
    currentDayOfWeek: weekday,
  };
}

/**
 * Check if driver's weekly ride counter needs reset
 */
export function shouldResetWeeklyCounter(lastReset: Date): boolean {
  const now = new Date();
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceReset >= 7;
}
