# Deployment Quick Reference

**Evgenia Art Portfolio - Production Deployment Commands**

## 🚀 One-Time Setup (New Server)

```bash
# 1. Clone repository
git clone <your-repository-url>
cd evgenia-art-portfolio

# 2. Run initial setup
node scripts/utilities/setup.js
# Choose production when prompted

# 3. Setup production environment
sudo npm run systemd:prod

# 4. Configure nginx and SSL for domain access
sudo npm run deploy:nginx evgenia-art.shuktech.shop

# 5. Get real SSL certificate (after DNS is configured)
sudo certbot --nginx -d evgenia-art.shuktech.shop
```

## 🔄 Regular Updates (After Code Changes)

```bash
# Pull latest changes and deploy
sudo npm run deploy:update

# Or deploy specific branch
sudo npm run deploy:update:main
sudo npm run deploy:update:dev
```

## 📊 Service Management

| Command                        | Description          |
| ------------------------------ | -------------------- |
| `sudo npm run systemd:status`  | Check service status |
| `sudo npm run systemd:logs`    | View live logs       |
| `sudo npm run systemd:restart` | Restart service      |
| `sudo npm run systemd:start`   | Start service        |
| `sudo npm run systemd:stop`    | Stop service         |

## 🌐 Domain & SSL Management

| Command                              | Description                      |
| ------------------------------------ | -------------------------------- |
| `sudo npm run deploy:nginx [domain]` | Configure nginx + SSL for domain |
| `sudo certbot --nginx -d [domain]`   | Get real SSL certificate         |
| `sudo certbot renew`                 | Renew SSL certificates           |
| `sudo nginx -t`                      | Test nginx configuration         |
| `sudo systemctl reload nginx`        | Reload nginx config              |

## 🔧 Manual Deployment Process

### Initial Server Setup

```bash
# 1. Production user and directories
sudo ./scripts/production-setup.sh

# 2. Configure nginx and SSL
sudo ./scripts/deployment/configure-nginx.sh evgenia-art.shuktech.shop

# 3. Remove IP restrictions from systemd
sudo nano /etc/systemd/system/evgenia-art.service
# Remove IPAddressDeny and IPAddressAllow lines

# 4. Update .env for external access
sudo nano /opt/evgenia-art-portfolio/.env
# Set: HOST=0.0.0.0, CORS_ORIGIN=https://your-domain.com

# 5. Start services
sudo systemctl daemon-reload
sudo systemctl restart evgenia-art nginx
```

### Update Deployment

```bash
# 1. Pull changes
cd /home/boris/evgenia-art-portfolio
git pull origin main

# 2. Deploy to production
sudo ./scripts/deployment/update-deployment.sh

# Alternative: Manual deployment
sudo rsync -av --exclude='.git/' --exclude='node_modules/' \
    --exclude='logs/' --exclude='.env' \
    ./ /opt/evgenia-art-portfolio/

sudo systemctl restart evgenia-art
```

## 📁 Important File Locations

| Type                      | Location                                  |
| ------------------------- | ----------------------------------------- |
| **Development Directory** | `/home/boris/evgenia-art-portfolio/`      |
| **Production Directory**  | `/opt/evgenia-art-portfolio/`             |
| **Service Configuration** | `/etc/systemd/system/evgenia-art.service` |
| **Nginx Configuration**   | `/etc/nginx/sites-available/[domain]`     |
| **SSL Certificates**      | `/etc/ssl/certs/` and `/etc/ssl/private/` |
| **Production .env**       | `/opt/evgenia-art-portfolio/.env`         |
| **Application Logs**      | `/opt/evgenia-art-portfolio/logs/`        |
| **Nginx Logs**            | `/var/log/nginx/`                         |
| **Backups**               | `/opt/backups/evgenia-art/`               |

## 🚨 Troubleshooting Commands

```bash
# Service issues
sudo systemctl status evgenia-art
sudo journalctl -u evgenia-art --no-pager
sudo journalctl -u evgenia-art -f

# Nginx issues
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Application logs
sudo tail -f /opt/evgenia-art-portfolio/logs/systemd-out.log
sudo tail -f /opt/evgenia-art-portfolio/logs/systemd-error.log

# Port conflicts
sudo ss -tlnp | grep -E ':(80|443|3000)'
sudo lsof -i :3000

# Test application response
curl -I http://localhost:3000
curl -I https://evgenia-art.shuktech.shop
```

## 🔒 Security Checklist

- ✅ systemd service hardening enabled
- ✅ IP restrictions removed for external access
- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ Security headers configured in nginx
- ✅ SSL certificates (Let's Encrypt recommended)
- ✅ Firewall rules (allow 80, 443, 22)
- ✅ Production .env with secure settings

## 📝 DNS Configuration

For domain `evgenia-art.shuktech.shop`:

| Type      | Name                            | Value                       |
| --------- | ------------------------------- | --------------------------- |
| **A**     | `evgenia-art.shuktech.shop`     | `13.61.217.218`             |
| **CNAME** | `www.evgenia-art.shuktech.shop` | `evgenia-art.shuktech.shop` |

## 🎯 Success Verification

```bash
# Check all services are running
sudo systemctl is-active evgenia-art nginx

# Test website access
curl -I https://evgenia-art.shuktech.shop
curl -I https://evgenia-art.shuktech.shop/admin/

# Verify SSL certificate
openssl s_client -connect evgenia-art.shuktech.shop:443 -servername evgenia-art.shuktech.shop

# Check logs for errors
sudo journalctl -u evgenia-art --since "10 minutes ago" | grep -i error
```

---

## 💡 Quick Tips

- **Always backup before updates**: Automated in deployment script
- **Check logs after deployment**: `sudo npm run systemd:logs`
- **Test local first**: `npm run run:dev` in development
- **Use Let's Encrypt**: Free SSL certificates that auto-renew
- **Monitor disk space**: `/opt/backups/` and `/var/log/` can grow
- **Keep dependencies updated**: Check `npm audit` periodically

---

**🌐 Live Site**: https://evgenia-art.shuktech.shop  
**🔐 Admin Panel**: https://evgenia-art.shuktech.shop/admin/
