#!/bin/bash

# Production Environment Setup Script
# Evgenia Art Portfolio - Clean Environment Deployment
# Created by: devops-infrastructure-specialist
# Date: January 16, 2025

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="evgenia-art"
APP_GROUP="evgenia-art"
APP_DIR="/opt/evgenia-art-portfolio"
SERVICE_NAME="evgenia-art"
CURRENT_DIR="$(pwd)"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo for production setup"
        error "Usage: sudo ./scripts/production-setup.sh"
        exit 1
    fi
}

# Create production user and group
create_production_user() {
    log "Creating production user and group..."

    # Create group if it doesn't exist
    if ! getent group "$APP_GROUP" >/dev/null 2>&1; then
        groupadd --system "$APP_GROUP"
        success "Created group: $APP_GROUP"
    else
        log "Group $APP_GROUP already exists"
    fi

    # Create user if it doesn't exist
    if ! getent passwd "$APP_USER" >/dev/null 2>&1; then
        useradd --system \
            --gid "$APP_GROUP" \
            --home-dir "$APP_DIR" \
            --shell /bin/false \
            --comment "Evgenia Art Portfolio Service Account" \
            "$APP_USER"
        success "Created user: $APP_USER"
    else
        log "User $APP_USER already exists"
    fi
}

# Create application directory structure
create_app_directories() {
    log "Creating application directory structure..."

    # Create main application directory
    mkdir -p "$APP_DIR"

    # Create required subdirectories
    mkdir -p "$APP_DIR/logs"
    mkdir -p "$APP_DIR/pids"
    mkdir -p "$APP_DIR/sessions"
    mkdir -p "$APP_DIR/public/uploads"

    # Set ownership
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

    # Set permissions
    chmod 755 "$APP_DIR"
    chmod 755 "$APP_DIR/logs" "$APP_DIR/pids" "$APP_DIR/sessions"
    chmod 755 "$APP_DIR/public" "$APP_DIR/public/uploads"

    success "Created directory structure: $APP_DIR"
}

# Copy application files
copy_application_files() {
    log "Copying application files to production directory..."

    # Copy all application files except sensitive/dev-specific items
    rsync -av \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='logs/' \
        --exclude='pids/' \
        --exclude='sessions/' \
        --exclude='.env' \
        --exclude='evgenia-art-dev.service' \
        "$CURRENT_DIR/" \
        "$APP_DIR/"

    # Set ownership
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

    # Set script permissions
    chmod +x "$APP_DIR/scripts/"*.sh

    success "Application files copied to $APP_DIR"
}

# Install Node.js dependencies
install_dependencies() {
    log "Installing Node.js dependencies..."

    cd "$APP_DIR"

    # Install production dependencies as app user
    sudo -u "$APP_USER" npm ci --only=production

    success "Dependencies installed"
}

# Configure environment
setup_environment() {
    log "Setting up production environment..."

    # Create production .env file if it doesn't exist
    if [[ ! -f "$APP_DIR/.env" ]]; then
        cat > "$APP_DIR/.env" << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (Update these values)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evgenia_art
DB_USER=evgenia_art_user
DB_PASS=your_secure_password_here

# Session Configuration
SESSION_SECRET=your_secure_session_secret_here

# Admin Configuration (Update these values)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here

# SSL Configuration (if using HTTPS)
SSL_ENABLED=false
SSL_KEY_PATH=/path/to/ssl/private.key
SSL_CERT_PATH=/path/to/ssl/certificate.crt
EOF

        chown "$APP_USER:$APP_GROUP" "$APP_DIR/.env"
        chmod 600 "$APP_DIR/.env"  # Secure permissions for secrets

        warning "Created template .env file - PLEASE UPDATE WITH REAL VALUES!"
        warning "Edit $APP_DIR/.env with your production configuration"
    else
        log ".env file already exists"
    fi
}

# Install systemd service
install_systemd_service() {
    log "Installing systemd service..."

    # Copy production service file
    cp "$APP_DIR/scripts/deployment/systemd/evgenia-art.service" "/etc/systemd/system/$SERVICE_NAME.service"

    # Reload systemd
    systemctl daemon-reload

    # Enable service for auto-start
    systemctl enable "$SERVICE_NAME.service"

    success "systemd service installed and enabled"
}

# Validate setup
validate_setup() {
    log "Validating production setup..."

    # Check user exists
    if getent passwd "$APP_USER" >/dev/null 2>&1; then
        success "Production user exists: $APP_USER"
    else
        error "Production user not found: $APP_USER"
        exit 1
    fi

    # Check directory exists and has correct ownership
    if [[ -d "$APP_DIR" ]] && [[ "$(stat -c '%U:%G' "$APP_DIR")" == "$APP_USER:$APP_GROUP" ]]; then
        success "Application directory exists with correct ownership"
    else
        error "Application directory ownership issue"
        exit 1
    fi

    # Check service file exists
    if [[ -f "/etc/systemd/system/$SERVICE_NAME.service" ]]; then
        success "systemd service file installed"
    else
        error "systemd service file not found"
        exit 1
    fi

    # Check if service is enabled
    if systemctl is-enabled "$SERVICE_NAME.service" >/dev/null 2>&1; then
        success "Service is enabled for auto-start"
    else
        warning "Service is not enabled for auto-start"
    fi
}

# Main setup function
main() {
    log "Starting production environment setup..."
    log "Target directory: $APP_DIR"
    log "Service user: $APP_USER"

    # Confirm with user
    echo
    warning "This will set up the production environment with:"
    warning "  - User: $APP_USER"
    warning "  - Directory: $APP_DIR"
    warning "  - systemd service: $SERVICE_NAME"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Setup cancelled by user"
        exit 0
    fi

    # Execute setup steps
    check_permissions
    create_production_user
    create_app_directories
    copy_application_files
    install_dependencies
    setup_environment
    install_systemd_service
    validate_setup

    echo
    success "🎉 Production environment setup completed!"
    success "🔒 Ready for secure systemd deployment"

    echo
    log "Next steps:"
    log "1. Edit $APP_DIR/.env with your production configuration"
    log "2. Update database connection settings"
    log "3. Set secure admin credentials"
    log "4. Start the service: sudo systemctl start $SERVICE_NAME"
    log "5. Check status: sudo systemctl status $SERVICE_NAME"

    echo
    warning "⚠️  IMPORTANT: Update the .env file with real production values before starting!"
}

# Script entry point
main "$@"