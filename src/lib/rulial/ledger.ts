/**
 * RULIAL LEDGER - Transaction Helpers
 * Deterministic financial state management with immutable transaction hashes
 *
 * All ledger entries create immutable records with SHA256 transaction hashes
 * This ensures financial integrity across the platform
 */

import { generateTxHash, roundMZN, isValidMZNAmount } from '@/lib/rulial/utils';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

// ============================================================================
// MAKKO INTELLIGENCE: PLATFORM BALANCE MANAGEMENT
// ============================================================================

/**
 * Get current platform balance
 * In production, this would query the database for the platform account balance
 */
function getPlatformBalance(): number {
  // TODO: In production, implement database query:
  // SELECT SUM(amountMZN) FROM ledger_entries WHERE userId = 'SYSTEM_PLATFORM'
  
  // For now, return cached balance from localStorage or default
  if (typeof window !== 'undefined') {
    const cachedBalance = localStorage.getItem('platform_balance');
    if (cachedBalance) {
      return parseFloat(cachedBalance);
    }
  }
  
  // Default starting balance for new platform
  return 0;
}

/**
 * Update platform balance cache
 * In production, this would update the database
 */
function updatePlatformBalance(newBalance: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('platform_balance', newBalance.toString());
  }
  
  // TODO: In production, implement database update:
  // UPDATE platform_accounts SET balance = ? WHERE account_id = 'SYSTEM_PLATFORM'
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LedgerEntry {
  id?: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  reason: 'RIDE_PAYOUT' | 'COMMISSION' | 'BONUS' | 'REFUND' | 'WITHDRAWAL' | 'SYSTEM_ADJUST';
  amountMZN: number;
  txHash: string;
  rideId?: string;
  description?: string;
  metadata?: Record<string, any>;
  balanceBeforeMZN: number;
  balanceAfterMZN: number;
  isVerified: boolean;
  verifiedAt: Date;
  createdAt: Date;
}

