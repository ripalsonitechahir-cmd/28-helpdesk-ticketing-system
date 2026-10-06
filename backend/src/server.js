import { app } from './app.js';
import { assertProductionConfig, config } from './config.js';
import { prisma } from './db.js';
import { logger } from './logger.js';

assertProductionConfig();

const server = app.listen(config.port, () => logger.info('api listening', { port: config.port }));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info('shutting down', { signal });
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
