#!/bin/bash
set -e

DOMAIN=${1:-tumataxi.com}
EMAIL=${2:-admin@tumataxi.com}

echo "=== Configuring SSL/TLS Certificate ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

cd /opt/tumataxi

# Stop nginx temporarily for certificate creation
docker-compose stop nginx || true

# Create initial certificate with certbot
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --agree-tos \
  --non-interactive \
  --email $EMAIL \
  -d $DOMAIN \
  -d www.$DOMAIN

# Update nginx.conf with proper domain
sed -i "s/tumataxi.com/$DOMAIN/g" nginx.conf

# Start services
docker-compose up -d

# Verify certificate
docker-compose exec -T certbot ls -la /etc/letsencrypt/live/

echo "=== SSL Certificate Created ==="
echo "Certificate path: /opt/tumataxi/certbot/conf/live/$DOMAIN/"
echo "Renewal is automatic via certbot service"
echo ""
echo "Test SSL: https://$DOMAIN"
