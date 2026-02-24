# TUMA TAXI - PRODUCTION DEPLOYMENT GUIDE

**Date:** 2026-02-24  
**Status:** 🚀 DEPLOYMENT READY  
**Target:** Vercel (Production)  

---

## 🔐 SECURITY HARDENING CHECKLIST

### **1. Environment Variables (CRITICAL)**

Create `.env.production` with the following:

```bash
# ============================================================================
# DATABASE (Supabase PostgreSQL)
# ============================================================================
DATABASE_URL="postgresql://user:pass@host:5432/tumataxi"

# ============================================================================
# SUPABASE (Auth + Storage)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ============================================================================
# SECURITY (REQUIRED)
# ============================================================================
ADMIN_API_KEY="[GENERATE 64-CHAR RANDOM STRING]"
NEXTAUTH_SECRET="[GENERATE 32-CHAR RANDOM STRING]"

# ============================================================================
# CLICKPESA (Remittance Bridge)
# ============================================================================
CLICKPESA_API_KEY="your_clickpesa_api_key"

# ============================================================================
# FEATURE FLAGS
# ============================================================================
NEXT_PUBLIC_DEV_AUTO_APPROVE="false"  # MUST BE FALSE IN PRODUCTION
NEXT_PUBLIC_ENABLE_SOS="true"
NEXT_PUBLIC_ENABLE_INSTANT_PAYOUT="false"

# ============================================================================
# APP CONFIGURATION
# ============================================================================
NEXT_PUBLIC_APP_URL="https://tumataxi.vercel.app"
NEXT_PUBLIC_TIMEZONE="Africa/Maputo"
NEXT_PUBLIC_LOCALE="pt-MZ"
NEXT_PUBLIC_CURRENCY="MZN"
```

**Generate secure keys:**
```bash
# Generate ADMIN_API_KEY (64 characters)
openssl rand -base64 48

# Generate NEXTAUTH_SECRET (32 characters)
openssl rand -base64 24
```

---

### **2. API Security Implementation**

All sensitive endpoints now require authentication:

**Protected Routes:**
- `/api/admin/*` - Portfolio dashboard, analytics
- `/api/remittance/*` - Currency conversion
- `/api/rides/*/cancel-no-show` - No-show penalties
- `/api/rides/waiting-surcharge` - Surcharge logging

**Usage:**
```bash
curl -X POST https://tumataxi.vercel.app/api/admin/portfolio \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

---

### **3. Rate Limiting**

**Current Limits:**
- 60 requests per minute per IP
- 429 status code when exceeded
- Automatic reset after 1 minute

**Future:** Replace in-memory store with Redis/Upstash

---

### **4. CORS Configuration**

**Allowed Origins:**
- `https://tumataxi.vercel.app` (production)
- `https://tumataxi.co.mz` (custom domain)
- `http://localhost:3000` (development only)

---

## 🗄️ DATABASE MIGRATIONS

### **Apply All Migrations**

```bash
# 1. Connect to Supabase
npm run prisma:studio

# 2. Generate Prisma client
npm run prisma:generate

# 3. Apply migrations
npm run prisma:migrate

# 4. Verify schema
npm run prisma:studio
```

### **Required Migrations**

1. ✅ `create_remittance_logs.sql` - Remittance audit trail
2. ✅ Existing Prisma schema - RulialLedger, DriverProfile, etc.

---

## 🚀 DEPLOYMENT TO VERCEL

### **Step 1: Commit Changes to Git**

```bash
# 1. Check status
git status

# 2. Add all changes
git add .

# 3. Commit with descriptive message
git commit -m "$(cat <<'EOF'
feat: Implement Sovereign Execution Stack

FEATURES:
- 60 FPS UX with Framer Motion
- Sovereign Revenue Generator (waiting surcharges)
- No-show cancellation (50 MZN penalty)
- Portfolio dashboard (IsoFlux + Tuma Taxi)
- Remittance bridge (MZN → USD conversion)
- Security hardening (API keys, rate limiting)

SECURITY:
- Admin API authentication
- Rate limiting (60 req/min)
- CORS configuration
- Environment validation

DOCUMENTATION:
- 10+ comprehensive docs in /docs
- API reference guides
- Testing instructions
EOF
)"

# 4. Push to GitHub
git push origin main
```

---

### **Step 2: Deploy to Vercel**

**Option A: CLI Deployment**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy to production
vercel --prod
```

**Option B: GitHub Integration (Recommended)**

1. Go to https://vercel.com/new
2. Import Git repository
3. Select `TumaTaxi` repo
4. Configure environment variables (see below)
5. Click "Deploy"

---

### **Step 3: Configure Environment Variables in Vercel**

1. Navigate to: Project Settings → Environment Variables
2. Add ALL variables from `.env.production`
3. Set environment: **Production**
4. Click "Save"

**Critical Variables:**
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ADMIN_API_KEY=[64-char key]
CLICKPESA_API_KEY=[your key]
NEXT_PUBLIC_DEV_AUTO_APPROVE=false
```

