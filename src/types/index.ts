// Tuma Taxi - Type Definitions
// Mozambique Edition

import { Decimal } from 'decimal.js';

// ============================================================================
// RULIAL LOGIC TYPES
// ============================================================================

export interface DriverMetrics {
  currentTier: 'BRONZE' | 'SILVER' | 'GOLD';
  totalRidesCompleted: number;
  weeklyRidesCompleted: number;
  rating: number; // 1.0 to 5.0
}

export interface CommissionOutput {
  commissionRate: number; // Percentage (e.g., 17.0, 15.0, 12.0)
  finalFareMZN: Decimal;
  commissionMZN: Decimal;
  driverPayoutMZN: Decimal;
  appliedTier: 'BRONZE' | 'SILVER' | 'GOLD';
  reason: string; // Explanation of tier & commission rate
  instantPayoutEligible: boolean;
}

export interface RulialState {
  driverId: string;
  metrics: DriverMetrics;
  commission: CommissionOutput;
  timestamp: Date;
  txHash: string; // Immutable transaction identifier
}

// ============================================================================
// RIDE TYPES
// ============================================================================

export interface RideRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffAddress: string;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
}

export interface RideLocation {
  latitude: number;
  longitude: number;
  address: string;
}

// ============================================================================
// LOCALIZATION (MOZAMBIQUE)
// ============================================================================

export const MOZAMBIQUE_TIMEZONE = 'Africa/Maputo';
export const MOZAMBIQUE_LOCALE = 'pt-MZ';
export const MOZAMBIQUE_CURRENCY = 'MZN';

// MZN Formatting options
export const MZN_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'MZN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// ============================================================================
// NETWORK OPTIMIZATION (3G FRIENDLY)
// ============================================================================

export interface CompressedRideData {
  id: string;
  s: string; // status
  f: number; // finalFareMZN
  d: string; // driverId
  r: string; // riderId
  c: number; // commissionRate
}
