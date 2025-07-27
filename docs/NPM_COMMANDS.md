# NPM Commands Reference

This document provides a complete reference of all available npm commands in the project.

## Build Commands

- `npm run build:dev` - Build for development (includes source maps)
- `npm run build:prod` - Build for production (optimized, minified)
- `npm run build:clean` - Run pre-build quality checks
- `npm run build:analyze` - Build with bundle analysis

## Run Commands (Build + Start)

- `npm run run:dev` - Build and start development server
- `npm run run:prod` - Build and start production server
- `npm run run-pm2:dev` - Build and start with PM2 (development)
- `npm run run-pm2:prod` - Build and start with PM2 (production)

## Start Commands (Server Only)

- `npm run start:dev` - Start development server (no build)
- `npm run start:prod` - Start production server (no build)
- `npm run start-pm2:dev` - Start with PM2 (development, no build)
- `npm run start-pm2:prod` - Start with PM2 (production, no build)

## Watch Commands

- `npm run watch:prod` - Watch files and rebuild on changes (production mode)
- `npm run watch-pm2:prod` - Restart PM2 on file changes

## Setup Commands

- `npm run setup` - Interactive setup wizard
- `npm run setup:quick` - Quick setup (install + build:dev)
- `npm run setup:dirs` - Create required directories

## PM2 Management

- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:watch` - Restart PM2 with file watching
- `npm run pm2:logs` - View PM2 logs
- `npm run pm2:status` - Check PM2 status

## Test Commands

- `npm test` - Currently shows "no test specified" (tests to be implemented)

## Utility Commands

- `npm run convert-webp` - Convert images to WebP format
- `npm run update-bundles` - Update HTML bundle references
- `npm run sitemap:generate` - Generate sitemap.xml
- `npm run sitemap:validate` - Validate sitemap
- `npm run sitemap:stats` - Show sitemap statistics
- `npm run sitemap:robots` - Generate robots.txt
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Common Workflows

### Development
```bash
npm run setup:quick     # First time setup
npm run start:dev       # Start dev server
```

### Production Deployment
```bash
npm run build:prod      # Build for production
npm run run-pm2:prod    # Deploy with PM2
npm run pm2:logs        # Monitor logs
```

### Active Development
```bash
# Terminal 1
npm run watch:prod      # Auto-rebuild on changes

# Terminal 2
npm run start:dev       # Run dev server
```

## Notes

- Commands with `:dev` suffix use development configuration
- Commands with `:prod` suffix use production configuration
- `run:*` commands = build + start
- `start:*` commands = start only (assumes already built)
- PM2 commands require PM2 to be installed (included in devDependencies)