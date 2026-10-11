const env = require('./config/env');
const app = require('./app');
const { connectDatabase } = require('./config/database');

async function start() {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('[server] Failed to connect to MongoDB:', err.message);
    console.error('[server] Check your MONGODB_URI and network access rules, then restart.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[server] The Creative Studio API is running on http://localhost:${env.port}`);
    console.log(`[server] Environment: ${env.nodeEnv}`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();