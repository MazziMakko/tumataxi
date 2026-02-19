# STABILIZE — Env & Supabase (Pillar 2)

## Required .env keys (run now)

Ensure these exist in `.env.local` (or Vercel env):

| Key | Required | Note |
|-----|----------|------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | No | Canonical URL for sitemap/robots (e.g. https://tumataxi.com) |
| `NEXT_PUBLIC_DEV_AUTO_APPROVE` | No | "true" to auto-approve drivers (dev only) |

Auth is **Supabase only**; NEXTAUTH_* in .env.example are legacy/unused.

## Supabase / SQL migrations

1. **Schema**  
   From project root:
   ```bash
   npx prisma db push
   ```
   or
   ```bash
   npx prisma migrate deploy
   ```

2. **Realtime (Ride table)**  
   Run once:
   ```bash
   npx tsx scripts/apply-supabase-setup.ts
   ```
   Or in Supabase SQL Editor run `scripts/supabase-setup.sql` (ensure `Ride` is in the Realtime publication).

3. **RLS**  
   Apply Row Level Security policies in Supabase Dashboard (or via migrations) so:
   - Tables used by the app (User, DriverProfile, Ride, etc.) have policies that match your auth (e.g. service role for API, or RLS per role).
   - Document any custom policies in this repo so they stay in sync.

## After deploy

- Hit `/sitemap.xml` and `/robots.txt` to confirm they render.
- Confirm `/privacy` and `/terms` load without auth.
