'use server';

/**
 * Server Actions for Auth
 * Role assignment on sign-up, post-login redirect, ensure user exists in DB
 */
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type AppRole = 'DRIVER' | 'PASSENGER' | 'RIDER' | 'ADMIN';

function getRedirectForRole(role: AppRole): string {
  switch (role) {
    case 'DRIVER':
    case 'ADMIN':
      return '/driver/dashboard';
    case 'PASSENGER':
    case 'RIDER':
    default:
      return '/ride/map';
  }
}

/**
 * Ensure User exists in DB. Create from Supabase metadata if missing.
 */
async function ensureUserInDb(
  authId: string,
  email: string,
  role: AppRole,
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean; role: AppRole }> {
  if (!prisma) return { success: false, role: 'PASSENGER' };

  const existing = await prisma.user.findUnique({ where: { authId }, select: { role: true } });
  if (existing) return { success: true, role: existing.role as AppRole };

  try {
    await prisma.user.create({
      data: {
        authId,
        email,
        firstName: firstName ?? email.split('@')[0],
        lastName: lastName ?? '',
        role,
        emailVerified: true,
      },
    });
    return { success: true, role };
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      const byEmail = await prisma.user.findUnique({ where: { email }, select: { authId: true, role: true } });
      if (byEmail && !byEmail.authId) {
        await prisma.user.update({ where: { email }, data: { authId, role } });
        return { success: true, role };
      }
    }
    console.error('ensureUserInDb error:', e);
    return { success: false, role: 'PASSENGER' };
  }
}

export async function loginAndRedirect(authId: string): Promise<{ destination: string; role: AppRole }> {
  const fallback = { destination: '/', role: 'PASSENGER' as AppRole };
  if (!prisma) return fallback;

  let user = await prisma.user.findUnique({ where: { authId }, select: { role: true } });

  if (!user) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || authUser.id !== authId) return fallback;

    const meta = authUser.user_metadata ?? {};
    const role = (meta.role as AppRole) ?? (authUser.app_metadata?.role as AppRole) ?? 'PASSENGER';
    const { success } = await ensureUserInDb(
      authId,
      authUser.email ?? '',
      role,
      meta.first_name ?? meta.firstName,
      meta.last_name ?? meta.lastName
    );
    if (!success) return fallback;
    let dest = getRedirectForRole(role);
    if (role === 'DRIVER' || role === 'ADMIN') {
      const withProfile = await prisma.user.findUnique({
        where: { authId },
        select: { driverProfile: { select: { userId: true } } },
      });
      if (!withProfile?.driverProfile) dest = '/driver/onboarding';
    }
    return { destination: dest, role };
  }

  const userRole = user.role as AppRole;
  let destination = getRedirectForRole(userRole);
  // Drivers without a profile must complete onboarding first (avoid dashboard → onboarding flash)
  if (userRole === 'DRIVER' || userRole === 'ADMIN') {
    const withProfile = await prisma.user.findUnique({
      where: { authId },
      select: { driverProfile: { select: { userId: true } } },
    });
    if (!withProfile?.driverProfile) destination = '/driver/onboarding';
  }
  return { destination, role: userRole };
}

export async function assignRoleOnSignup(
  authId: string,
  email: string,
  firstName: string,
  lastName: string,
  role: 'DRIVER' | 'PASSENGER'
): Promise<{ success: boolean; error?: string }> {
  const fail = (error: string): { success: boolean; error: string } => ({ success: false, error });
  try {
    if (!prisma) {
      return fail('Base de dados não configurada. Defina DATABASE_URL no .env.');
    }
    if (!authId || typeof email !== 'string' || !email.trim()) {
      return fail('Dados inválidos (email ou sessão em falta).');
    }

    const safeFirstName = (typeof firstName === 'string' ? firstName.trim() : '') || email.split('@')[0] || 'User';
    const safeLastName = (typeof lastName === 'string' ? lastName.trim() : '') || '';

    await prisma.user.upsert({
      where: { authId },
      update: { firstName: safeFirstName, lastName: safeLastName, role },
      create: {
        authId,
        email: email.trim().toLowerCase(),
        firstName: safeFirstName,
        lastName: safeLastName,
        role,
        emailVerified: true,
      },
    });
    return { success: true };
  } catch (e) {
    console.error('assignRoleOnSignup error:', e);
    try {
      if (e && typeof e === 'object' && 'code' in e) {
        const code = (e as { code: string }).code;
        if (code === 'P2002') {
          const byAuth = prisma ? await prisma.user.findUnique({ where: { authId } }) : null;
          if (byAuth) return { success: true };
          return fail('Este email já está registado. Use Entrar para aceder.');
        }
        if (code === 'P2003') return fail('Erro de referência na base de dados. Tente novamente.');
      }
      const msg = e instanceof Error ? e.message : String(e);
      if (/connect|Connection|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
        return fail('Sem ligação à base de dados. Verifique DATABASE_URL e rede.');
      }
    } catch (inner) {
      console.error('assignRoleOnSignup inner error:', inner);
    }
    return fail('Erro ao criar perfil. Tente novamente.');
  }
}
