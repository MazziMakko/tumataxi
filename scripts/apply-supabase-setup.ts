/**
 * Apply Supabase DB setup using DATABASE_URL from .env
 * - Adds Ride table to supabase_realtime publication (for driver matching)
 * Run: npx tsx scripts/apply-supabase-setup.ts
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env or .env.local
for (const f of ['.env.local', '.env']) {
  const p = resolve(process.cwd(), f);
  if (existsSync(p)) {
    const content = readFileSync(p, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    break;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes('supabase')) {
    console.warn('DATABASE_URL not set or not Supabase. Skipping.');
    process.exit(0);
  }

  const prisma = new PrismaClient();

  const statements = [
    { name: 'Add Ride to realtime (PascalCase)', sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE "Ride"' },
    { name: 'Add Ride to realtime (lowercase)', sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE ride' },
  ];

  for (const { name, sql } of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK:', name);
      break;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === '42710' || (err.message && err.message.includes('already'))) {
        console.log('SKIP (already in publication):', name);
        break;
      }
      if (err.code === '42P01' || (err.message && err.message.includes('does not exist'))) {
        console.log('SKIP (table name mismatch):', name);
        continue;
      }
      console.warn('Error:', name, err.message ?? e);
    }
  }

  await prisma.$disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
