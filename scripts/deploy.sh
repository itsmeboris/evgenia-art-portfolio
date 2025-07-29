#!/bin/bash

# Unified Deployment Script
# Evgenia Art Portfolio - Integrated with existing setup workflow
# Created by: devops-infrastructure-specialist
# Date: January 16, 2025

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Show help information
show_help() {
    echo -e "${BLUE}Evgenia Art Portfolio - Unified Deployment${NC}"
    echo ""
    echo "Usage: ./scripts/deploy.sh [ENVIRONMENT] [PROCESS_MANAGER]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  dev, development    Deploy for development"
    echo "  prod, production    Deploy for production"
    echo ""
    echo "PROCESS_MANAGER:"
    echo "  systemd             Use systemd (✅ secure, no vulnerabilities)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy.sh dev systemd     # Development with systemd (secure)"
    echo "  ./scripts/deploy.sh prod systemd    # Production with systemd (secure)"
    echo "  ./scripts/deploy.sh                 # Interactive mode"
    echo ""
    echo "NPM Script Equivalents:"
    echo "  npm run systemd:dev                 # Development with systemd"
    echo "  npm run run-systemd:prod           # Production with systemd"
    echo "  npm run deploy                     # Interactive deployment"
}

# Interactive mode
interactive_deployment() {
    echo -e "${BLUE}🚀 Evgenia Art Portfolio - Interactive Deployment${NC}"
    echo ""

    # Environment selection
    echo "📍 Choose deployment environment:"
    echo "   1) Development (current machine)"
    echo "   2) Production (clean environment)"
    read -p "Environment (1-2): " env_choice

    case $env_choice in
        1|dev|development) ENVIRONMENT="development" ;;
        2|prod|production) ENVIRONMENT="production" ;;
        *)
            error "Invalid environment choice"
            exit 1
            ;;
    esac

        # Process manager selection (only systemd available)
    echo ""
    echo "🔧 Process Manager: systemd"
    echo "   ✅ Secure - No vulnerabilities, enterprise-grade"
    echo "   📋 Only systemd is available for secure deployment"
    PROCESS_MANAGER="systemd"
}

# Deploy function
deploy() {
    local environment=$1
    local process_manager=$2

    log "Starting deployment..."
    log "Environment: $environment"
    log "Process Manager: $process_manager"

    if [[ "$process_manager" == "systemd" ]]; then
        if [[ "$environment" == "development" ]]; then
            log "Deploying development with systemd (secure)..."
            npm run systemd:dev
        else
            log "Deploying production with systemd (secure)..."
            npm run systemd:prod
        fi

        echo ""
        success "🎉 systemd deployment completed!"

        echo ""
        log "Management commands:"
        log "  npm run systemd:status    - Check service status"
        log "  npm run systemd:logs      - View live logs"
        log "  npm run systemd:restart   - Restart service"
        log "  npm run systemd:stop      - Stop service"

        else
        error "Unsupported process manager: $process_manager"
        error "Only systemd is supported"
        exit 1
    fi

    echo ""
    log "Application should be available at:"
    log "  HTTP:  http://localhost:3000"
    log "  HTTPS: https://localhost:3443"
    log "  Admin: http://localhost:3000/admin/"
}

# Main function
main() {
    # Check for help flag
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi

    # Parse arguments
    local environment=""
    local process_manager=""

    if [[ $# -eq 0 ]]; then
        # Interactive mode
        interactive_deployment
    elif [[ $# -eq 2 ]]; then
        # Command line arguments
        case $1 in
            dev|development) environment="development" ;;
            prod|production) environment="production" ;;
            *)
                error "Invalid environment: $1"
                show_help
                exit 1
                ;;
        esac

                case $2 in
            systemd) process_manager="systemd" ;;
            *)
                error "Invalid process manager: $2"
                error "Only 'systemd' is supported for secure deployment"
                show_help
                exit 1
                ;;
        esac
    else
        error "Invalid number of arguments"
        show_help
        exit 1
    fi

    # Deploy
    deploy "$environment" "$process_manager"
}

# Script entry point
main "$@"