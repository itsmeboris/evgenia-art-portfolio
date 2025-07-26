# Quick Start Guide

## 🚀 Super Fast Setup

```bash
git clone <repository-url>
cd evgenia-art-portfolio
npm run setup
```

The interactive setup will ask for:

- Server IP (default: localhost)
- Server port (default: 3000)
- Admin username (default: admin)
- Admin password (default: admin)

## 📋 What the Setup Does

1. ✅ Installs all dependencies
2. ✅ Creates required directories (`logs`, `pids`, `sessions`, `certs`)
3. ✅ Generates SSL certificates for HTTPS
4. ✅ Creates `.env` file with your configuration
5. ✅ Builds development bundles
6. ✅ Ready to start development server

## 🔄 Daily Development Workflow

```bash
# Start development server
npm run dev:server

# For active development (auto-rebuild on file changes)
npm run dev:watch    # Terminal 1
npm run dev:server   # Terminal 2
```

## 🏗️ Production Deployment

```bash
# Build and start production server
npm run prod:start

# Or with PM2 (recommended)
npm run pm2:start
```

## 🔗 Access Points

- **Website:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin/
- **HTTPS:** https://localhost:3443

## 🛠️ Available Commands

### Setup Commands

- `npm run setup` - Interactive setup script
- `npm run setup:quick` - Quick automated setup

### Development Commands

- `npm run dev:server` - Start development server
- `npm run dev:watch` - Watch files for changes
- `npm run dev:build` - Build development bundles

### Production Commands

- `npm run build` - Build optimized production bundles
- `npm run start:prod` - Start production server
- `npm run prod:start` - Build and start production

### PM2 Commands

- `npm run pm2:start` - Start with PM2 (local dependency)
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:logs` - View PM2 logs
- `npm run pm2:status` - Check PM2 status

## 🔧 Configuration

All configuration is handled automatically by the setup script. Manual configuration details are in [DEPLOYMENT.md](DEPLOYMENT.md).

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Missing bundles:**

   ```bash
   npm run dev:build
   ```

3. **SSL certificate issues:**
   ```bash
   npm run setup  # Re-run setup to regenerate certificates
   ```

For detailed troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 📱 Mobile Testing

The server automatically detects your local IP for mobile testing:

- Check the console output for your mobile URL
- Usually: `http://192.168.x.x:3000`

## 🎯 Next Steps

1. Visit http://localhost:3000 to see the portfolio
2. Access http://localhost:3000/admin/ to manage content
3. Make changes to files and see them update instantly
4. Deploy to production when ready

That's it! You're ready to develop and deploy the art portfolio. 🎨
