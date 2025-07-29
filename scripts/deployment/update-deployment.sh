#!/bin/bash

# Deployment Update Script for Evgenia Art Portfolio
# This script pulls changes from git and updates the production environment
# Usage: sudo ./scripts/deployment/update-deployment.sh [branch]

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
   exit 1
fi

# Configuration
BRANCH="${1:-main}"
DEV_DIR="/home/boris/evgenia-art-portfolio"
PROD_DIR="/opt/evgenia-art-portfolio"
SERVICE_NAME="evgenia-art"
APP_USER="evgenia-art"
BACKUP_DIR="/opt/backups/evgenia-art"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting deployment update process..."
log "Branch: $BRANCH"
log "Development directory: $DEV_DIR"
log "Production directory: $PROD_DIR"

# Step 1: Create backup of current production
log "Creating backup of current production..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup critical files
cp -r "$PROD_DIR" "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
success "Backup created: $BACKUP_DIR/$BACKUP_NAME"

# Step 2: Check if development directory exists
if [[ ! -d "$DEV_DIR" ]]; then
    error "Development directory not found: $DEV_DIR"
    error "Please clone the repository first:"
    error "git clone <your-repository-url> $DEV_DIR"
    exit 1
fi

# Step 3: Update development repository
log "Updating development repository..."
cd "$DEV_DIR"

# Check if it's a git repository
if [[ ! -d ".git" ]]; then
    error "Not a git repository: $DEV_DIR"
    exit 1
fi

# Get current branch and status
CURRENT_BRANCH=$(git branch --show-current)
log "Current branch: $CURRENT_BRANCH"

# Stash any local changes
if ! git diff-index --quiet HEAD --; then
    warning "Local changes detected, stashing..."
    git stash push -m "Auto-stash before deployment $(date +%Y%m%d-%H%M%S)"
fi

# Fetch latest changes
log "Fetching latest changes..."
git fetch origin

# Switch to target branch if needed
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    log "Switching to branch: $BRANCH"
    git checkout "$BRANCH"
fi

# Pull latest changes
log "Pulling latest changes from origin/$BRANCH..."
git pull origin "$BRANCH"

success "Development repository updated"

# Step 4: Check for package.json changes
PACKAGE_CHANGED=false
if [[ -f "$PROD_DIR/package.json" ]] && [[ -f "$DEV_DIR/package.json" ]]; then
    if ! diff -q "$PROD_DIR/package.json" "$DEV_DIR/package.json" > /dev/null; then
        PACKAGE_CHANGED=true
        log "package.json changes detected"
    fi
fi

# Step 5: Stop production service
log "Stopping production service..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl stop "$SERVICE_NAME"
    success "Service stopped"
else
    warning "Service was not running"
fi

# Step 6: Copy updated files to production
log "Copying updated files to production..."
rsync -av \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='logs/' \
    --exclude='pids/' \
    --exclude='sessions/' \
    --exclude='.env' \
    --exclude='*.log' \
    --exclude='*.pid' \
    --delete \
    "$DEV_DIR/" \
    "$PROD_DIR/"

# Preserve production .env file
if [[ -f "$BACKUP_DIR/$BACKUP_NAME/evgenia-art-portfolio/.env" ]]; then
    cp "$BACKUP_DIR/$BACKUP_NAME/evgenia-art-portfolio/.env" "$PROD_DIR/.env"
    success "Production .env file preserved"
fi

# Step 7: Set proper ownership
log "Setting proper ownership..."
chown -R "$APP_USER:$APP_USER" "$PROD_DIR"
success "Ownership updated"

# Step 8: Update dependencies if needed
if [[ "$PACKAGE_CHANGED" == true ]]; then
    log "Updating Node.js dependencies..."
    cd "$PROD_DIR"
    sudo -u "$APP_USER" npm ci --only=production
    success "Dependencies updated"
else
    log "No package.json changes, skipping dependency update"
fi

# Step 9: Build production assets if build script exists
log "Building production assets..."
cd "$PROD_DIR"

