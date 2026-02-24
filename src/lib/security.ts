/**
 * MAKKO INTELLIGENCE - API SECURITY MIDDLEWARE
 * 
 * PURPOSE: Protect all admin and financial endpoints
 * 
 * FEATURES:
 * - API key authentication
 * - Rate limiting
 * - CORS configuration
 * - Admin role verification
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

// In-memory rate limiting (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// AUTHENTICATION
// ============================================================================

export function requireAdminAuth(request: NextRequest): NextResponse | null {
  // Check for API key in Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing or invalid API key' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.replace('Bearer ', '');

  // Validate API key
  if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Invalid API key' },
      { status: 403 }
    );
  }

  // Authentication successful
  return null;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export function applyRateLimit(
  request: NextRequest,
  identifier?: string
): NextResponse | null {
  // Use IP address as identifier (or custom identifier)
  const ip = identifier || request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(ip);

  // Check if rate limit entry exists and is still valid
  if (rateLimitData) {
    if (now < rateLimitData.resetAt) {
      // Window is still active
      if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Try again later.',
            retryAfter: Math.ceil((rateLimitData.resetAt - now) / 1000),
          },
          { status: 429 }
        );
      }

      // Increment count
      rateLimitData.count++;
    } else {
      // Window expired, reset
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }
  } else {
    // Create new rate limit entry
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  // Rate limit check passed
  return null;
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export function applyCORS(response: NextResponse): NextResponse {
  // Allow only specific origins in production
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://tumataxi.vercel.app',
    'https://tumataxi.co.mz',
  ];

  response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export async function logAPIAccess(
  request: NextRequest,
  response: NextResponse,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      ip: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      status: response.status,
      metadata,
    };

    console.log('[API Access]', JSON.stringify(logEntry));

    // In production, send to logging service (e.g., Sentry, LogDNA)
    // await sendToLoggingService(logEntry);
  } catch (error) {
    console.error('Failed to log API access:', error);
  }
}

// ============================================================================
// COMBINED MIDDLEWARE
// ============================================================================

export function secureAdminEndpoint(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 1. Apply rate limiting
    const rateLimitError = applyRateLimit(request);
    if (rateLimitError) return applyCORS(rateLimitError);

    // 2. Require authentication
    const authError = requireAdminAuth(request);
    if (authError) return applyCORS(authError);

    // 3. Execute handler
    try {
      const response = await handler(request);
      
      // 4. Apply CORS
      const finalResponse = applyCORS(response);

      // 5. Log access
      await logAPIAccess(request, finalResponse);

      return finalResponse;
    } catch (error) {
      console.error('API handler error:', error);
      
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      
      return applyCORS(errorResponse);
    }
  };
}

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required environment variables
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ADMIN_API_KEY',
  ];

  for (const varName of required) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate API key strength
  if (process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY.length < 32) {
    errors.push('ADMIN_API_KEY must be at least 32 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
