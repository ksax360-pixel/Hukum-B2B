/**
 * PM2: Kingdom Trade (Next.js) → https://kingdomtrade.x-360.ai
 *
 *   npm install && npm run build
 *   pm2 start ecosystem.config.cjs --env production && pm2 save
 */
module.exports = {
  apps: [
    {
      name: "kingdomtrade-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3050",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      time: true,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
