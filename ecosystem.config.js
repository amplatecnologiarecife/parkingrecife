// Configuracao do PM2 (mantem o servidor sempre a correr na VPS)
module.exports = {
  apps: [
    {
      name: 'parking-recife',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
