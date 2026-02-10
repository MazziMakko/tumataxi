# MAKKO INTELLIGENCE™ — Deployment & Golden Loop Critical Audit

**Status:** `AUDIT_COMPLETE`  
**Scope:** TumaTaxi build vs. MAKKO AUTH REPAIR & DEPLOYMENT STRATEGY (Steps 1–4)  
**Goal:** Predict critical failures and list what’s missing so deployment and Golden Loop tests succeed.

---

## 1. Step-by-step validation

### STEP 1: Deploy (git push)

- **Instruction:** `git add .` → `git commit -m "..."` → `git push origin main`
- **Codebase:** No code blocks this. Uncommitted changes in `prisma/schema.prisma`, `src/actions/auth.ts`, `src/app/auth/callback/route.ts`, `src/app/auth/login/page.tsx`, `src/app/api/driver/onboarding/route.ts` will deploy once pushed.
- **Risk:** **LOW** — Ensure `DATABASE_URL` and Supabase env vars are set in Vercel; otherwise runtime 503/DB errors.

---

### STEP 2: “God mode” env var (Vercel)

- **Instruction:** Add `NEXT_PUBLIC_DEV_AUTO_APPROVE=true` in Vercel (Production, Preview, Development) and redeploy.
- **Codebase:** Used in `src/app/api/driver/onboarding/route.ts` (lines 90 and 104):
  - `verificationStatus: process.env.NEXT_PUBLIC_DEV_AUTO_APPROVE === 'true' ? 'APPROVED' : 'PENDING'`
- **Risk:** **LOW** — Server reads env at request time. After redeploy, new driver signups get `APPROVED` and skip “A aguardar aprovação”.
- **Gap:** `.env.example` does not document this variable. Add it so future deploys don’t forget.

---

### STEP 3: Golden Loop test

#### 3A. Driver test (Incognito)

| Action | Code path | Prediction |
|--------|-----------|------------|
| Sign up `driver_maputo@test.com` | `/auth/signup` → `assignRoleOnSignup` + Supabase `signUp` | OK |
| Select “Conduzir com Tuma” (Drive) | `role === 'DRIVER'` | OK |
| Onboarding (Name/Vehicle/Docs) | `/driver/onboarding` → `POST /api/driver/onboarding` | OK if `NEXT_PUBLIC_DEV_AUTO_APPROVE=true` on Vercel |
| Land on Dashboard (no “Pending”) | Dashboard reads `profile.verificationStatus`; if `APPROVED`, shows main UI | OK |
| Click “Ficar Online” / “IR ONLINE” | `POST /api/driver/go-online` with `authId`, `isOnline: true`, `lat`/`lng` | OK |

**Possible failure (edge case):**

- **Supabase email confirmation:** If “Confirm email” is enabled, after signup `data.session` can be null and user sees “Verifique o seu email”. After confirming, they must use **Login** (not callback). Login uses `loginAndRedirect` and syncs user to DB; then redirect to `/driver/dashboard`. Dashboard calls `/api/driver/me`; if no `DriverProfile` (onboarding not done), redirects to `/driver/onboarding`. So flow holds, but test must use **Login** after email confirm.

**Verdict 3A:** Driver path should work **if** env var is set and redeploy done. No critical code bug.

---

#### 3B. Rider test (Browser 2)

| Action | Code path | Prediction |
|--------|-----------|------------|
| Sign up `rider_maputo@test.com` | `/auth/signup` → role PASSENGER → redirect `/ride/map` | OK |
| Land on Map (Maputo) | `/ride/map` — Map centered on MAPUTO | OK |
| Enter destination, select “Economia”, click “Solicitar” | **Current code:** `onClick` → `alert('Viagem solicitada! (Demo)')` only. **No API call. No ride created.** | **FAIL** |

**Critical failure:**

- In `src/app/ride/map/page.tsx` (lines 93–97) the “Pedir viagem” button only runs:
  - `onClick={() => selectedRide && alert('Viagem solicitada! (Demo)')}`
