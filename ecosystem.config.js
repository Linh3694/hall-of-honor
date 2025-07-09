module.exports = {
  apps: [
    {
      name: 'hall-of-honor',
      script: 'npm',
      args: 'run preview -- --port 5000',
      cwd: '/srv/app/hall-of-honor',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/hall-of-honor/err.log',
      out_file: '/var/log/hall-of-honor/out.log',
      log_file: '/var/log/hall-of-honor/combined.log',
      time: true
    }
  ]
}; 