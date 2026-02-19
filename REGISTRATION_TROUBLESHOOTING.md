# Registration Troubleshooting Checklist

Use this when signup/registration fails (e.g. "email already exists", "email rate limit reached", or silent failure).

---

## 0. "A AGUARDAR APROVAÇÃO" — DRIVER VERIFICATION PAGE

**What it means:** After a driver completes onboarding, their profile is created with `verificationStatus: PENDING`. The dashboard shows "A aguardar aprovação" (Awaiting approval) until an admin or process sets the driver to **APPROVED**. This is intentional: Tuma Taxi reviews documents (license, insurance, etc.) before the driver can go online.

**For testing (skip approval):** Use auto-approve so driver and rider can do real-time testing in sync (see `docs/TUMA_PRODUCT_ROADMAP.md`).

1. In `.env.local` set:
   ```bash
   NEXT_PUBLIC_DEV_AUTO_APPROVE=true
   ```
   (`.env.example` defaults this to `true` for local testing; set to `false` in production.)
2. Restart the dev server. **New** drivers who complete onboarding will be created with `APPROVED` and go straight to the full dashboard (IR ONLINE, etc.).
3. For drivers who **already** submitted and are stuck on "A aguardar aprovação", either:
   - **Option A:** In Supabase Table Editor → **DriverProfile** → find the row for that driver → set `verificationStatus` to `APPROVED`. Then refresh the dashboard.
   - **Option B:** Delete that driver’s **DriverProfile** row (and optionally the **User** row and Supabase Auth user), then sign up and onboard again with `NEXT_PUBLIC_DEV_AUTO_APPROVE=true` set.

**Production verification (how Tuma Taxi would verify drivers):**

- **Manual:** An admin panel or Supabase Dashboard where staff see pending drivers, open uploaded docs (licenseFrontUrl, licenseBackUrl, insuranceUrl, vehicleRegistrationUrl), and set `verificationStatus` to `APPROVED` or `REJECTED`. Optionally send email or SMS to the driver (“Your account is approved” / “We need more information”).
- **Automated:** Integrate a KYC/document-verification API; on success, set `APPROVED` and optionally notify by email/SMS.
- **Email/SMS:** Not required for the status itself; they are for **notifying** the driver. The verification is updating `DriverProfile.verificationStatus` to `APPROVED` (by human or system).

---

## 1. EMAIL RATE LIMIT (Supabase)

If you see **"Email rate limit reached"** or **"Too many requests"**:

- **Cause:** Supabase Auth sends a confirmation email on each signup. Default project limit is low (e.g. 2 emails/hour) unless you use custom SMTP or raise limits in Dashboard.
- **In-app:** The signup form now shows a friendly message and prevents double submit. If the error persists:
  1. **Supabase Dashboard → Authentication → Rate Limits:** Increase limits if available.
  2. **For testing only:** **Authentication → Providers → Email → turn OFF "Confirm email"**. Then signup does not send an email and you avoid the limit. Re-enable for production.
  3. Wait 5–10 minutes and try again, or use **Entrar** (Login) if the account was already created.

**Applied via script:** Realtime for the `Ride` table is applied using your `DATABASE_URL` when you run `npm run supabase:setup` (or `npx tsx scripts/apply-supabase-setup.ts`). Auth settings (email confirmation, rate limits) are **not** in the database; change them in the Supabase Dashboard or via the Management API with a personal access token.

---

## 2. THE "ZOMBIE" CLEANUP (Most Likely Cause)

If you deleted a user in Supabase **Authentication** but not in your **public tables**, the email can "already exist" in a hidden/auth table and registration fails silently.

**Do this to clean the slate:**

1. **Supabase Dashboard → Authentication**
   - Delete **driver1@tumataxi.com** and **rider1@tumataxi.com** if they exist.

2. **Table Editor → User** (or `users`)
   - Delete any rows with those emails.

3. **Table Editor → DriverProfile** (or `driver_profiles`)
   - Delete any rows whose `userId` points to those users.

The emails are then truly "fresh" for signup.

---

## 3. FORCE THE MAP (Schema Push) — DONE

Your code and **production database** must match. Sync the schema:

```bash
npx prisma db push --accept-data-loss
```

- Use the **Supabase** `DATABASE_URL` in `.env` / `.env.local` (not localhost).
- If prompted about data loss, type `y` (or use `--accept-data-loss` to skip prompt).

**Result:** You should see **"The database is now in sync"** (or "already in sync").

*Last run: DB was already in sync with Prisma schema.*

---

## 4. CHECK THE "BLACK BOX" (Vercel Logs)

If Step 1 and 2 don’t fix it, inspect the failure:

1. **Vercel Dashboard → Tuma Taxi → Logs** (top tab).
2. Try to **register again** (e.g. on your phone).
3. In Logs, look for a **red** line and the error message:

   - **Unique constraint failed** → Zombie user; redo **Step 1**.
   - **Column "role" does not exist** (or similar) → Schema mismatch; redo **Step 2** (schema push).
   - **500 Internal Server Error** → Check the full stack trace in logs for the real cause.

---

## 5. EMERGENCY BYPASS (Manual User Injection)

If registration still can’t be fixed in time, inject test users manually so you can run the simulation:

1. **Supabase → Authentication**
   - **Add user** → **driver1@tumataxi.com** (set password).
   - **Add user** → **rider1@tumataxi.com** (set password).
   - **Copy each User UID** (from the user row).

2. **Table Editor → User**
   - **Insert row:**
     - `id`: *generated CUID* (Prisma uses `cuid()` for `User.id`; do **not** use Auth UID here unless your schema uses `authId` as the link).
     - `authId`: *paste the Auth UID for this user*.
     - `email`: driver1@tumataxi.com (then repeat for rider1@tumataxi.com).
     - `firstName`, `lastName`: e.g. "Test Driver" / "Test Rider".
     - `role`: DRIVER (for driver1) or PASSENGER/RIDER (for rider1).
     - `emailVerified`: true.

3. **Table Editor → DriverProfile** (only for driver1)
   - **Insert row:**
     - `userId`: the **User** table `id` of the driver user (not the Auth UID).
     - Other required fields per your schema (e.g. `vehicleMake`, `vehicleModel`, `licensePlate`, `vehicleType`, `verificationStatus`: APPROVED, `isOnline`: true, etc.).

**Note:** Your app links Auth to User via `authId` (Supabase auth UID). So `User.authId` must match the Auth user’s UID; `User.id` is your internal CUID. DriverProfile’s `userId` is the **User** table `id`, not the Auth UID.

---

## 6. ONBOARDING AND REDIRECT LOOPS (FIXED)

If drivers were sent to ride map or dashboard → onboarding → dashboard loops: auth callback and onboarding API now sync DB role to Supabase auth so middleware sees DRIVER. Middleware allows /driver/onboarding for any logged-in user; dashboard redirects to onboarding only on 404 from /api/driver/me. Onboarding file uploads are non-blocking so profile creation can succeed even if driver-docs bucket is missing.

---

## 7. CLEANING UP TEST / DUMMY DATA

When you're done testing with dummy names and emails and want to wipe test entries:

1. **Supabase Dashboard → Authentication → Users** — Delete the test users.
2. **Database** — Delete in order to avoid foreign-key errors: RideDecline → Ride → DriverProfile → User (e.g. in Table Editor or SQL Editor). You can target by email pattern (e.g. `%@test.%`) or delete all and re-seed.
3. Until then, dummy data is fine for validating signup, onboarding, and dashboard flows.

---

**Try Step 1 and 2 first; it’s usually the Zombie User issue. Report back: Did the cleanup work?**
