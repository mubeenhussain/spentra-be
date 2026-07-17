const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');

async function start() {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port} (${config.nodeEnv})`);
    console.log(`[server] CORS origin: ${config.clientUrl}`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received — shutting down`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('[server] Closed cleanly');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