- There is **no** `POST /api/rides` (or similar) to create a ride.
- So **Step 3B will not create any ride in the database.** The “Golden Loop” breaks at rider request.

**Verdict 3B:** **Will fail** until the rider map calls a real “create ride request” API and that API exists.

---

### STEP 4: Realtime matching (if driver doesn’t see request)

- **Instruction:** Enable Realtime on `rides` in Supabase; add `useEffect` in Driver Dashboard to listen for new rows.
- **Codebase today:**
  - **Driver dashboard** (`src/app/driver/dashboard/page.tsx`): Fetches `/api/driver/me` once on mount. **No subscription, no polling** for new rides.
  - **Rides API:** There is **no** `POST /api/rides` (or `/api/rides/request`) to create a ride. So no rows are inserted for rider actions.
  - **Accept/Decline:** `POST /api/rides/accept` and `POST /api/rides/decline` expect an **existing** `Ride` with `status: REQUESTED`. So something must create that row first.
- **Schema:** `Ride` in `prisma/schema.prisma` has **required** `driverId` and `riderId`. So you cannot create a “rider-only” request with `status: REQUESTED` and no driver without a schema or model change (e.g. optional `driverId` or a separate request table).

**Verdict Step 4:** Realtime is the right next step, but it will have nothing to listen to until:
1. Rider can create a ride (or ride request) via API.
2. Either `Ride.driverId` is optional for `REQUESTED` or a separate “RideRequest” flow exists and is wired to a `Ride` on accept.

---

## 2. Critical errors summary (will cause failures)

| # | Issue | Where | Impact |
|---|--------|--------|--------|
| 1 | Rider “Solicitar” does not call any API | `src/app/ride/map/page.tsx` | Step 3B does not create a ride; driver has nothing to see. |
| 2 | No API to create a ride (rider request) | Missing `POST /api/rides` or `POST /api/rides/request` | No ride rows → accept/decline and realtime have no data. |
| 3 | `Ride` model requires `driverId` | `prisma/schema.prisma` | Cannot create a REQUESTED ride without a driver unless schema is changed (e.g. `driverId` optional or RideRequest table). |
| 4 | Driver dashboard does not subscribe to new rides | `src/app/driver/dashboard/page.tsx` | Even with ride creation and Realtime enabled, driver UI would not update without a subscription (or polling). |
| 5 | `/api/rides/status` referenced but may not exist | `RideRequestSheet.tsx` calls `fetch('/api/rides/status')` | 404 if route missing; can break driver accept flow in full DriverApp. |

---

## 3. What’s missing (without breaking existing behavior)

- **Rider flow**
  - **Create ride request API:** e.g. `POST /api/rides/request` (or `POST /api/rides`) that:
    - Authenticates rider (Supabase).
    - Accepts pickup/dropoff, ride type, and optionally fare estimate.
    - Creates either a `Ride` with `driverId` optional (after migration) or a `RideRequest` record; if `Ride`, set `status: REQUESTED`.
  - **Rider map:** Replace the demo `alert` with a call to that API; then show “A procurar motorista...” or similar.

- **Schema**
  - **Option A (minimal):** Make `Ride.driverId` optional (`String?`) and allow `status: REQUESTED` with `driverId: null`. On driver accept, set `driverId` and set `status: MATCHED`. Requires migration and updating any code that assumes `ride.driver` always exists for REQUESTED.
  - **Option B:** Add a `RideRequest` (or `UnmatchedRide`) table; rider creates a request; on accept, create `Ride` with both `riderId` and `driverId`. Accept API would then create `Ride` from `RideRequest` instead of only updating.

