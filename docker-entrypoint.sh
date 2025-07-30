#!/bin/sh
set -e

# Docker entrypoint script for Evgenia Art Portfolio

echo "Starting Evgenia Art Portfolio..."

# Create required directories if they don't exist
mkdir -p logs pids sessions public/data

# Disable logging to file in Docker environment
export LOG_TO_FILE=false

# Ensure proper permissions
if [ "$(id -u)" = "0" ]; then
    echo "Running as root, adjusting permissions..."
    chown -R nodejs:nodejs logs pids sessions public/data
    # Drop to nodejs user
    exec su-exec nodejs "$@"
fi

# Check if database migration is needed (if using database)
if [ -f "src/scripts/initDatabase.js" ] && [ "$RUN_DB_INIT" = "true" ]; then
    echo "Initializing database..."
    node src/scripts/initDatabase.js
fi

if [ -f "src/scripts/migrateArtworkData.js" ] && [ "$RUN_DB_MIGRATE" = "true" ]; then
    echo "Migrating artwork data..."
    node src/scripts/migrateArtworkData.js
fi

# Execute the main command
exec "$@"