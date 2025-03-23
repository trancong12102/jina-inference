import closeWithGrace from 'close-with-grace';
import { createApp } from './app';
import { parseEnv } from './lib/env';

// Parse env
const env = parseEnv();

// Create app instance
const app = await createApp(env);
const { log: logger } = app;

// Graceful shutdown
closeWithGrace({ logger }, async ({ err, signal }) => {
  if (err) {
    logger.error(err, 'An error occurred while closing the app');
  } else {
    logger.info({ signal }, 'Received signal, shutting down gracefully');
  }

  await app.close();
});

// wait for fastify to be ready
await app.ready();

// start listening
const { PORT } = env;
await app.listen({
  host: '0.0.0.0',
  port: PORT,
});
