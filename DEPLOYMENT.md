# Tuma Taxi IONOS VPS Deployment Guide

## Pre-Deployment Checklist

- [ ] IONOS VPS with Ubuntu 22.04 (minimum 2 vCPU, 4GB RAM)
- [ ] Domain DNS pointing to VPS IP
- [ ] SSH access to VPS
- [ ] Email address for Let's Encrypt notifications
- [ ] Strong password for PostgreSQL (minimum 20 chars, mixed case + symbols)

## Deployment Steps

### 1. Initial VPS Setup (5 minutes)

Connect via SSH:
```bash
ssh root@your_vps_ip
```

Run initial setup:
```bash
# Download and execute setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/main/deploy-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh tumataxi.com admin@tumataxi.com
```

**What this does:**
- Updates all system packages
- Installs Docker and Docker Compose
- Configures UFW firewall (ports 22/80/443 only)
- Creates `/opt/tumataxi` application directory
- Enables non-root Docker access

### 2. Application Deployment (10 minutes)

```bash
cd /opt/tumataxi

# Clone or upload application files
git clone your-repo .
# OR manually upload: docker-compose.yml, nginx.conf, Dockerfile, prisma/

# Create .env with secure values
cp .env.example .env
nano .env  # Edit DB_PASSWORD with strong password

# Start services
docker-compose up -d

# Verify containers are running
docker-compose ps
```

**What this does:**
- Pulls base images (postgres:15, nginx:alpine, node:18)
- Builds Next.js application
- Creates PostgreSQL database
- Starts Nginx reverse proxy
- Starts Certbot for SSL automation

### 3. SSL Certificate Setup (5 minutes)

```bash
cd /opt/tumataxi

# Configure SSL
chmod +x deploy-ssl.sh
./deploy-ssl.sh tumataxi.com admin@tumataxi.com
```

**What this does:**
- Stops Nginx temporarily
- Creates Let's Encrypt certificate for your domain
- Configures Nginx with HTTPS
- Starts automatic certificate renewal service

### 4. Database Migration (5 minutes)

```bash
# Create database schema
docker-compose exec -T nextjs npx prisma db push

# Seed initial data (optional)
docker-compose exec -T nextjs npx prisma db seed
```

### 5. Verification

```bash
# Health check
chmod +x health-check.sh
./health-check.sh

# Manual tests
curl -I https://tumataxi.com  # Should return 200
curl -I https://tumataxi.com/api/rides/calculate-commission  # Should return 405 (expected for GET)
```

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nextjs
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Common Operations

```bash
# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Update application (new version)
git pull
docker-compose up -d --build

# Database backup
docker-compose exec -T postgres pg_dump -U postgres tumataxi > backup.sql

# View SSL certificate expiry
docker-compose exec -T certbot certbot certificates
```

## Security Configuration

### Network Isolation
- **Internal Network**: PostgreSQL only accessible from NextJS (not exposed)
- **External Network**: Only Nginx exposed to public (ports 80/443)
- **Firewall**: UFW allows SSH (22), HTTP (80), HTTPS (443) only

### Environment Variables
- Database password: 20+ character random string, symbols included
- Never commit .env file to Git
- Rotate DATABASE_URL monthly

### Certificate Management
- Certbot auto-renews certificates 30 days before expiry
- Renewal occurs daily at 2 AM (container restart)
- Certificate path: `/opt/tumataxi/certbot/conf/live/tumataxi.com/`

### Log Rotation
- JSON-file driver: max 10MB per file, 3 files retained
- Logs stored in container, not persisted to disk
- View via `docker-compose logs` command

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL health
docker-compose exec -T postgres pg_isready

# View database logs
docker-compose logs postgres
```

### Application Not Starting
```bash
# Check Next.js logs
docker-compose logs nextjs

# Verify environment variables
docker-compose config | grep -A5 nextjs
```

### HTTPS Not Working
```bash
# Check Nginx logs
docker-compose logs nginx

# Verify certificate exists
docker-compose exec -T certbot ls -la /etc/letsencrypt/live/

# Test SSL configuration
openssl s_client -connect tumataxi.com:443
```

### High CPU/Memory Usage
```bash
# Monitor resources
docker stats

# Adjust docker-compose.yml resource limits:
# Add under nextjs service:
#   deploy:
#     resources:
#       limits:
#         cpus: '1'
#         memory: 1G
```

## Backup & Recovery

### Automated Backups (Weekly)
Add to crontab:
```bash
# Daily 3 AM backup
0 3 * * * cd /opt/tumataxi && docker-compose exec -T postgres pg_dump -U postgres tumataxi | gzip > backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup
```bash
# Stop application
docker-compose down

# Restore database
cat backups/db_20240115.sql | docker-compose exec -T postgres psql -U postgres

# Start application
docker-compose up -d
```

## Performance Tuning

### PostgreSQL Optimization
Edit docker-compose.yml, add to postgres environment:
```
POSTGRES_INIT_ARGS: "-c shared_buffers=256MB -c max_connections=200"
```

### Nginx Caching
Current configuration:
- API: No caching (every request fresh)
- Static assets (_next/static): 1 year cache
- Images/fonts: 30 day cache
- HTML: 5 minute cache

### Next.js Optimization
Ensure package.json includes:
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

## Cost Optimization

- **IONOS VPS 1**: €2.99/month (1 vCPU, 1 GB RAM) - Small deployments only
- **IONOS VPS 4**: €8.99/month (4 vCPU, 8 GB RAM) - Recommended for production
- **IONOS VPS XL**: €20/month (8 vCPU, 16 GB RAM) - High-traffic deployments

Estimated monthly cost for production: €15-25 (VPS + SSL included)

## Support & Escalation

### Critical Issues
1. Check logs: `docker-compose logs -f`
2. Run health check: `./health-check.sh`
3. Review docker-compose.yml environment variables

### Database Issues
Contact: PostgreSQL documentation at https://www.postgresql.org/docs/

### SSL Certificate Issues
Contact: Let's Encrypt support at https://letsencrypt.org/docs/
