module.exports = {
  apps: [
    {
      name: 'evgenia-art',
      script: 'server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Restart configuration
      watch: false,
      max_memory_restart: '1G',

      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Auto-restart on file changes (development only)
      ignore_watch: ['node_modules', 'logs', 'sessions', 'public/dist', '.git'],

      // Environment variables
      env_file: '.env',

      // Graceful shutdown
      kill_timeout: 5000,

      // Process management
      pid_file: './pids/evgenia-art.pid',

      // Cron restart (optional - restart daily at 2 AM)
      cron_restart: '0 2 * * *',

      // Merge logs
      merge_logs: true,

      // Time zone
      time: true,
    },
  ],
};