if sudo -u "$APP_USER" npm run --silent 2>/dev/null | grep -q "build:prod"; then
    log "Running production build..."
    sudo -u "$APP_USER" npm run build:prod
    success "Production build completed"
elif sudo -u "$APP_USER" npm run --silent 2>/dev/null | grep -q "build"; then
    log "Running standard build..."
    sudo -u "$APP_USER" npm run build
    success "Build completed"
else
    warning "No build script found, skipping build step"
fi

# Step 10: Run database migrations if they exist
if [[ -f "$PROD_DIR/scripts/database/migrate.js" ]]; then
    log "Running database migrations..."
    cd "$PROD_DIR"
    sudo -u "$APP_USER" node scripts/database/migrate.js || warning "Migration script failed or not needed"
elif [[ -f "$PROD_DIR/src/scripts/initDatabase.js" ]]; then
    log "Running database initialization..."
    cd "$PROD_DIR"
    sudo -u "$APP_USER" node src/scripts/initDatabase.js || warning "Database init failed or not needed"
fi

# Step 11: Start production service
log "Starting production service..."
systemctl start "$SERVICE_NAME"

# Wait a moment for service to start
sleep 3

# Check if service started successfully
if systemctl is-active --quiet "$SERVICE_NAME"; then
    success "Service started successfully"
else
    error "Service failed to start"
    log "Checking service status..."
    systemctl status "$SERVICE_NAME" --no-pager || true
    
    # Try to restore from backup
    log "Attempting to restore from backup..."
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    
    if [[ -d "$BACKUP_DIR/$BACKUP_NAME/evgenia-art-portfolio" ]]; then
        rsync -av "$BACKUP_DIR/$BACKUP_NAME/evgenia-art-portfolio/" "$PROD_DIR/"
        chown -R "$APP_USER:$APP_USER" "$PROD_DIR"
        systemctl start "$SERVICE_NAME"
        
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            warning "Service restored from backup"
        else
            error "Failed to restore service from backup"
        fi
    fi
    
    exit 1
fi

# Step 12: Verify deployment
log "Verifying deployment..."

# Test if application responds
sleep 5
if curl -f -s http://localhost:3000 > /dev/null; then
    success "Application is responding"
else
    warning "Application may not be responding correctly"
fi

# Step 13: Clean up old backups (keep last 5)
log "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -1t | tail -n +6 | xargs -r rm -rf
success "Old backups cleaned up (kept 5 most recent)"

# Step 14: Restart nginx if it's running
if systemctl is-active --quiet nginx; then
    log "Reloading nginx configuration..."
    systemctl reload nginx
    success "Nginx reloaded"
fi

echo
success "🎉 Deployment update completed successfully!"
echo
echo "📊 Deployment Summary:"
echo "====================="
echo "• Branch deployed: $BRANCH"
echo "• Backup created: $BACKUP_DIR/$BACKUP_NAME"
echo "• Service status: $(systemctl is-active $SERVICE_NAME)"
echo "• Dependencies updated: $([ "$PACKAGE_CHANGED" == true ] && echo "Yes" || echo "No")"
echo
echo "🔧 Post-deployment Commands:"
echo "============================"
echo "• Check service status: sudo systemctl status $SERVICE_NAME"
echo "• View live logs:       sudo journalctl -u $SERVICE_NAME -f"
echo "• Check application:    curl -I http://localhost:3000"
echo "• Restart if needed:    sudo systemctl restart $SERVICE_NAME"
echo
echo "🌐 Application Status:"
echo "====================="
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Service is running"
    
    # Try to get the domain from nginx config
    DOMAIN=$(ls /etc/nginx/sites-enabled/ 2>/dev/null | head -n1 || echo "localhost")
    if [[ "$DOMAIN" != "localhost" ]]; then
        echo "🔗 Website: https://$DOMAIN"
        echo "🔐 Admin:   https://$DOMAIN/admin/"
    else
        echo "🔗 Local:   http://localhost:3000"
        echo "🔐 Admin:   http://localhost:3000/admin/"
    fi
else
    echo "❌ Service is not running"
    echo "   Check logs: sudo journalctl -u $SERVICE_NAME -n 50"
fi

echo
log "Deployment update process completed" 