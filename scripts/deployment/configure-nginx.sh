#!/bin/bash

# Nginx and SSL Configuration Script for Evgenia Art Portfolio
# Usage: sudo ./scripts/deployment/configure-nginx.sh [domain]

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
   exit 1
fi

# Get domain from argument or prompt
DOMAIN="$1"
if [[ -z "${DOMAIN:-}" ]]; then
    read -p "Enter your domain name (e.g., evgenia-art.shuktech.shop): " DOMAIN
fi

if [[ -z "$DOMAIN" ]]; then
    error "Domain name is required"
    exit 1
fi

APP_DIR="/opt/evgenia-art-portfolio"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SSL_CERT_DIR="/etc/ssl/certs"
SSL_KEY_DIR="/etc/ssl/private"

log "Starting nginx and SSL configuration for domain: $DOMAIN"

# Step 1: Install nginx if not installed
log "Installing nginx..."
apt update > /dev/null 2>&1
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    success "Nginx installed"
else
    success "Nginx already installed"
fi

# Step 2: Create SSL directories
log "Creating SSL directories..."
mkdir -p "$SSL_CERT_DIR"
mkdir -p "$SSL_KEY_DIR"

# Step 3: Generate temporary self-signed certificate
log "Generating temporary self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_KEY_DIR/$DOMAIN.key" \
    -out "$SSL_CERT_DIR/$DOMAIN.crt" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN" \
    > /dev/null 2>&1

chmod 644 "$SSL_CERT_DIR/$DOMAIN.crt"
chmod 600 "$SSL_KEY_DIR/$DOMAIN.key"
success "Temporary SSL certificate generated"

# Step 4: Create nginx configuration
log "Creating nginx configuration for $DOMAIN..."
cat > "$NGINX_AVAILABLE/$DOMAIN" << EOF
# HTTP server - redirects to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate $SSL_CERT_DIR/$DOMAIN.crt;
    ssl_certificate_key $SSL_KEY_DIR/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy settings for Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files optimization
    location /public/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # Admin panel - additional security
    location /admin/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        
        # Additional security for admin
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
    }

    # Security - deny access to sensitive files
    location ~ /\.(ht|git|env) {
        deny all;
        return 404;
    }
}
EOF

success "Nginx configuration created"

# Step 5: Enable the site
log "Enabling nginx site..."
ln -sf "$NGINX_AVAILABLE/$DOMAIN" "$NGINX_ENABLED/"

# Remove default site if it exists
if [[ -f "$NGINX_ENABLED/default" ]]; then
    rm -f "$NGINX_ENABLED/default"
    success "Removed default nginx site"
fi

# Step 6: Test nginx configuration
log "Testing nginx configuration..."
if nginx -t > /dev/null 2>&1; then
    success "Nginx configuration is valid"
else
    error "Nginx configuration test failed"
    nginx -t
    exit 1
fi

# Step 7: Update application .env for the domain
log "Updating application configuration..."
if [[ -f "$APP_DIR/.env" ]]; then
    # Update CORS_ORIGIN if it exists
    if grep -q "CORS_ORIGIN=" "$APP_DIR/.env"; then
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|" "$APP_DIR/.env"
    else
        echo "CORS_ORIGIN=https://$DOMAIN" >> "$APP_DIR/.env"
    fi
    
    # Ensure other security settings
    if grep -q "SECURE_COOKIES=" "$APP_DIR/.env"; then
        sed -i "s|SECURE_COOKIES=.*|SECURE_COOKIES=true|" "$APP_DIR/.env"
    else
        echo "SECURE_COOKIES=true" >> "$APP_DIR/.env"
    fi
    
    if grep -q "TRUST_PROXY=" "$APP_DIR/.env"; then
        sed -i "s|TRUST_PROXY=.*|TRUST_PROXY=true|" "$APP_DIR/.env"
    else
        echo "TRUST_PROXY=true" >> "$APP_DIR/.env"
    fi
    
    success "Application configuration updated"
fi

# Step 8: Remove IP restrictions from systemd service
log "Removing IP restrictions from systemd service..."
SYSTEMD_SERVICE="/etc/systemd/system/evgenia-art.service"
if [[ -f "$SYSTEMD_SERVICE" ]]; then
    # Create backup
    cp "$SYSTEMD_SERVICE" "$SYSTEMD_SERVICE.backup.$(date +%s)"
    
    # Remove IP restrictions
    sed -i '/IPAddressDeny=/d' "$SYSTEMD_SERVICE"
    sed -i '/IPAddressAllow=/d' "$SYSTEMD_SERVICE"
    
    success "IP restrictions removed from systemd service"
fi

# Step 9: Install certbot for Let's Encrypt
log "Installing certbot for Let's Encrypt SSL..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
    success "Certbot installed"
else
    success "Certbot already installed"
fi

# Step 10: Restart services
log "Restarting services..."
systemctl daemon-reload
systemctl restart nginx

if systemctl is-active --quiet evgenia-art; then
    systemctl restart evgenia-art
    success "Application service restarted"
else
    systemctl start evgenia-art
    success "Application service started"
fi

# Enable auto-start
systemctl enable nginx > /dev/null 2>&1
systemctl enable evgenia-art > /dev/null 2>&1

# Step 11: Check service status
log "Checking service status..."
if systemctl is-active --quiet nginx; then
    success "Nginx is running"
else
    error "Nginx is not running"
    systemctl status nginx --no-pager
fi

if systemctl is-active --quiet evgenia-art; then
    success "Application service is running"
else
    error "Application service is not running"
    systemctl status evgenia-art --no-pager
fi

# Step 12: Test configuration
log "Testing HTTP to HTTPS redirect..."
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" || echo "000")
    if [[ "$HTTP_STATUS" == "301" ]]; then
        success "HTTP to HTTPS redirect working"
    else
        warning "HTTP to HTTPS redirect may not be working (status: $HTTP_STATUS)"
    fi
else
    warning "curl not available, skipping HTTP test"
fi

echo
success "🎉 Nginx and SSL configuration completed!"
echo
echo "📋 Next Steps:"
echo "=============="
echo "1. Ensure your DNS A record points $DOMAIN to this server's IP"
echo "2. Wait for DNS propagation (may take up to 24 hours)"
echo "3. Get a real SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo
echo "🔧 Useful Commands:"
echo "=================="
echo "• Check nginx status: sudo systemctl status nginx"
echo "• Check app status:   sudo systemctl status evgenia-art"
echo "• View nginx logs:    sudo tail -f /var/log/nginx/error.log"
echo "• View app logs:      sudo journalctl -u evgenia-art -f"
echo "• Test nginx config:  sudo nginx -t"
echo "• Get SSL cert:       sudo certbot --nginx -d $DOMAIN"
echo "• Renew SSL cert:     sudo certbot renew"
echo
echo "🌐 Your site should be accessible at:"
echo "• https://$DOMAIN"
echo "• https://$DOMAIN/admin/"
echo
warning "⚠️  Remember to update your DNS records to point $DOMAIN to this server!"
warning "⚠️  Run 'sudo certbot --nginx -d $DOMAIN' after DNS propagation!" 