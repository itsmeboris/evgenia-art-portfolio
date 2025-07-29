#!/bin/bash

# systemd Deployment Script
# Evgenia Art Portfolio - Secure Enterprise Deployment
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
SERVICE_NAME="evgenia-art"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

# Check if running as root (needed for systemd operations)
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons."
        error "Please run as regular user with sudo access."
        exit 1
    fi

    if ! sudo -n true 2>/dev/null; then
        warning "This script requires sudo access for systemd operations."
        log "Please enter your password when prompted."
    fi
}

# Detect environment (development vs production)
detect_environment() {
    if [[ "$PWD" == *"boris"* ]] || [[ "$HOME" == *"boris"* ]]; then
        echo "development"
    else
        echo "production"
    fi
}

# Pre-migration safety checks
pre_migration_checks() {
    log "Performing pre-migration safety checks..."

    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed or not in PATH"
        exit 1
    fi

    # Check if application directory exists
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        error "Project directory not found: $PROJECT_ROOT"
        exit 1
    fi

    # Check if server.js exists
    if [[ ! -f "$PROJECT_ROOT/server.js" ]]; then
        error "server.js not found in project root"
        exit 1
    fi

    # Create required directories
    mkdir -p "$PROJECT_ROOT/logs" "$PROJECT_ROOT/pids"

    # Check systemd availability
    if ! command -v systemctl &> /dev/null; then
        error "systemd is not available on this system"
        exit 1
    fi

    success "Pre-migration checks passed"
}

# Check for conflicting processes
check_port_conflicts() {
    log "Checking for port conflicts..."

    local conflicting_pids=$(sudo lsof -ti :3000 -ti :3443 2>/dev/null || true)

    if [[ -n "$conflicting_pids" ]]; then
        warning "Found processes using required ports:"
        sudo lsof -i :3000 -i :3443 2>/dev/null || true

        read -p "Stop conflicting processes? [Y/n]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            for pid in $conflicting_pids; do
                log "Stopping process $pid"
                sudo kill "$pid" 2>/dev/null || true
            done
            sleep 2
        else
            error "Cannot proceed with conflicting processes running"
            exit 1
        fi
    fi
}

# Deploy systemd service
deploy_service() {
    local environment="$1"
    local service_file

        if [[ "$environment" == "development" ]]; then
        service_file="scripts/deployment/systemd/evgenia-art-dev.service"
        warning "Deploying DEVELOPMENT configuration"
    else
        service_file="scripts/deployment/systemd/evgenia-art.service"
        log "Deploying PRODUCTION configuration"
    fi

    if [[ ! -f "$PROJECT_ROOT/$service_file" ]]; then
        error "Service file not found: $PROJECT_ROOT/$service_file"
        exit 1
    fi

    log "Installing systemd service file..."
    sudo cp "$PROJECT_ROOT/$service_file" "/etc/systemd/system/$SERVICE_NAME.service"

    log "Reloading systemd daemon..."
    sudo systemctl daemon-reload

    log "Enabling service for auto-start..."
    sudo systemctl enable "$SERVICE_NAME.service"

    success "systemd service deployed successfully"
}

# Start and verify service
start_service() {
    log "Starting $SERVICE_NAME service..."
    sudo systemctl start "$SERVICE_NAME.service"

    # Wait a moment for startup
    sleep 3

    # Check service status
    if sudo systemctl is-active --quiet "$SERVICE_NAME.service"; then
        success "Service started successfully"

        # Show service status
        log "Service status:"
        sudo systemctl status "$SERVICE_NAME.service" --no-pager -l

        # Test HTTP endpoint
        log "Testing HTTP endpoint..."
        if curl -f -s "http://localhost:3000" > /dev/null; then
            success "HTTP endpoint responding correctly"
        else
            warning "HTTP endpoint test failed - check logs"
        fi
    else
        error "Service failed to start"
        log "Service logs:"
        sudo journalctl -u "$SERVICE_NAME.service" --no-pager -l
        exit 1
    fi
}

# Main deployment function
main() {
    log "Starting systemd deployment..."
    log "Project root: $PROJECT_ROOT"

    # Detect environment
    local environment
    environment=$(detect_environment)
    log "Detected environment: $environment"

    # Safety checks
    check_permissions
    pre_migration_checks

    # Confirm with user
    echo
    warning "This will deploy the application with secure systemd process management."
    warning "Environment: $environment"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi

    # Execute deployment
    check_port_conflicts
    deploy_service "$environment"
    start_service

    echo
    success "🎉 systemd deployment completed successfully!"
    success "🔒 Enterprise-grade security active with systemd"
    log "Service management commands:"
    log "  Start:   sudo systemctl start $SERVICE_NAME"
    log "  Stop:    sudo systemctl stop $SERVICE_NAME"
    log "  Restart: sudo systemctl restart $SERVICE_NAME"
    log "  Status:  sudo systemctl status $SERVICE_NAME"
    log "  Logs:    sudo journalctl -u $SERVICE_NAME -f"
}

# Script entry point
main "$@"