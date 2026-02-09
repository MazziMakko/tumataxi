# Tuma Taxi – Deploy & Redeploy

## Instant visibility after redeploy

Changes are visible immediately after deploy. Nginx is configured with **no HTML caching** so every request hits the live Next.js app.

## Production .env (required for Docker)

Create `.env` in the project root (same directory as `docker-compose.yml`) with:

```env
# Database – use Supabase for production, or local postgres
DATABASE_URL="postgresql://..."

# Supabase Auth (required for login/signup)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"

# For local postgres, also set:
DB_PASSWORD="your_secure_password"
```

## Redeploy

```bash
cd /opt/tumataxi   # or your deploy path
git pull
docker-compose up -d --build
```

After rebuild, changes are visible immediately (no cache purge needed).

## Verify

```bash
curl -I https://tumataxi.com
curl https://tumataxi.com/health
```
