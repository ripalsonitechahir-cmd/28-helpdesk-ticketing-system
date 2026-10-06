import cors from 'cors';
import express from 'express';
import { prisma } from './db.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { agentsRouter } from './routes/agents.js';
import { authRouter } from './routes/auth.js';
import { statsRouter } from './routes/stats.js';
import { ticketsRouter } from './routes/tickets.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () =>
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
    }),
  );
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('health check failed', { error: err.message });
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/stats', statsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
