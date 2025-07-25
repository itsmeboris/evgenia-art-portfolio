# Deployment Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SSL certificates (for HTTPS)
- Process manager (PM2 recommended)

## Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**
   - Set production values in `.env`
   - Generate secure `SESSION_SECRET` (32+ characters)
   - Create bcrypt hash for `ADMIN_PASSWORD_HASH`

3. **Install dependencies:**
   ```bash
   npm install --production
   ```

## Building for Production

1. **Build optimized bundles:**

   ```bash
   npm run build
   ```

2. **Verify build output:**
   ```bash
   ls -la public/dist/
   ```

## SSL Certificate Setup

1. **For development (self-signed):**

   ```bash
   mkdir certs
   openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
   ```

2. **For production:**
   - Use Let's Encrypt or your certificate authority
   - Place certificates in `certs/` directory
   - Update paths in `.env` if needed

## Running in Production

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# View logs
pm2 logs evgenia-art

# Monitor
pm2 monit
```

### Using Node.js directly

```bash
NODE_ENV=production node server.js
```

## Health Checks

- Health endpoint: `GET /health`
- Admin panel: `https://yourdomain.com/admin`
- SSL check: `https://yourdomain.com`

## Performance Optimizations

- ✅ Gzip compression enabled
- ✅ Static asset caching
- ✅ WebP image optimization
- ✅ JavaScript minification
- ✅ CSS optimization

## Security Features

- ✅ HTTPS enforcement
- ✅ Security headers (Helmet.js)
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Session security
- ✅ Input validation

## Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **SSL certificate issues:**
   - Check certificate validity
   - Verify file permissions
   - Update certificate paths in `.env`

3. **Bundle loading errors:**
   - Run `npm run build` to regenerate bundles
   - Check `public/dist/` directory exists

### Logs

- Application logs: `pm2 logs evgenia-art`
- Error logs: Check console output
- Session logs: `sessions/` directory

## Monitoring

- Set up log rotation
- Monitor disk usage (`public/dist/`, `sessions/`)
- Track SSL certificate expiration
- Monitor application performance

## Backup Strategy

### Critical Files to Backup

- `public/data/artwork-data.json` - Artwork database
- `public/assets/images/` - Image files
- `.env` - Environment configuration
- `sessions/` - User sessions (optional)

### Backup Commands

```bash
# Backup artwork data
cp public/data/artwork-data.json backup/artwork-data-$(date +%Y%m%d).json

# Backup images
tar -czf backup/images-$(date +%Y%m%d).tar.gz public/assets/images/
```

## Updates and Maintenance

1. **Update dependencies:**

   ```bash
   npm update
   npm audit fix
   ```

2. **Update artwork data:**
   - Use admin panel
   - Or manually update `public/data/artwork-data.json`

3. **Rebuild assets:**

   ```bash
   npm run build
   ```

4. **Restart application:**
   ```bash
   pm2 restart evgenia-art
   ```
