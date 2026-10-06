import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAgent } from '../middleware/auth.js';

export const agentsRouter = Router();

// Used by the UI to populate assignee pickers. Never exposes password hashes.
agentsRouter.get('/', requireAgent, async (_req, res) =>
  res.json(await prisma.agent.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })),
);
