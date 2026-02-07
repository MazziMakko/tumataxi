/**
 * MOZAMBIQUE LOCALIZATION CONFIGURATION
 * Tuma Taxi - Mozambique Edition
 *
 * Currency: MZN (Mozambican Metical)
 * Timezone: Africa/Maputo (CAT - Central Africa Time, UTC+2)
 * Language: Portuguese (pt-MZ)
 */

// ============================================================================
// CURRENCY CONFIGURATION
// ============================================================================

export const CURRENCY = {
  CODE: 'MZN',
  SYMBOL: 'MT', // Alternative: 'Mtn'
  NAME: 'Mozambican Metical',
  DECIMAL_PLACES: 2,
  DECIMAL_SEPARATOR: ',',
  THOUSANDS_SEPARATOR: '.',
} as const;

/**
 * Format amount to MZN currency string
 * Example: 1234.56 → "1.234,56 MT"
 */
export function formatCurrencyMZN(
  amount: number | string,
  _symbol: boolean = true,
  locale: string = 'pt-MZ'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  return formatted;
}

/**
 * Parse MZN string to number
 * Example: "1.234,56 MT" → 1234.56
 */
export function parseCurrencyMZN(value: string): number {
  // Remove currency symbol
  let cleaned = value.replace(/[^\d,.-]/g, '');

  // Handle Mozambique format: 1.234,56
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Remove thousands separator (.) and replace decimal separator (,) with (.)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only comma present - it's the decimal separator
    cleaned = cleaned.replace(',', '.');
  }

  return parseFloat(cleaned);
}

// ============================================================================
// TIMEZONE CONFIGURATION
// ============================================================================

export const TIMEZONE = {
  NAME: 'Africa/Maputo',
  ABBREVIATION: 'CAT',
  UTC_OFFSET: '+02:00',
  DAYLIGHT_SAVING: false, // Mozambique does not observe DST
} as const;

/**
 * Convert UTC timestamp to Mozambique local time
 */
export function toLocalTime(date: Date = new Date()): Date {
  return new Date(
    date.toLocaleString('pt-MZ', { timeZone: TIMEZONE.NAME })
  );
}

/**
 * Format date/time for Mozambique display
 */
export function formatDateMZ(
  date: Date,
  format: 'short' | 'long' | 'datetime' = 'short'
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE.NAME,
  };

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('pt-MZ', {
        ...options,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);

    case 'long':
      return new Intl.DateTimeFormat('pt-MZ', {
        ...options,
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);

    case 'datetime':
      return new Intl.DateTimeFormat('pt-MZ', {
        ...options,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);

    default:
      return date.toISOString();
  }
}

/**
 * Get current time in Maputo timezone
 */
export function getNowMaputo(): Date {
  return new Date(
    new Date().toLocaleString('pt-MZ', { timeZone: TIMEZONE.NAME })
  );
}

// ============================================================================
// LOCALE & LANGUAGE CONFIGURATION
// ============================================================================

export const LOCALE = {
  CODE: 'pt-MZ',
  LANGUAGE: 'pt', // Portuguese
  COUNTRY: 'MZ', // Mozambique
  NAME: 'Português (Moçambique)',
  NATIVE_NAME: 'Português de Moçambique',
} as const;

/**
 * Localized labels and messages for Mozambique
 */
export const LABELS_MZ = {
  CURRENCY: 'Metical',
  TIMEZONE: 'Horário de Maputo',
  WELCOME: 'Bem-vindo à Tuma Taxi',
  LANGUAGE: 'Português (Moçambique)',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm:ss',

  // Driver-specific labels
  DRIVER_TIER_BRONZE: 'Bronze',
  DRIVER_TIER_SILVER: 'Prata',
  DRIVER_TIER_GOLD: 'Ouro',

  // Vehicle types (popular in Mozambique)
  VEHICLE_CHAPAS: 'Chapas',
  VEHICLE_TAXI: 'Táxi',
  VEHICLE_PRIVATE: 'Veículo Privado',

  // Ride status
  RIDE_REQUESTED: 'Solicitado',
  RIDE_MATCHED: 'Motorista Encontrado',
  RIDE_ARRIVED: 'Motorista Chegou',
  RIDE_IN_PROGRESS: 'Em Progresso',
  RIDE_COMPLETED: 'Concluído',
  RIDE_CANCELLED: 'Cancelado',

  // Commission
  COMMISSION: 'Comissão',
  DRIVER_PAYOUT: 'Ganho do Motorista',
  COMMISSION_RATE: 'Taxa de Comissão',

  // Ledger
  CREDIT: 'Crédito',
  DEBIT: 'Débito',
} as const;

// ============================================================================
// DISTANCE & MEASUREMENT CONFIGURATION
// ============================================================================

export const MEASUREMENTS = {
  DISTANCE_UNIT: 'km', // Kilometers (standard in Mozambique)
  SPEED_UNIT: 'km/h',
  TEMPERATURE_UNIT: 'C', // Celsius
} as const;

/**
 * Convert kilometers to display format
 */
export function formatDistance(km: number, precision: number = 1): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(precision)} ${MEASUREMENTS.DISTANCE_UNIT}`;
}

/**
 * Convert minutes to human-readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

// ============================================================================
// NETWORK OPTIMIZATION (3G-friendly)
// ============================================================================

/**
 * Optimize data for low-bandwidth networks (3G)
 * Returns configuration for data compression and caching
 */
export const NETWORK_OPTIMIZATION = {
  // Image compression
  IMAGE_QUALITY: 0.6, // 60% quality
  IMAGE_MAX_WIDTH: 800,
  IMAGE_MAX_HEIGHT: 600,

  // Data compression
  ENABLE_GZIP: true,
  ENABLE_BROTLI: true,

  // Caching strategy
  CACHE_TTL_SECONDS: 3600, // 1 hour
  CACHE_STRATEGY: 'stale-while-revalidate',

  // API optimization
  BATCH_REQUESTS: true,
  REQUEST_TIMEOUT_MS: 15000, // 15 seconds (3G friendly)

  // Location updates (3G friendly)
  LOCATION_UPDATE_INTERVAL_MS: 30000, // 30 seconds
  LOCATION_PRECISION: 4, // Decimal places
} as const;

/**
 * Get network-optimized API timeout based on connection type
 */
export function getOptimizedTimeout(
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' = '3g'
): number {
  const timeouts = {
    'slow-2g': 30000,
    '2g': 25000,
    '3g': 15000,
    '4g': 10000,
    '5g': 5000,
  };

  return timeouts[connectionType];
}

// ============================================================================
// PLATFORM CONFIGURATION BUNDLE
// ============================================================================

export const MOZAMBIQUE_CONFIG = {
  CURRENCY,
  TIMEZONE,
  LOCALE,
  LABELS_MZ,
  MEASUREMENTS,
  NETWORK_OPTIMIZATION,
} as const;
