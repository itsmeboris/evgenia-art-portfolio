# Deployment Files

This directory contains deployment configurations and service files for the Evgenia Art Portfolio.

## 📁 Directory Structure

```
scripts/deployment/
├── README.md           # This file
└── systemd/           # systemd service configurations
    ├── evgenia-art.service     # Production systemd service
    └── evgenia-art-dev.service # Development systemd service
```

## 🔧 systemd Service Files

### Production Service (`systemd/evgenia-art.service`)

- **User:** `evgenia-art` (dedicated system user)
- **Working Directory:** `/opt/evgenia-art-portfolio/`
- **Security:** Enterprise-grade hardening with user isolation
- **Resource Limits:** 1GB memory, 4096 processes, 65536 file descriptors
- **Network Security:** IP restrictions to localhost and private networks

### Development Service (`systemd/evgenia-art-dev.service`)

- **User:** `boris` (current development user)
- **Working Directory:** `/home/boris/projects/evgenia-art-portfolio/`
- **Security:** Relaxed for development needs
- **Resource Limits:** 2GB memory for debugging

## 🚀 Usage

These service files are automatically used by the deployment scripts:

```bash
# Development deployment (uses evgenia-art-dev.service)
npm run systemd:dev

# Production deployment (uses evgenia-art.service)
npm run systemd:prod
```

## 🔒 Security Features

Both service files include:

- Process isolation (`NoNewPrivileges=yes`)
- Filesystem protection (`ProtectSystem`)
- Private temporary directories (`PrivateTmp=yes`)
- Resource limits and monitoring
- Automatic restart on failure
- Structured logging to journald

## ⚙️ Customization

To customize for your environment:

1. **Production:** Update paths in `evgenia-art.service`
2. **Development:** Update user/paths in `evgenia-art-dev.service`
3. **Resource Limits:** Adjust `MemoryMax`, `LimitNOFILE`, etc.
4. **Network Security:** Modify `IPAddressAllow` restrictions

## 📚 Related Documentation

- [systemd Deployment Guide](../../docs/SYSTEMD_DEPLOYMENT.md)
- [Workflow Integration Guide](../../docs/WORKFLOW_INTEGRATION.md)