export interface LedgerCreateParams {
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  reason: 'RIDE_PAYOUT' | 'COMMISSION' | 'BONUS' | 'REFUND' | 'WITHDRAWAL' | 'SYSTEM_ADJUST';
  amountMZN: number | string;
  currentBalanceMZN: number | string;
  rideId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface LedgerAuditReport {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  entryCount: number;
  discrepancies: DiscrepancyReport[];
  isValid: boolean;
}

export interface DiscrepancyReport {
  entryId: string;
  type: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// LEDGER CREATION FUNCTIONS
// ============================================================================

/**
 * Create a new ledger entry with immutable transaction hash
 * @param params - Ledger creation parameters
 * @returns LedgerEntry with generated txHash
 */
export function createLedgerEntry(params: LedgerCreateParams): LedgerEntry {
  const {
    userId,
    type,
    reason,
    amountMZN,
    currentBalanceMZN,
    rideId,
    description,
    metadata,
  } = params;

  // Convert to number
  const amount = typeof amountMZN === 'string' ? parseFloat(amountMZN) : amountMZN;
  const currentBalance = typeof currentBalanceMZN === 'string' ? parseFloat(currentBalanceMZN) : currentBalanceMZN;

  // Validate amounts
  if (!isValidMZNAmount(amount)) {
    throw new Error(`Invalid amount: ${amountMZN}. Must be non-negative with max 2 decimal places.`);
  }

  if (!isValidMZNAmount(currentBalance)) {
    throw new Error(`Invalid current balance: ${currentBalanceMZN}`);
  }

  // Calculate new balance
  let newBalance: number;
  if (type === 'CREDIT') {
    newBalance = currentBalance + amount;
  } else {
    newBalance = currentBalance - amount;

    // Prevent negative balance
    if (newBalance < 0) {
      throw new Error(
        `Insufficient balance. Current: ${formatCurrencyMZN(currentBalance)}, ` +
        `Requested debit: ${formatCurrencyMZN(amount)}`
      );
    }
  }

  // Round to ensure precision
  newBalance = roundMZN(newBalance);

  // Generate immutable transaction hash
  const txHash = generateTxHash(userId, Math.abs(amount), type === 'CREDIT' ? 1 : -1);

  // Create entry
  const entry: LedgerEntry = {
    userId,
    type,
    reason,
    amountMZN: amount,
    txHash,
    rideId,
    description: description || getDefaultDescription(reason),
    metadata,
    balanceBeforeMZN: currentBalance,
    balanceAfterMZN: newBalance,
    isVerified: true,
    verifiedAt: new Date(),
    createdAt: new Date(),
  };

  return entry;
}

/**
 * Create ledger entry for ride completion
 * Splits fare into commission (platform) and payout (driver)
 */
export function createRideLedgerEntries(params: {
  driverId: string;
  rideId: string;
  finalFareMZN: number | string;
  commissionMZN: number | string;
  driverPayoutMZN: number | string;
  currentBalanceMZN: number | string;
  commissionRate: number;
}): [driverPayoutEntry: LedgerEntry, commissionEntry: LedgerEntry] {
  const {
    driverId,
    rideId,
    finalFareMZN,
    commissionMZN,
    driverPayoutMZN,
    currentBalanceMZN,
    commissionRate,
  } = params;

  const payoutAmount = typeof driverPayoutMZN === 'string' ? parseFloat(driverPayoutMZN) : driverPayoutMZN;
  const commissionAmount = typeof commissionMZN === 'string' ? parseFloat(commissionMZN) : commissionMZN;
  const currentBalance = typeof currentBalanceMZN === 'string' ? parseFloat(currentBalanceMZN) : currentBalanceMZN;
  const fareAmount = typeof finalFareMZN === 'string' ? parseFloat(finalFareMZN) : finalFareMZN;

  // Validate amounts match fare
  const calculatedFare = roundMZN(payoutAmount + commissionAmount);

  if (Math.abs(fareAmount - calculatedFare) > 0.001) {
    throw new Error(
      `Fare mismatch: ${fareAmount} ≠ ${calculatedFare}`
    );
  }

  // Create payout entry (CREDIT to driver)
  const payoutEntry = createLedgerEntry({
    userId: driverId,
    type: 'CREDIT',
    reason: 'RIDE_PAYOUT',
    amountMZN: payoutAmount,
    currentBalanceMZN: currentBalance,
    rideId,
    description: `Ride payout for ride ${rideId} (${commissionRate}% commission)`,
    metadata: {
      finalFareMZN: fareAmount,
      commissionMZN: commissionAmount,
      commissionRate,
    },
  });

  // MAKKO INTELLIGENCE: Create commission entry with proper balance calculation
  // Note: This would typically be recorded in a separate admin/platform account
  
  // Get current platform balance (in production, this would come from database)
  const platformBalanceBefore = getPlatformBalance(); // This function needs to be implemented
  const platformBalanceAfter = roundMZN(platformBalanceBefore + commissionAmount);
  
  const commissionEntry: LedgerEntry = {
    userId: 'SYSTEM_PLATFORM', // Platform commission account
    type: 'CREDIT',
    reason: 'COMMISSION',
    amountMZN: commissionAmount,
    txHash: generateTxHash('SYSTEM_PLATFORM', Math.abs(commissionAmount), 1),
    rideId,
    description: `Platform commission from ride ${rideId}`,
    metadata: {
      driverId,
      finalFareMZN: fareAmount,
      commissionRate,
      balanceCalculatedAt: new Date().toISOString(),
    },
    balanceBeforeMZN: platformBalanceBefore,
    balanceAfterMZN: platformBalanceAfter,
    isVerified: true,
    verifiedAt: new Date(),
    createdAt: new Date(),
  };

  // Update platform balance cache
  updatePlatformBalance(platformBalanceAfter);
  
  return [payoutEntry, commissionEntry];
}

/**
 * Create ledger entry for driver bonus
 */
export function createBonusLedgerEntry(params: {
  driverId: string;
  bonusAmountMZN: number | string;
  currentBalanceMZN: number | string;
  bonusReason: string;
  bonusId?: string;
}): LedgerEntry {
  const { driverId, bonusAmountMZN, currentBalanceMZN, bonusReason, bonusId } = params;

  return createLedgerEntry({
    userId: driverId,
    type: 'CREDIT',
    reason: 'BONUS',
    amountMZN: bonusAmountMZN,
    currentBalanceMZN,
    description: bonusReason,
    metadata: {
      bonusId,
      bonusReason,
    },
  });
}

/**
 * Create ledger entry for refund
 */
export function createRefundLedgerEntry(params: {
  userId: string;
  refundAmountMZN: number | string;
  currentBalanceMZN: number | string;
  refundReason: string;
  rideId?: string;
}): LedgerEntry {
  const { userId, refundAmountMZN, currentBalanceMZN, refundReason, rideId } = params;

  return createLedgerEntry({
    userId,
    type: 'CREDIT',
    reason: 'REFUND',
    amountMZN: refundAmountMZN,
    currentBalanceMZN,
    rideId,
    description: refundReason,
  });
}

// ============================================================================
// AUDIT & VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate ledger entry integrity
 */
export function validateLedgerEntry(entry: LedgerEntry): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate amount
  if (!isValidMZNAmount(entry.amountMZN)) {
    errors.push(`Invalid amount: ${entry.amountMZN}`);
  }

