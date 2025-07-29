# NPM Commands Reference

This document provides a comprehensive guide to all available npm scripts in the Evgenia Art Portfolio project.

## 🚀 Development Commands

### Quick Setup

- `npm run setup` - Interactive project setup with environment configuration
- `npm run setup:quick` - Quick automated setup with defaults

### Build Commands

- `npm run build` - Production build with optimizations
- `npm run build:dev` - Development build with source maps
- `npm run build:prod` - Production build (alias for build)

### Development Server

- `npm run start:dev` - Start development server directly
- `npm run start:prod` - Start production server directly

### Watch Mode

- `npm run watch:dev` - Watch for changes in development mode
- `npm run watch:prod` - Watch for changes in production mode (restarts systemd)

## 🔒 systemd Process Management

### Service Deployment

- `npm run systemd:dev` - Deploy development service with systemd
- `npm run systemd:prod` - Deploy production service with systemd

### Service Control

- `npm run systemd:start` - Start systemd service
- `npm run systemd:stop` - Stop systemd service
- `npm run systemd:restart` - Restart systemd service
- `npm run systemd:status` - Check systemd service status

### Logging & Monitoring

- `npm run systemd:logs` - View live systemd logs
- `npm run systemd:logs:recent` - View recent systemd logs (last 100 lines)
- `npm run systemd:logs:ips` - Extract IP addresses from logs
- `npm run systemd:logs:requests` - Show request patterns from logs
- `npm run systemd:logs:errors` - Filter error messages from logs

### Enhanced Development

- `npm run run-systemd:dev` - Full development workflow (build + systemd)
- `npm run run-systemd:prod` - Full production workflow (build + systemd)

## 🛠️ Deployment & Utilities

### Deployment

- `npm run deploy` - Interactive deployment script

### Directory Management

- `npm run setup:dirs` - Create necessary directories (logs, pids, sessions)

### Quality & Testing

- `npm run lint` - Run ESLint linter
- `npm run lint:fix` - Run ESLint with automatic fixes

## 📋 Usage Examples

### Development Workflow

```bash
# Quick start for new environment
npm run setup                # Choose systemd for security

# Daily development
npm run systemd:dev          # Deploy with systemd
npm run systemd:logs         # Monitor in separate terminal

# Check service status
npm run systemd:status       # Verify everything is running
```

### Production Deployment

```bash
npm run build                # Build optimized assets
npm run systemd:prod         # Deploy production service
npm run systemd:logs         # Monitor deployment
```

### Monitoring & Debugging

```bash
npm run systemd:status       # Check service health
npm run systemd:logs:recent  # Recent log entries
npm run systemd:logs:errors  # Filter error messages
npm run systemd:logs:ips     # Monitor IP access patterns
```

## 📚 Notes

### systemd Service Management

- systemd commands provide enterprise-grade security and monitoring
- Services run with user isolation and resource limits
- Centralized logging via journald for better log management
- Automatic restart on failure with configurable policies

### Development vs Production

- **Development:** Uses relaxed security settings for debugging
- **Production:** Full security hardening with user isolation
- **Logging:** Both environments use structured logging with IP tracking

### Security Features

- **User Isolation:** Dedicated service user for production
- **Filesystem Protection:** Read-only system directories
- **Resource Limits:** Memory and process constraints
- **Network Security:** IP address restrictions

### Log Analysis

The specialized log commands help monitor:

- **IP Tracking:** Identify access patterns and potential issues
- **Request Monitoring:** Track API usage and performance
- **Error Analysis:** Quick identification of application errors

---

**For complete deployment guide, see [SYSTEMD_DEPLOYMENT.md](SYSTEMD_DEPLOYMENT.md)**
