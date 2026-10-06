// Stretch goal: separate process that periodically auto-closes stale Resolved tickets.
import { config } from './config.js';
import { closeStaleTickets } from './closeStale.js';
import { logger } from './logger.js';

const run = () =>
  closeStaleTickets().catch((e) => logger.error('worker failed', { error: e.message }));

logger.info('worker started', { days: config.autoCloseDays });
run();
setInterval(run, config.autoCloseIntervalMs);
