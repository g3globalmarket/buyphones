/**
 * PM2 Ecosystem Configuration for BuyPhones Backend
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart buyphones-backend
 *   pm2 stop buyphones-backend
 *   pm2 logs buyphones-backend
 *   pm2 delete buyphones-backend
 *
 * To save PM2 process list and enable auto-restart on server reboot:
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'buyphones-backend',
      script: './dist/main.js',
      cwd: __dirname,
      instances: 1, // For production, you can increase this for clustering
      exec_mode: 'fork', // Use 'cluster' mode if instances > 1
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-restart settings
      autorestart: true,
      watch: false, // Set to true only for development
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      // Advanced settings
      min_uptime: '10s', // Minimum uptime before considering app stable
      max_restarts: 10, // Maximum restarts in 1 minute
      restart_delay: 4000, // Delay between restarts (ms)
    },
  ],
};