---

### **Step 4: Run Database Migrations on Production**

```bash
# 1. Set DATABASE_URL to production
export DATABASE_URL="postgresql://prod..."

# 2. Run migrations
npx prisma migrate deploy

# 3. Generate Prisma client
npx prisma generate
```

---

### **Step 5: Verify Deployment**

**Health Checks:**

1. **API Health:**
   ```bash
   curl https://tumataxi.vercel.app/api/health
   # Expected: { "status": "ok", "timestamp": "..." }
   ```

2. **Portfolio Dashboard:**
   ```bash
   curl https://tumataxi.vercel.app/admin/portfolio \
     -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
   # Expected: Portfolio data JSON
   ```

3. **Remittance Bridge:**
   ```bash
   curl -X POST https://tumataxi.vercel.app/api/remittance/convert \
     -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"amountMZN": 10000}'
   # Expected: { "success": true, "data": { "amountUSD": "160.00", ... } }
   ```

---

## 📊 POST-DEPLOYMENT MONITORING

### **1. Vercel Analytics**

Enable in Vercel Dashboard:
- Real User Monitoring (RUM)
- Web Vitals tracking
- Error logging

### **2. Supabase Monitoring**

Check in Supabase Dashboard:
- Database connections
- Query performance
- Storage usage

### **3. Custom Alerts**

Set up alerts for:
- API error rate >5%
- Database connection failures
- Rate limit exceeded events
- Remittance conversion failures

---

## 🔒 SECURITY BEST PRACTICES

### **1. API Key Management**

✅ **DO:**
- Store in environment variables
- Use 64+ character keys
- Rotate quarterly
- Use different keys for dev/prod

❌ **DON'T:**
- Commit to Git
- Share via email/Slack
- Reuse across projects
- Use weak keys (<32 chars)

### **2. Database Security**

✅ **Supabase RLS Policies:**
```sql
-- Enable Row Level Security
ALTER TABLE "RulialLedger" ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can only see their own ledger
CREATE POLICY "Drivers see own ledger"
  ON "RulialLedger"
  FOR SELECT
  USING (auth.uid() = "userId");

-- Policy: Only service role can insert
CREATE POLICY "Service role can insert"
  ON "RulialLedger"
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### **3. HTTPS Enforcement**

Vercel automatically provides:
- SSL/TLS certificates
- HTTPS redirect
- HTTP/2 support
- CDN edge caching

---

## 🧪 POST-DEPLOYMENT TESTING

### **Test Checklist**

- [ ] Driver can go online
- [ ] Ride request flow works
- [ ] Waiting timer displays correctly
- [ ] No-show penalty applies (after 5 min)
- [ ] Portfolio dashboard loads
- [ ] Remittance conversion works
- [ ] All APIs return proper errors
- [ ] Rate limiting triggers at 60 req/min

---

## 📈 PERFORMANCE TARGETS

### **Vercel Metrics to Monitor**

| Metric | Target | Current |
|--------|--------|---------|
| Time to First Byte (TTFB) | <200ms | TBD |
| First Contentful Paint (FCP) | <1.5s | TBD |
| Largest Contentful Paint (LCP) | <2.5s | TBD |
| Cumulative Layout Shift (CLS) | <0.1 | TBD |
| API Response Time | <500ms | TBD |

---

## 🆘 ROLLBACK PROCEDURE

If deployment fails:

```bash
# 1. Revert to previous deployment in Vercel Dashboard
# OR via CLI:
vercel rollback

# 2. Check logs
vercel logs --follow

# 3. Fix issues locally
npm run dev

# 4. Redeploy
vercel --prod
```

---

## 📞 SUPPORT CONTACTS

**Technical Lead:** Makko Intelligence  
**Vercel Support:** https://vercel.com/support  
**Supabase Support:** https://supabase.com/support  
**ClickPesa Support:** https://clickpesa.com/support  

---

## ✅ DEPLOYMENT CHECKLIST (FINAL)

- [ ] All code committed to Git
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] Security middleware implemented
- [ ] API keys generated (64+ chars)
- [ ] NEXT_PUBLIC_DEV_AUTO_APPROVE=false
- [ ] CORS origins configured
- [ ] Rate limiting active
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Documentation complete
- [ ] Team notified of deployment

---

**THE FIRMAMENT IS BREACHED.**  
**SECURITY: HARDENED.**  
**DEPLOYMENT: READY.**  
**PRODUCTION: GO LIVE.**

---

**Version:** 1.0.0  
**Status:** 🚀 PRODUCTION DEPLOYMENT READY
