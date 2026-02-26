/**
 * TUMA TAXI - GEO-BRIDGE CONFIGURATION
 * 
 * PURPOSE: Dynamic geographic center toggle for testing and production
 * 
 * REGIONS:
 * - MAPUTO: Production deployment (Mozambique)
 * - NJ: Local testing (Carneys Point, New Jersey, USA)
 * 
 * USAGE:
 * ```typescript
 * import { getGeoConfig } from '@/config/geo';
 * 
 * const config = getGeoConfig();
 * console.log(config.centerCoordinates); // { lat: -25.9692, lng: 32.5732 }
 * ```
 * 
 * ENVIRONMENT:
 * Set NEXT_PUBLIC_APP_REGION in .env.local to "NJ" or "MAPUTO"
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface GeoConfig {
  region: 'MAPUTO' | 'NJ';
  centerCoordinates: GeoCoordinates;
  currency: 'MZN' | 'USD';
  currencySymbol: string;
  timezone: string;
  locale: string;
  geofenceRadiusKm: number;
  geofenceRadiusMiles: number;
  testRadiusKm: number; // For simulated rides
  testRadiusMiles: number;
  displayName: string;
  countryCode: string;
}

// ============================================================================
// REGION CONFIGURATIONS
// ============================================================================

const MAPUTO_CONFIG: GeoConfig = {
  region: 'MAPUTO',
  centerCoordinates: {
    lat: -25.9692,
    lng: 32.5732,
  },
  currency: 'MZN',
  currencySymbol: 'MZN',
  timezone: 'Africa/Maputo',
  locale: 'pt-MZ',
  geofenceRadiusKm: 15,
  geofenceRadiusMiles: 9.32,
  testRadiusKm: 5, // 3 miles ≈ 4.8km, round to 5
  testRadiusMiles: 3,
  displayName: 'Maputo',
  countryCode: 'MZ',
};

const NJ_CONFIG: GeoConfig = {
  region: 'NJ',
  centerCoordinates: {
    lat: 39.7136,
    lng: -75.4675,
  },
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'America/New_York',
  locale: 'en-US',
  geofenceRadiusKm: 15,
  geofenceRadiusMiles: 9.32,
  testRadiusKm: 5,
  testRadiusMiles: 3,
  displayName: 'Carneys Point, NJ',
  countryCode: 'US',
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Get current geographic configuration based on environment variable
 * 
 * Reads NEXT_PUBLIC_APP_REGION from environment:
 * - "NJ" → New Jersey (Carneys Point) for local testing
 * - "MAPUTO" (default) → Mozambique for production
 * 
 * @returns GeoConfig object with coordinates, currency, timezone, etc.
 */
export function getGeoConfig(): GeoConfig {
  const region = process.env.NEXT_PUBLIC_APP_REGION?.toUpperCase();

  if (region === 'NJ') {
    return NJ_CONFIG;
  }

  // Default to Maputo for production
  return MAPUTO_CONFIG;
}

/**
 * Check if current region is New Jersey (testing mode)
 */
export function isTestingRegion(): boolean {
  return getGeoConfig().region === 'NJ';
}

/**
 * Check if current region is Maputo (production mode)
 */
export function isProductionRegion(): boolean {
  return getGeoConfig().region === 'MAPUTO';
}

/**
 * Generate random coordinates within test radius of center
 * Used for simulated rides during development/testing
 * 
 * @param radiusKm - Optional radius override (default: config.testRadiusKm)
 * @returns Random GeoCoordinates within radius
 */
export function generateRandomCoordinates(radiusKm?: number): GeoCoordinates {
  const config = getGeoConfig();
  const radius = radiusKm || config.testRadiusKm;
  
  // Convert km to degrees (approximate)
  // 1 degree ≈ 111 km
  const radiusDegrees = radius / 111;
  
  // Generate random angle
  const angle = Math.random() * 2 * Math.PI;
  
  // Generate random distance within radius
  const distance = Math.random() * radiusDegrees;
  
  // Calculate offset
  const deltaLat = distance * Math.cos(angle);
  const deltaLng = distance * Math.sin(angle);
  
  return {
    lat: config.centerCoordinates.lat + deltaLat,
    lng: config.centerCoordinates.lng + deltaLng,
  };
}

/**
 * Generate pickup and dropoff coordinates for simulated ride
 * Ensures dropoff is different from pickup
 */
export function generateSimulatedRideCoordinates(): {
  pickup: GeoCoordinates;
  dropoff: GeoCoordinates;
} {
  const pickup = generateRandomCoordinates();
  
  // Generate dropoff at least 0.5km away from pickup
  let dropoff = generateRandomCoordinates();
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure pickup and dropoff are different (min 0.5km apart)
  while (attempts < maxAttempts) {
    const distance = calculateDistance(pickup, dropoff);
    if (distance >= 0.5) break;
    dropoff = generateRandomCoordinates();
    attempts++;
  }
  
  return { pickup, dropoff };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  const R = 6371; // Earth's radius in km
  
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================================================
// LEGACY CONSTANTS (For backwards compatibility)
// ============================================================================

/**
 * @deprecated Use getGeoConfig().centerCoordinates instead
 */
export const MAPUTO_COORDS = MAPUTO_CONFIG.centerCoordinates;

/**
 * @deprecated Use getGeoConfig().centerCoordinates instead
 */
export const DEFAULT_CENTER = getGeoConfig().centerCoordinates;
