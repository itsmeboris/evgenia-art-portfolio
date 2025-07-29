# Deployment Guide

**📋 This guide has been superseded by comprehensive systemd deployment documentation.**

## 🚀 **Recommended: systemd Deployment (Secure)**

For complete, up-to-date deployment instructions, see:
**[📖 SYSTEMD_DEPLOYMENT.md](SYSTEMD_DEPLOYMENT.md)**

### Quick Start

```bash
git clone <repository-url>
cd evgenia-art-portfolio
npm run setup  # Choose systemd for secure deployment
```

## 🔒 **Security Note**

**PM2 has been removed** from this project due to security vulnerabilities (ReDoS attack). All deployment now uses **systemd** for enterprise-grade security and performance.

## 📚 **Available Documentation**

- **[📖 SYSTEMD_DEPLOYMENT.md](SYSTEMD_DEPLOYMENT.md)** - Complete production deployment guide
- **[🔧 WORKFLOW_INTEGRATION.md](WORKFLOW_INTEGRATION.md)** - Workflow integration with your existing setup
- **[🏗️ ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[⚡ QUICKSTART.md](QUICKSTART.md)** - Development quick start

## 📋 **Available Commands**

### Setup

```bash
npm run setup          # Interactive setup with systemd
```

### Development

```bash
npm run systemd:dev    # Deploy development with systemd
npm run start:dev      # Direct development server
```

### Production

```bash
npm run systemd:prod   # Deploy production with systemd
npm run deploy         # Interactive deployment
```

### Monitoring

```bash
npm run systemd:status # Check service status
npm run systemd:logs   # View live logs
```

---

**For complete instructions, see [SYSTEMD_DEPLOYMENT.md](SYSTEMD_DEPLOYMENT.md)**