  // Validate balance consistency
  const calculatedBalance =
    entry.type === 'CREDIT'
      ? entry.balanceBeforeMZN + entry.amountMZN
      : entry.balanceBeforeMZN - entry.amountMZN;

  if (Math.abs(calculatedBalance - entry.balanceAfterMZN) > 0.001) {
    errors.push(
      `Balance mismatch: expected ${calculatedBalance}, ` +
      `got ${entry.balanceAfterMZN}`
    );
  }

  // Validate transaction hash
  const expectedTxHash = generateTxHash(
    entry.userId,
    Math.abs(entry.amountMZN),
    entry.type === 'CREDIT' ? 1 : -1
  );

  if (entry.txHash !== expectedTxHash) {
    errors.push(`Transaction hash mismatch: ${entry.txHash} ≠ ${expectedTxHash}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Audit ledger entries for a user
 */
export function auditLedgerEntries(entries: LedgerEntry[]): LedgerAuditReport {
  let totalCredit = 0;
  let totalDebit = 0;
  const discrepancies: DiscrepancyReport[] = [];

  entries.forEach((entry, index) => {
    const validation = validateLedgerEntry(entry);

    if (!validation.isValid) {
      validation.errors.forEach(error => {
        discrepancies.push({
          entryId: entry.id || `entry-${index}`,
          type: 'VALIDATION_ERROR',
          message: error,
          severity: 'HIGH',
        });
      });
    }

    if (entry.type === 'CREDIT') {
      totalCredit += entry.amountMZN;
    } else {
      totalDebit += entry.amountMZN;
    }
  });

  const roundedCredit = roundMZN(totalCredit);
  const roundedDebit = roundMZN(totalDebit);
  const netBalance = roundMZN(roundedCredit - roundedDebit);

  return {
    totalCredit: roundedCredit,
    totalDebit: roundedDebit,
    netBalance,
    entryCount: entries.length,
    discrepancies,
    isValid: discrepancies.length === 0,
  };
}

/**
 * Generate audit report summary
 */
export function generateAuditSummary(report: LedgerAuditReport): string {
  return `
═══════════════════════════════════════════════════
         RULIAL LEDGER AUDIT REPORT
═══════════════════════════════════════════════════

Total Credits:     ${formatCurrencyMZN(report.totalCredit)}
Total Debits:      ${formatCurrencyMZN(report.totalDebit)}
Net Balance:       ${formatCurrencyMZN(report.netBalance)}
Entry Count:       ${report.entryCount}

Status:            ${report.isValid ? '✓ VALID' : '✗ DISCREPANCIES FOUND'}

${
  report.discrepancies.length > 0
    ? `\nDiscrepancies (${report.discrepancies.length}):\n${report.discrepancies
        .map(
          d =>
            `  [${d.severity}] ${d.entryId}: ${d.message}`
        )
        .join('\n')}`
    : '\nNo discrepancies detected.'
}

═══════════════════════════════════════════════════
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default description based on ledger reason
 */
function getDefaultDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    RIDE_PAYOUT: 'Payment for completed ride',
    COMMISSION: 'Platform commission',
    BONUS: 'Incentive bonus',
    REFUND: 'Refund',
    WITHDRAWAL: 'Cash withdrawal',
    SYSTEM_ADJUST: 'System adjustment',
  };

  return descriptions[reason] || 'Transaction';
}

/**
 * Calculate cumulative balance from ledger entries
 */
export function calculateCumulativeBalance(
  entries: LedgerEntry[],
  startingBalance: number | string = 0
): number {
  const start = typeof startingBalance === 'string' ? parseFloat(startingBalance) : startingBalance;
  
  const sum = entries.reduce((balance, entry) => {
    if (entry.type === 'CREDIT') {
      return balance + entry.amountMZN;
    } else {
      return balance - entry.amountMZN;
    }
  }, start);
  
  return roundMZN(sum);
}

/**
 * Get ledger summary for a date range
 */
export function getLedgerSummary(
  entries: LedgerEntry[],
  startDate?: Date,
  endDate?: Date
): {
  periodCredit: number;
  periodDebit: number;
  periodNet: number;
  entryCount: number;
} {
  const filtered = entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });

  let credit = 0;
  let debit = 0;

  filtered.forEach(entry => {
    if (entry.type === 'CREDIT') {
      credit += entry.amountMZN;
    } else {
      debit += entry.amountMZN;
    }
  });

  const roundedCredit = roundMZN(credit);
  const roundedDebit = roundMZN(debit);

  return {
    periodCredit: roundedCredit,
    periodDebit: roundedDebit,
    periodNet: roundMZN(roundedCredit - roundedDebit),
    entryCount: filtered.length,
  };
}
