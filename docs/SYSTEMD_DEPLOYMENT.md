# Production Deployment Guide

**Evgenia Art Portfolio - systemd Production Deployment**
**Security Status:** PM2 ReDoS vulnerability eliminated ✅
**Process Manager:** systemd (enterprise-grade security)

## 🚀 Quick Production Deployment

### Prerequisites

- **Linux server** with systemd (Ubuntu 20.04+, CentOS 8+, etc.)
- **Node.js 18+** installed
- **PostgreSQL** database setup
- **sudo/root access** for initial setup

### Step 1: Clone Repository

```bash
git clone <your-repository-url>
cd evgenia-art-portfolio
```

### Step 2: Run Production Setup

```bash
# This script creates user, directories, installs service, etc.
sudo ./scripts/production-setup.sh
```

### Step 3: Configure Environment

```bash
# Edit production configuration
sudo nano /opt/evgenia-art-portfolio/.env

# Update database settings, admin credentials, etc.
```

### Step 4: Start Service

```bash
# Start the systemd service
sudo systemctl start evgenia-art

# Check status
sudo systemctl status evgenia-art

# View logs
sudo journalctl -u evgenia-art -f
```

## 📋 Detailed Production Setup Process

### 1. Server Preparation

#### Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL (if not already installed)
sudo apt-get install -y postgresql postgresql-contrib

# Install required system packages
sudo apt-get install -y git rsync curl
```

#### Verify Prerequisites

```bash
node --version    # Should be 18+
npm --version     # Should be 8+
systemctl --version  # Should show systemd
```

### 2. Application Deployment

#### Clone and Setup

```bash
# Clone your repository
git clone <your-repository-url>
cd evgenia-art-portfolio

# Run automated production setup
sudo ./scripts/production-setup.sh
```

#### What the Setup Script Does:

1. **Creates production user:** `evgenia-art` (system account)
2. **Creates directory structure:** `/opt/evgenia-art-portfolio/`
3. **Copies application files** (excludes dev-specific items)
4. **Installs dependencies:** `npm ci --only=production`
5. **Creates environment template:** `/opt/evgenia-art-portfolio/.env`
6. **Installs systemd service:** `/etc/systemd/system/evgenia-art.service`
7. **Enables auto-start:** Service starts on boot

### 3. Environment Configuration

#### Edit Production Configuration

```bash
sudo nano /opt/evgenia-art-portfolio/.env
```

#### Required Configuration Values:

```bash
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evgenia_art
DB_USER=evgenia_art_user
DB_PASS=your_secure_database_password

# Session Configuration
SESSION_SECRET=your_secure_session_secret_min_32_chars

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# SSL Configuration (if using HTTPS)
SSL_ENABLED=false
SSL_KEY_PATH=/path/to/ssl/private.key
SSL_CERT_PATH=/path/to/ssl/certificate.crt
```

#### Generate Secure Values:

```bash
# Generate secure session secret
openssl rand -base64 32

# Generate secure passwords
openssl rand -base64 24
```

### 4. Database Setup

#### Create Database and User

```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE evgenia_art;

-- Create user
CREATE USER evgenia_art_user WITH PASSWORD 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE evgenia_art TO evgenia_art_user;

-- Exit
\q
```

#### Initialize Database

```bash
# Run database migrations (if you have them)
cd /opt/evgenia-art-portfolio
sudo -u evgenia-art npm run db:migrate
```

### 5. Service Management

#### Start Service

```bash
sudo systemctl start evgenia-art
```

#### Check Status

```bash
sudo systemctl status evgenia-art
```

#### Enable Auto-start (already enabled by setup script)

```bash
sudo systemctl enable evgenia-art
```

#### View Logs

```bash
# Live logs
sudo journalctl -u evgenia-art -f

# Recent logs
sudo journalctl -u evgenia-art --since "1 hour ago"

# All logs
sudo journalctl -u evgenia-art
```

#### Service Control Commands

```bash
sudo systemctl start evgenia-art     # Start service
sudo systemctl stop evgenia-art      # Stop service
sudo systemctl restart evgenia-art   # Restart service
sudo systemctl reload evgenia-art    # Reload configuration
sudo systemctl status evgenia-art    # Check status
```

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check detailed status
sudo systemctl status evgenia-art -l

# Check logs for errors
sudo journalctl -u evgenia-art --since "10 minutes ago"

# Check if port is in use
sudo lsof -i :3000

# Check file permissions
ls -la /opt/evgenia-art-portfolio/
```

