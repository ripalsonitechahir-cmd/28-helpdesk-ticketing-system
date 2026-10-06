import { Router } from 'express';
import { prisma } from '../db.js';
import { STATUSES } from '../constants.js';
import { requireAgent } from '../middleware/auth.js';

export const statsRouter = Router();

statsRouter.get('/', requireAgent, async (_req, res) => {
  const groups = await prisma.ticket.groupBy({ by: ['status'], _count: { _all: true } });
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const g of groups) byStatus[g.status] = g._count._all;
  res.json({ total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus });
});
