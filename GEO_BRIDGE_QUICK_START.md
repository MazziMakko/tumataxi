# 🌍 GEO-BRIDGE QUICK START GUIDE

## TO SWITCH TO NEW JERSEY TESTING MODE:

1. **Create or modify `.env.local` in the project root**:
   ```bash
   NEXT_PUBLIC_APP_REGION="NJ"
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

3. **Verify the map centers on Carneys Point, NJ**:
   - Open http://localhost:3000/driver/dashboard
   - Map should show coordinates: **39.7136, -75.4675**

---

## TO SWITCH BACK TO MAPUTO (PRODUCTION):

1. **Modify `.env.local`**:
   ```bash
   NEXT_PUBLIC_APP_REGION="MAPUTO"
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

3. **Verify the map centers on Maputo, Mozambique**:
   - Open http://localhost:3000/driver/dashboard
   - Map should show coordinates: **-25.9692, 32.5732**

---

## TESTING THE GEO-BRIDGE:

Run the test script to verify everything is working:

```bash
npx tsx scripts/test-geo-bridge.ts
```

Expected output: All tests pass, showing the active region configuration.

---

## IMPORTANT NOTES:

- ⚠️ **ALWAYS** restart your dev server after changing `NEXT_PUBLIC_APP_REGION`
- ⚠️ Environment variables starting with `NEXT_PUBLIC_` are read at build time
- ⚠️ Clear your browser cache if the map doesn't update
- ⚠️ For production deployment, set `NEXT_PUBLIC_APP_REGION="MAPUTO"` in Vercel

---

## FILES AFFECTED:

✅ All hardcoded Maputo coordinates have been replaced with dynamic config  
✅ All map components now read from `getGeoConfig()`  
✅ All API routes use dynamic coordinates  
✅ Seed scripts use dynamic coordinates  
✅ TypeScript checks pass with no errors

---

## DOCUMENTATION:

Full implementation details: `docs/GEO_BRIDGE_IMPLEMENTATION.md`
