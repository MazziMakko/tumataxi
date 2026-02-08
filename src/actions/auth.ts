'use server';

/**
 * Server Actions for Auth
 * Role assignment on sign-up, post-login redirect
 */
import { prisma } from '@/lib/prisma';

export async function loginAndRedirect(authId: string): Promise<string> {
  if (!prisma) return '/';

  const user = await prisma.user.findUnique({
    where: { authId },
    select: { role: true },
  });

  if (!user) return '/';

  switch (user.role) {
    case 'DRIVER':
      return '/driver/dashboard';
    case 'PASSENGER':
    case 'RIDER':
      return '/ride/map';
    case 'ADMIN':
      return '/driver/dashboard';
    default:
      return '/ride/map';
  }
}

export async function assignRoleOnSignup(
  authId: string,
  email: string,
  firstName: string,
  lastName: string,
  role: 'DRIVER' | 'PASSENGER'
): Promise<{ success: boolean; error?: string }> {
  if (!prisma) return { success: false, error: 'Database not configured' };

  try {
    await prisma.user.upsert({
      where: { authId },
      update: {
        firstName,
        lastName,
        role,
      },
      create: {
        authId,
        email,
        firstName,
        lastName,
        role,
        emailVerified: true,
      },
    });
    return { success: true };
  } catch (e) {
    console.error('assignRoleOnSignup error:', e);
    return { success: false, error: 'Failed to create user' };
  }
}
