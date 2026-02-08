/**
 * Prisma Client Instance
 * Initialize and export Prisma client (optional for frontend-only mode)
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

// Only initialize Prisma if DATABASE_URL is available
export const prisma = process.env.DATABASE_URL
  ? (globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
