# Quick Start Guide

Get the Evgenia Art Portfolio running in under 5 minutes with secure systemd deployment.

## 🚀 Super Quick Start (Recommended)

```bash
git clone <repository-url>
cd evgenia-art-portfolio
npm run setup
```

The interactive setup will:

- Install dependencies
- Create necessary directories
- Generate SSL certificates
- Configure environment variables
- Build optimized bundles
- Deploy with secure systemd service

## 📋 Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Build Assets

```bash
npm run build:dev     # Development build
# or
npm run build:prod    # Production build
```

### 4. Deploy with systemd

```bash
# Development (current user)
npm run systemd:dev

# Production (dedicated user)
npm run systemd:prod
```

## 🔧 Development Workflow

### Daily Development

```bash
# Start development service
npm run systemd:dev

# View logs in separate terminal
npm run systemd:logs

# Check service status
npm run systemd:status
```

### Making Changes

```bash
# Build changes
npm run build:dev

# Restart service to apply changes
npm run systemd:restart

# Monitor for issues
npm run systemd:logs:errors
```

## 🚀 Production Deployment

### Standard Production

```bash
npm run build                # Build optimized assets
npm run systemd:prod         # Deploy production service
npm run systemd:logs         # Monitor deployment
```

### Interactive Deployment

```bash
npm run deploy               # Choose environment and options
```

## 📊 Monitoring Commands

### Service Status

- `npm run systemd:status` - Check if service is running
- `npm run systemd:logs` - View live logs
- `npm run systemd:logs:recent` - Recent log entries (last 100)

### Log Analysis

- `npm run systemd:logs:errors` - Filter error messages
- `npm run systemd:logs:ips` - View IP access patterns
- `npm run systemd:logs:requests` - Monitor request patterns

### Service Control

- `npm run systemd:start` - Start service
- `npm run systemd:stop` - Stop service
- `npm run systemd:restart` - Restart service

## 🔍 Troubleshooting

### Service Won't Start

```bash
# Check status for error details
npm run systemd:status

# View recent error logs
npm run systemd:logs:errors

# Check if port is in use
sudo lsof -i :3000 -i :3443
```

### Common Issues

**Port Already in Use:**

```bash
sudo lsof -i :3000 -i :3443
sudo kill <PID>
npm run systemd:restart
```

**Permission Issues:**

```bash
# Development: check file permissions
ls -la scripts/deployment/systemd/evgenia-art-dev.service

# Production: may need to create service user
sudo ./scripts/production-setup.sh
```

**Build Issues:**

```bash
# Clean and rebuild
rm -rf public/dist/
npm run build:dev
npm run systemd:restart
```

## 📁 Project Structure

```
evgenia-art-portfolio/
├── 📚 docs/                   # Documentation
├── 🚀 scripts/                # Deployment scripts
│   └── deployment/systemd/    # systemd service files
├── 🔧 public/dist/            # Built assets
├── 💻 src/js/                 # Source code
└── 🔒 logs/                   # Application logs
```

## 🔒 Security Features

Your deployment includes:

- **User Isolation** - Dedicated service user for production
- **Filesystem Protection** - Read-only system directories
- **Resource Limits** - Memory and process constraints
- **Network Security** - IP address restrictions
- **Automatic Restart** - Service recovery on failure

## 📚 Next Steps

Once running, explore:

- **[systemd Deployment Guide](SYSTEMD_DEPLOYMENT.md)** - Complete deployment documentation
- **[NPM Commands](NPM_COMMANDS.md)** - All available commands
- **[Architecture Overview](ARCHITECTURE.md)** - Technical details

## 🎯 Quick Reference

| Task                   | Command                  |
| ---------------------- | ------------------------ |
| Setup new environment  | `npm run setup`          |
| Start development      | `npm run systemd:dev`    |
| Deploy production      | `npm run systemd:prod`   |
| View logs              | `npm run systemd:logs`   |
| Check status           | `npm run systemd:status` |
| Interactive deployment | `npm run deploy`         |

---

**Ready to go! Your portfolio is now running with enterprise-grade security.** 🎉🔒
