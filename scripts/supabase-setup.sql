-- Tuma Taxi – Supabase setup (run in SQL Editor or via apply script)
-- 1. Enable Realtime for Ride table so driver dashboard receives new requests

-- Prisma creates table as "Ride" (PascalCase). If your table is lowercase "ride", use the second line.
ALTER PUBLICATION supabase_realtime ADD TABLE "Ride";
-- ALTER PUBLICATION supabase_realtime ADD TABLE ride;