#### Database Connection Issues

```bash
# Test database connection
sudo -u evgenia-art psql -h localhost -U evgenia_art_user -d evgenia_art

# Check PostgreSQL is running
sudo systemctl status postgresql
```

#### Permission Issues

```bash
# Fix ownership if needed
sudo chown -R evgenia-art:evgenia-art /opt/evgenia-art-portfolio/

# Check service file permissions
ls -la /etc/systemd/system/evgenia-art.service
```

### Emergency Recovery

If the systemd service fails to start:

```bash
# Check service status and logs
npm run systemd:status
npm run systemd:logs:errors

# Manual restart
sudo systemctl restart evgenia-art

# Check for port conflicts
sudo lsof -i :3000 -i :3443

# Kill conflicting processes if needed
sudo kill <PID>
```

## 🔒 Security Features

### systemd Security Hardening

- **User Isolation:** Runs as dedicated `evgenia-art` user
- **Filesystem Protection:** Read-only system, limited write access
- **Process Security:** `NoNewPrivileges=yes`
- **Resource Limits:** Memory (1GB), processes, file descriptors
- **Network Security:** IP address restrictions
- **Kernel Protection:** Advanced systemd security features

### File Permissions

- **Application files:** `evgenia-art:evgenia-art` ownership
- **Environment file:** `600` permissions (secrets protected)
- **Service account:** `/bin/false` shell (no login)
- **Directories:** Minimal required permissions

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Service health
sudo systemctl is-active evgenia-art

# Application health
curl http://localhost:3000/api/health

# Resource usage
sudo systemctl show evgenia-art --property=MemoryCurrent
```

### Log Rotation

systemd automatically handles log rotation through journald.

### Backup Considerations

- **Database:** Regular PostgreSQL backups
- **Uploads:** `/opt/evgenia-art-portfolio/public/uploads/`
- **Sessions:** `/opt/evgenia-art-portfolio/sessions/` (if file-based)
- **Configuration:** `/opt/evgenia-art-portfolio/.env`

## 🚀 Updates & Deployments

### Code Updates

```bash
# Stop service
sudo systemctl stop evgenia-art

# Update code (in your deployment directory)
git pull origin main

# Copy updated files
sudo rsync -av --exclude='.git/' --exclude='node_modules/' --exclude='.env' \
    ./ /opt/evgenia-art-portfolio/

# Update dependencies if needed
cd /opt/evgenia-art-portfolio
sudo -u evgenia-art npm ci --only=production

# Fix permissions
sudo chown -R evgenia-art:evgenia-art /opt/evgenia-art-portfolio/

# Start service
sudo systemctl start evgenia-art
```

### Zero-Downtime Updates (Advanced)

For zero-downtime deployments, consider:

- Load balancer with multiple instances
- Blue-green deployment strategy
- Container orchestration (Docker + Docker Compose)

## 📞 Support

### Log Collection for Support

```bash
# Collect system info
uname -a
sudo systemctl status evgenia-art
sudo journalctl -u evgenia-art --since "1 hour ago" > evgenia-art-logs.txt
```

### Service File Location

- **Production Service:** `/etc/systemd/system/evgenia-art.service`
- **Application:** `/opt/evgenia-art-portfolio/`
- **Logs:** `journalctl -u evgenia-art`

---

## ✅ Production Deployment Checklist

- [ ] Server prerequisites installed (Node.js, PostgreSQL, systemd)
- [ ] Repository cloned to server
- [ ] `sudo ./scripts/production-setup.sh` executed successfully
- [ ] `/opt/evgenia-art-portfolio/.env` configured with real values
- [ ] Database created and accessible
- [ ] `sudo systemctl start evgenia-art` executed
- [ ] Service status is `active (running)`
- [ ] HTTP endpoint responding: `curl http://localhost:3000`
- [ ] Logs show no errors: `sudo journalctl -u evgenia-art`
- [ ] Service enabled for auto-start: `systemctl is-enabled evgenia-art`

**🎉 Your Evgenia Art Portfolio is now securely deployed with systemd process management!**
