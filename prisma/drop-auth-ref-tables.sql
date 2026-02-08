-- Drop ALL public schema tables that have FK to auth.users
-- Run: npx prisma db execute --file prisma/drop-auth-ref-tables.sql
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT rel.relname
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE c.confrelid = 'auth.users'::regclass
    AND nsp.nspname = 'public'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.relname);
  END LOOP;
END $$;
