#!/bin/bash
set -e

echo "=== Tuma Taxi Deployment Health Check ==="

cd /opt/tumataxi

# Check Docker containers
echo ""
echo "Container Status:"
docker-compose ps

# Check PostgreSQL health
echo ""
echo "Database Health:"
docker-compose exec -T postgres pg_isready -U postgres || echo "⚠️  Database not ready"

# Check Next.js health
echo ""
echo "Application Health:"
docker-compose exec -T nextjs wget -q -O- http://localhost:3000/health || echo "⚠️  Application not responding"

# Check Nginx
echo ""
echo "Web Server Health:"
curl -s -I https://localhost || echo "⚠️  HTTPS not responding"

# Check certificate validity
echo ""
echo "SSL Certificate Status:"
docker-compose exec -T certbot certbot certificates || echo "⚠️  No certificate found"

# Check disk usage
echo ""
echo "Disk Usage:"
df -h | grep -E "Filesystem|/$"

# Check logs
echo ""
echo "Recent Errors (last 20 lines):"
docker-compose logs --tail=20 2>&1 | grep -i "error" || echo "✓ No errors found"

echo ""
echo "=== Health Check Complete ==="
