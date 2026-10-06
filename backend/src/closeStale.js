import { config } from './config.js';
import { prisma } from './db.js';
import { logger } from './logger.js';

// Closes tickets that have been Resolved for AUTO_CLOSE_DAYS or more.
export async function closeStaleTickets(now = new Date()) {
  const cutoff = new Date(now.getTime() - config.autoCloseDays * 86_400_000);
  const { count } = await prisma.ticket.updateMany({
    where: { status: 'Resolved', resolvedAt: { lte: cutoff } },
    data: { status: 'Closed' },
  });
  if (count) logger.info('auto-closed tickets', { count });
  return count;
}
