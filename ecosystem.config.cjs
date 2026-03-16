module.exports = {
  apps: [
    {
      name: 'phsweb-api',
      script: './dist/index.js',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'phsweb-whatsapp',
      script: './index.js',
      cwd: './whatsapp-sidecar',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
