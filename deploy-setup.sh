#!/bin/bash
set -e

DOMAIN=${1:-tumataxi.com}
EMAIL=${2:-admin@tumataxi.com}
VPSIP=${3:-}

echo "=== Tuma Taxi IONOS VPS Deployment Setup ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p /opt/tumataxi
sudo chown $USER:$USER /opt/tumataxi
cd /opt/tumataxi

# Create SSL directory structure
mkdir -p certbot/conf certbot/www
mkdir -p ssl logs

# Setup UFW firewall
echo "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Copy docker-compose.yml, nginx.conf, Dockerfile to /opt/tumataxi"
echo "2. Create .env from .env.example with secure DB_PASSWORD"
echo "3. Run: docker-compose up -d"
echo "4. Run: ./deploy-ssl.sh $DOMAIN $EMAIL"
