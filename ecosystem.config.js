module.exports = {
  apps: [
    {
      name: 'online-shop-backend',
      script: 'backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        JWT_SECRET: '8d3f9a2e7c1b5g6h4j8k9l0p2q3r5s7t9u1v2w3x4y5z6',
        DB_HOST: 'localhost',   // ← ✅ تغییر از 127.0.0.1 به localhost
        DB_USER: 'root',
        DB_PASSWORD: '123456',
        DB_NAME: 'shop_db',
        DB_PORT: 3306,
        BASE_URL: 'https://aasgari.ir',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
  ],
};