# Production Deployment Guide - Complete Setup

**Evgenia Art Portfolio - Production Deployment with Domain & SSL**

## 🚀 Complete Production Setup Process

This guide covers the complete process of deploying the Evgenia Art Portfolio to a production server with:
- External domain access (evgenia-art.shuktech.shop)
- HTTPS/SSL certificates
- Nginx reverse proxy
- Proper security configuration

### Prerequisites

- **Linux server** with sudo access (Ubuntu 20.04+)
- **Domain name** pointed to your server IP
- **Node.js 18+** installed
- **PostgreSQL** database setup

## Step 1: Initial Application Setup

### Clone and Setup Application

```bash
# Clone repository to server
git clone <your-repository-url>
cd evgenia-art-portfolio

# Run initial setup
node scripts/utilities/setup.js
# Choose production when prompted
```

### Run Production Setup Script

```bash
# This creates user, directories, installs systemd service
sudo npm run systemd:prod
# or directly: sudo ./scripts/production-setup.sh
```

## Step 2: Configure for External Access

### Remove IP Restrictions from systemd

```bash
# Edit systemd service file
sudo nano /etc/systemd/system/evgenia-art.service
```

**Remove these lines:**
```ini
IPAddressDeny=any
IPAddressAllow=localhost
IPAddressAllow=10.0.0.0/8
IPAddressAllow=172.16.0.0/12
IPAddressAllow=192.168.0.0/16
```

### Update Application Environment

```bash
# Edit production environment
sudo nano /opt/evgenia-art-portfolio/.env
```

**Key settings for external access:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Security
CORS_ORIGIN=https://your-domain.com
SECURE_COOKIES=true
TRUST_PROXY=true
```

## Step 3: Install and Configure Nginx

### Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### Manual Nginx Configuration

```bash
# Create nginx site configuration
sudo nano /etc/nginx/sites-available/your-domain.com
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Static files optimization
    location /public/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -sf /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 4: SSL Certificate Setup

### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate temporary self-signed certificate first
sudo mkdir -p /etc/ssl/private
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/your-domain.key \
    -out /etc/ssl/certs/your-domain.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"

# Start nginx
sudo systemctl restart nginx

# Get real Let's Encrypt certificate (after DNS is working)
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Option B: Custom SSL Certificate

```bash
# Upload your certificate files
sudo cp your-certificate.crt /etc/ssl/certs/your-domain.crt
sudo cp your-private.key /etc/ssl/private/your-domain.key
sudo chmod 644 /etc/ssl/certs/your-domain.crt
sudo chmod 600 /etc/ssl/private/your-domain.key
```

## Step 5: Start Services

```bash
# Reload and start all services
sudo systemctl daemon-reload
sudo systemctl restart evgenia-art
sudo systemctl restart nginx

# Enable auto-start
sudo systemctl enable evgenia-art
sudo systemctl enable nginx

# Check status
sudo systemctl status evgenia-art
sudo systemctl status nginx
```

## Step 6: DNS Configuration

Configure your domain DNS:

- **A Record**: `your-domain.com` → `YOUR_SERVER_IP`
- **CNAME Record**: `www.your-domain.com` → `your-domain.com` (optional)

## Step 7: Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Allow HTTP and HTTPS if firewall is active
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # Keep SSH access
```

## Step 8: Verification

```bash
# Test the application
curl -I http://your-domain.com
curl -I https://your-domain.com

# Check listening ports
sudo ss -tlnp | grep -E ':(80|443|3000)'

# Check logs
sudo journalctl -u evgenia-art -f --no-pager
sudo tail -f /var/log/nginx/access.log
```

## 🔄 Updating Deployment (Simple Process)

### Simple Update Process

```bash
# On your server - this is all you need!
cd /home/boris/evgenia-art-portfolio
git pull origin master
sudo npm run systemd:prod
```

The `sudo npm run systemd:prod` command automatically:
- ✅ Copies updated files to production directory
- ✅ Updates dependencies if needed
- ✅ Sets proper ownership and permissions  
- ✅ Restarts the systemd service

### Manual Alternative (if needed)

```bash
# Alternative manual process
cd /home/boris/evgenia-art-portfolio
git pull origin master

# Copy files manually
sudo rsync -av \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='logs/' \
    --exclude='pids/' \
    --exclude='sessions/' \
    --exclude='.env' \
    ./ \
    /opt/evgenia-art-portfolio/

# Update dependencies if package.json changed
cd /opt/evgenia-art-portfolio
sudo -u evgenia-art npm ci --only=production

# Restart service
sudo systemctl restart evgenia-art
```

## 📊 Service Management Commands

```bash
# Service Status
sudo systemctl status evgenia-art
sudo systemctl status nginx

# View Logs
sudo journalctl -u evgenia-art -f --no-pager
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart Services
sudo systemctl restart evgenia-art
sudo systemctl restart nginx

# Stop/Start Services
sudo systemctl stop evgenia-art
sudo systemctl start evgenia-art

# Check Application Logs
sudo tail -f /opt/evgenia-art-portfolio/logs/systemd-out.log
sudo tail -f /opt/evgenia-art-portfolio/logs/systemd-error.log
```

## 🔧 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   sudo journalctl -u evgenia-art --no-pager
   sudo systemctl status evgenia-art
   ```

2. **Nginx configuration errors**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

3. **SSL certificate issues**
   ```bash
   sudo certbot renew --dry-run
   sudo systemctl reload nginx
   ```

4. **Port conflicts**
   ```bash
   sudo ss -tlnp | grep -E ':(80|443|3000)'
   sudo lsof -i :3000
   ```

### Performance Monitoring

```bash
# Monitor system resources
htop
sudo iotop
df -h

# Monitor application performance
curl -w "%{time_total}\n" -o /dev/null -s https://your-domain.com
```

## 🚀 Quick Reference

| Task                  | Command                                          |
| --------------------- | ------------------------------------------------ |
| Deploy updates        | `git pull && sudo npm run systemd:prod`         |
| Check service status  | `sudo systemctl status evgenia-art`             |
| View live logs        | `sudo journalctl -u evgenia-art -f`             |
| Restart application   | `sudo systemctl restart evgenia-art`            |
| Restart nginx         | `sudo systemctl restart nginx`                  |
| Test nginx config     | `sudo nginx -t`                                 |
| Renew SSL certificate | `sudo certbot renew`                            |

## 📁 File Locations

- **Development Directory**: `/home/boris/evgenia-art-portfolio/`
- **Production Directory**: `/opt/evgenia-art-portfolio/`
- **Service Configuration**: `/etc/systemd/system/evgenia-art.service`
- **Nginx Configuration**: `/etc/nginx/sites-available/your-domain.com`
- **SSL Certificates**: `/etc/ssl/certs/` and `/etc/ssl/private/`
- **Production .env**: `/opt/evgenia-art-portfolio/.env`
- **Application Logs**: `/opt/evgenia-art-portfolio/logs/`
- **Nginx Logs**: `/var/log/nginx/`

---

**Success!** Your Evgenia Art Portfolio should now be accessible at:
- `https://your-domain.com` (main site)
- `https://your-domain.com/admin/` (admin panel) 