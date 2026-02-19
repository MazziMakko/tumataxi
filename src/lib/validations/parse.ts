/**
 * Parse JSON body with Zod schema; return 400 NextResponse on failure.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function parseOr400<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const err = result.error;
  const message = typeof (err as { message?: string }).message === 'string'
    ? (err as { message: string }).message
    : Array.isArray((err as { issues?: Array<{ message: string }> }).issues)
      ? (err as { issues: Array<{ message: string }> }).issues.map((e) => e.message).join('; ')
      : 'Validation failed';
  return {
    success: false,
    response: NextResponse.json(
      { error: message },
      { status: 400 }
    ),
  };
}
