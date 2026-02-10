# Registration Troubleshooting Checklist

Use this when signup/registration fails (e.g. "email already exists", "email rate limit reached", or silent failure).

---

## 0. EMAIL RATE LIMIT (Supabase)

If you see **"Email rate limit reached"** or **"Too many requests"**:

- **Cause:** Supabase Auth sends a confirmation email on each signup. Default project limit is low (e.g. 2 emails/hour) unless you use custom SMTP or raise limits in Dashboard.
- **In-app:** The signup form now shows a friendly message and prevents double submit. If the error persists:
  1. **Supabase Dashboard → Authentication → Rate Limits:** Increase limits if available.
  2. **For testing only:** **Authentication → Providers → Email → turn OFF "Confirm email"**. Then signup does not send an email and you avoid the limit. Re-enable for production.
  3. Wait 5–10 minutes and try again, or use **Entrar** (Login) if the account was already created.

**Applied via script:** Realtime for the `Ride` table is applied using your `DATABASE_URL` when you run `npm run supabase:setup` (or `npx tsx scripts/apply-supabase-setup.ts`). Auth settings (email confirmation, rate limits) are **not** in the database; change them in the Supabase Dashboard or via the Management API with a personal access token.

---

## 1. THE "ZOMBIE" CLEANUP (Most Likely Cause)

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

## 2. FORCE THE MAP (Schema Push) — DONE

Your code and **production database** must match. Sync the schema:

```bash
npx prisma db push --accept-data-loss
```

- Use the **Supabase** `DATABASE_URL` in `.env` / `.env.local` (not localhost).
- If prompted about data loss, type `y` (or use `--accept-data-loss` to skip prompt).

**Result:** You should see **"The database is now in sync"** (or "already in sync").

*Last run: DB was already in sync with Prisma schema.*

---

## 3. CHECK THE "BLACK BOX" (Vercel Logs)

If Step 1 and 2 don’t fix it, inspect the failure:

1. **Vercel Dashboard → Tuma Taxi → Logs** (top tab).
2. Try to **register again** (e.g. on your phone).
3. In Logs, look for a **red** line and the error message:

   - **Unique constraint failed** → Zombie user; redo **Step 1**.
   - **Column "role" does not exist** (or similar) → Schema mismatch; redo **Step 2** (schema push).
   - **500 Internal Server Error** → Check the full stack trace in logs for the real cause.

---

## 4. EMERGENCY BYPASS (Manual User Injection)

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

**Try Step 1 and 2 first; it’s usually the Zombie User issue. Report back: Did the cleanup work?**
