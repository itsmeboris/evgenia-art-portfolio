# Deployment Guide

## Quick Start (Recommended)

🚀 **For fastest setup, use the interactive setup script:**

```bash
git clone <repository-url>
cd evgenia-art-portfolio
npm run setup
```

The setup script will:
- Install all dependencies
- Create necessary directories
- Generate SSL certificates
- Configure environment variables
- Build development bundles
- Start the server

## Manual Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SSL certificates (for HTTPS)
- Process manager (PM2 recommended)

### Environment Setup

1. **Quick setup (automated):**
   ```bash
   npm run setup:quick
   ```

2. **Manual setup:**
   ```bash
   cp .env.example .env
   npm install
   npm run dev:build
   ```

3. **Configure environment variables:**
   - Set production values in `.env`
   - Generate secure `SESSION_SECRET` (32+ characters)
   - Create bcrypt hash for `ADMIN_PASSWORD_HASH`

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

## Development vs Production Commands

### Development Commands (Fast & Quick)

```bash
# Start development server (after setup)
npm run dev:server

# Full development build and start
npm run dev

# Watch for file changes (run in separate terminal)
npm run dev:watch

# Quick setup for existing project
npm run setup:quick
```

### Production Commands (Optimized & Complete)

```bash
# Full production build and start
npm run prod:start

# Build for production only
npm run build

# Start production server
npm run start:prod
```

## Running in Production

### Using PM2 (Recommended)

```bash
# Start application
npm run pm2:start

# View logs
npm run pm2:logs

# Check status
npm run pm2:status

# Monitor (requires PM2 to be running)
npx pm2 monit

# Stop/restart
npm run pm2:stop
npm run pm2:restart
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
   - Run `npm run dev:build` for development
   - Run `npm run build` for production  
   - Check `public/dist/` directory exists
   - Verify HTML files reference correct bundle names

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