- **Driver flow**
  - **Realtime:** Enable Realtime for `rides` (and if used, `ride_requests`) in Supabase.
  - **Dashboard subscription:** In `src/app/driver/dashboard/page.tsx` (or the driver app that shows “Ficar Online”), add a `useEffect` that subscribes to `rides` (and optionally `ride_requests`) for `INSERT` (and maybe `status = 'REQUESTED'`). On new row, either show a simple “New ride request” UI or call `receiveOffer()` with mapped fields so the existing offer flow can be used.
  - **Unified driver UI (optional):** The current `/driver/dashboard` is minimal; the full flow (DriverWorkflow, RideRequestSheet, accept/decline) lives in `DriverApp`. Consider using `DriverApp` on the dashboard when the driver is approved and online so one code path handles realtime offers and accept/decline.

- **Env and docs**
  - Add `NEXT_PUBLIC_DEV_AUTO_APPROVE` to `.env.example` with a short comment (e.g. `# Set to true to auto-approve drivers (testing only)`).
  - Ensure `DATABASE_URL` and Supabase vars are documented for Vercel in your deployment checklist.

- **API**
  - Add or implement `GET/POST /api/rides/status` if the driver app expects it (see RideRequestSheet), or remove that call and rely on accept/decline and realtime only.

---

## 4. Suggested order of work (no breaking changes)

1. **Deploy and env (Steps 1–2)**  
   Push, set `NEXT_PUBLIC_DEV_AUTO_APPROVE=true`, redeploy. Confirm driver signup + onboarding + “IR ONLINE” (Step 3A).

2. **Ride creation path (unblocks 3B and Step 4)**  
   - Decide schema: optional `driverId` on `Ride` vs. `RideRequest` table.  
   - Add migration.  
   - Implement `POST /api/rides/request` (or equivalent) with auth and validation.  
   - Wire rider map “Solicitar” to this API and show a simple “request sent” state.

3. **Realtime and driver UI**  
   - Enable Realtime on the table that holds rider requests (e.g. `rides` or `ride_requests`).  
   - In the driver dashboard (or DriverApp), subscribe to new requests and call `receiveOffer()` (or show a minimal “new request” card) so the driver can accept/decline.

4. **Fix or remove `/api/rides/status`**  
   - Implement the route or remove the `fetch('/api/rides/status')` call so the driver flow doesn’t 404.

5. **.env.example**  
   - Document `NEXT_PUBLIC_DEV_AUTO_APPROVE` and any other vars needed for the Golden Loop.

---

## 5. Quick reference — files touched by this audit

| File | Role |
|------|------|
| `src/app/auth/callback/route.ts` | User sync + role redirect; OK. |
| `src/actions/auth.ts` | `ensureUserInDb`, `loginAndRedirect`, `assignRoleOnSignup`; OK. |
| `src/app/api/driver/onboarding/route.ts` | Auto-approve via env; OK. |
| `src/app/api/driver/go-online/route.ts` | Sets `isOnline` + location; OK. |
| `src/app/api/driver/me/route.ts` | Returns verificationStatus, isOnline, etc.; OK. |
| `src/app/driver/dashboard/page.tsx` | No realtime; add subscription here (or in DriverApp). |
| `src/app/ride/map/page.tsx` | “Pedir viagem” is demo only; wire to ride-request API. |
| `prisma/schema.prisma` | `Ride.driverId` required; consider optional for REQUESTED. |
| `src/app/api/rides/accept/route.ts` | Expects existing Ride; OK once rides are created. |
| `src/components/RideRequestSheet.tsx` | Uses `/api/rides/status`; ensure route exists or remove. |

---

**Next:** Run Steps 1–2 and 3A. For 3B and Step 4, implement ride-request API + schema decision, then realtime subscription and (if needed) `/api/rides/status` fix.

---

## 6. Realtime setup (after Ride Request implementation)

For the driver dashboard to receive new ride requests via Supabase Realtime:

1. **Supabase Dashboard** → Database → Replication (or run in SQL Editor):
   ```sql
   alter publication supabase_realtime add table "Ride";
   ```
   (If your table name is lowercase `ride`, use `add table ride` instead.)
2. Ensure the driver is **online** (IR ONLINE) so the client subscribes; the subscription filters for `INSERT` on the `Ride` table and shows only rows with `status === 'REQUESTED'`.
