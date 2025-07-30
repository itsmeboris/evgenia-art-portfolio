# Container Deployment Guide for Evgenia Art Portfolio

This guide provides instructions for deploying the Evgenia Art Portfolio website using Docker containers.

## Prerequisites

- Docker Engine (version 20.10+)
- Docker Compose (version 2.0+)
- Git

## Project Structure

The containerized application consists of:

- Node.js application (main website)
- Nginx (reverse proxy for production)

## Configuration Files

- `Dockerfile` - Multi-stage build for the Node.js application
- `docker-compose.yml` - For local development
- `docker-compose.prod.yml` - For production deployment with Nginx
- `.dockerignore` - Files to exclude from container builds
- `.env.docker.example` - Example environment variables for Docker
- `docker-entrypoint.sh` - Container initialization script
- `nginx/` - Nginx configuration files

## Quick Start

### Local Development

1. Clone the repository:

   ```
   git clone <repository-url>
   cd evgenia-art-portfolio
   ```

2. Create environment file:

   ```
   cp .env.docker.example .env
   ```

3. Build and start containers:

   ```
   docker compose up --build
   ```

4. Access the website at http://localhost:3000

### Production Deployment

1. Clone the repository on your production server:

   ```
   git clone <repository-url>
   cd evgenia-art-portfolio
   ```

2. Create production environment file:

   ```
   cp .env.docker.example .env
   ```

3. Edit `.env` with production values:

   ```
   nano .env
   ```

4. Build and start production containers:

   ```
   docker compose -f docker-compose.prod.yml up -d --build
   ```

5. Access the website at http://localhost (Nginx will serve on port 80)

## SSL Configuration

To enable SSL:

1. Update your domain in `nginx/sites-enabled/evgenia-art.conf`
2. Place SSL certificates in `nginx/certs/`
3. Uncomment the SSL sections in the Nginx configuration
4. Restart the containers

## Environment Variables

See `.env.docker.example` for all available configuration options.

## Health Checks

The application includes health check endpoints:

- `/health` - Basic health check for container monitoring
- `/api/health` - Extended health check with system information

## Scaling and Performance

For higher traffic scenarios:

- Scale the Node.js service using Docker Compose or Swarm
- Configure proper Nginx caching
- Consider using a CDN for static assets

## Monitoring

- Container logs are available via `docker compose logs`
- For production monitoring, consider integrating Prometheus and Grafana

## Backup and Restore

- Data is stored in mounted volumes
- Back up the `uploads` and `data` directories regularly
- Environment variables should be backed up separately

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check logs: `docker compose logs app`
   - Verify environment variables in `.env`

2. **Nginx returns 502 Bad Gateway**
   - Check if the Node.js app is running: `docker compose ps`
   - Check Node.js logs: `docker compose logs app`

3. **Static files not loading**
   - Verify volume mounts in docker-compose files
   - Check file permissions in containers

## Maintenance

- Update containers: `docker compose pull && docker compose up -d`
- Clean unused images: `docker image prune`
- Monitor disk space: `docker system df`
