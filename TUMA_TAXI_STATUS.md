# Tuma Taxi — System Status & Flow Audit

**Last audit:** Full 360° flow audit. Login, register, logout, driver onboarding (with file upload), driver dashboard, rider map, and all API paths verified.

---

## 1. Where Tuma Taxi Is

- **Stack:** Next.js 14 (App Router), Prisma, PostgreSQL (Supabase), Supabase Auth, MapLibre (ride map).
- **Roles:** PASSENGER/RIDER (rider app), DRIVER (driver app). Middleware enforces role-based routes.
- **Flows in place:**
  - **Landing (/):** Two CTAs → passenger login, driver login; link to signup.
  - **Auth:** Signup (with role), Login (with role), Callback (email confirm + DB sync + role sync to Supabase).
  - **Driver:** Onboarding (3 steps, optional file upload) → Dashboard (go online, accept/decline rides via Realtime).
  - **Rider:** Ride map → request ride → polling status until MATCHED/IN_PROGRESS/COMPLETED.
- **Security:** Middleware protects /driver/* and /ride/* when unauthenticated; role metadata synced in callback and after onboarding so drivers are not sent to ride map.

---

## 2. Route & Button Map (Verified)

| Location | Element | Action / Path | Status |
|----------|--------|----------------|--------|
| **/ (Landing)** | Viajar com Tuma | Link → `/auth/login?role=passenger` | OK |
| **/** | Conduzir com Tuma | Link → `/auth/login?role=driver` | OK |
| **/** | Registar | Link → `/auth/signup` | OK |
| **/login** | (page) | Redirect → `/auth/login` (keeps `role`, `redirect` query) | OK |
| **/signup** | (page) | Redirect → `/auth/signup` (keeps `role`) | OK |
| **/auth/login** | Form submit | `signInWithPassword` → `loginAndRedirect(authId)` → `router.push(destination)` | OK |
| **/auth/login** | Não tem conta? | Link → `/auth/signup?role=…` | OK |
| **/auth/signup** | Passageiro / Motorista | Buttons set role | OK |
| **/auth/signup** | Form submit | `signUp` + `assignRoleOnSignup` → `router.push(destination)` (driver → onboarding, passenger → ride/map) | OK |
| **/auth/signup** | Já tem conta? | Link → `/auth/login?role=…` | OK |
| **LogoutButton** | Sair | `signOut()` → `router.push('/')` | OK (with double-click guard) |
| **/driver/onboarding** | Voltar | `setStep(step - 1)` | OK |
| **/driver/onboarding** | Continuar / Submeter | Step &lt; 3 → next step; Step 3 → `handleSubmit()` → POST `/api/driver/onboarding` → `router.push('/driver/dashboard')` | OK |
| **/driver/onboarding** | File inputs (Step 3) | `type="file"` + `id`/`htmlFor` — click opens system file picker | OK |
| **/driver/dashboard** | Sair | LogoutButton | OK |
| **/driver/dashboard** | IR ONLINE / PARAR | POST `/api/driver/go-online` | OK |
| **/driver/dashboard** | Recusar / Aceitar | POST `/api/rides/decline`, POST `/api/rides/accept` | OK |
| **/driver/dashboard** | Tentar novamente (load error) | `setLoadError(null); setLoading(true); location.reload()` | OK |
| **/ride/map** | Sair | LogoutButton (light) | OK |
| **/ride/map** | Tentar novamente (map error) | `setMapError(false)` | OK |
| **/ride/map** | Ver opções de viagem | `setShowSelector(true)` | OK |
| **/ride/map** | Pedir viagem | POST `/api/ride/create` → poll `/api/ride/status` | OK |

---

## 3. API Endpoints (Used by App)

| Method | Path | Used by | Auth |
|--------|------|--------|------|
| GET | `/api/driver/me?authId=…` | Driver dashboard | Cookie + authId match |
| POST | `/api/driver/onboarding` | Driver onboarding submit | Cookie + body.authId match |
| POST | `/api/driver/go-online` | Driver dashboard toggle | Cookie + body.authId match |
| POST | `/api/ride/create` | Ride map | Cookie (rider) |
| GET | `/api/ride/status?id=…` | Ride map polling | Cookie (rider) |
| POST | `/api/rides/accept` | Driver dashboard | Body: rideId, driverId |
| POST | `/api/rides/decline` | Driver dashboard | Body: rideId, driverId, reason |

Other APIs (health, config, emergency) exist; not in the main login/register/ride flow.

---

## 4. Auth & Redirect Flows

- **Signup (new):** `signUp` with `options.data.role` → if session exists, `assignRoleOnSignup` → driver → `/driver/onboarding`, passenger → `/ride/map`. If email confirmation required, user clicks link → **Callback**.
- **Callback:** `exchangeCodeForSession` → create/find User in DB → sync `role` to Supabase auth → redirect: driver without profile → `/driver/onboarding`, else `/driver/dashboard` or `/ride/map`.
- **Login:** `signInWithPassword` → `loginAndRedirect(authId)` (creates User if missing; driver without profile → `/driver/onboarding`) → `router.push(destination)`.
- **Logout:** `signOut()` → `router.push('/')` (button disabled while logging out).
- **Middleware:** Unauthenticated → /driver/* and /ride/* → `/`. Authenticated: /driver/onboarding allowed for all; /driver/dashboard without DRIVER role → `/driver/onboarding` (or `/ride/map` for other driver routes); /ride/* without PASSENGER/RIDER → `/driver/dashboard`. Auth pages and `/` redirect to dashboard or ride/map by role.

---

## 5. File Upload (Driver Onboarding)

- Step 3 uses native `<input type="file" accept="image/*,.pdf">` with `id` and `htmlFor` so clicking the label or “Escolher ficheiro” opens the system file picker.
- Uploads go to Supabase Storage bucket `driver-docs`; failures are non-blocking (empty URL), so profile creation still succeeds if the bucket is missing or RLS blocks upload.

---

## 6. Fixes Applied in This Audit

- **LogoutButton:** Guard against double-click; show “A sair...” and disable while signing out.
- **Onboarding Step 3:** Added `id`/`htmlFor` on file inputs, hint text, and Tailwind `file:` styling for the choose-file button.
- **Paths:** All links and redirects above verified; no broken paths in the main flows.
- **Ghost code:** Components such as DriverApp, SimpleTest, RideRequestSheet, etc. are not used by any app route; they are legacy/optional. No removal done; they do not affect login, register, logout, or ride flow.

---

## 7. Test Account Checklist

1. **Passenger:** Register or login with role passenger → should land on `/ride/map`. Request ride → “A procurar motoristas…”. Logout → home.
2. **Driver:** Register or login with role driver → if no profile, `/driver/onboarding`. Complete 3 steps (documents optional), submit → `/driver/dashboard`. Go online → see “Nova viagem” when a ride is requested. Accept/Decline work. Logout → home.
3. **Login with existing account:** Same as above; drivers without profile go to onboarding first.
4. **File upload:** On onboarding Step 3, clicking each label or file input opens the OS file picker; submit works with or without files.

---

## 8. Security Notes

- No sensitive keys in client; Supabase anon key and env used correctly.
- Middleware and APIs validate auth (and authId where required).
- Role synced to Supabase after callback and after driver onboarding to avoid wrong redirects.
