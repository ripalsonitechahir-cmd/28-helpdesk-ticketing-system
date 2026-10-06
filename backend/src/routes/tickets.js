import { Router } from 'express';
import { prisma } from '../db.js';
import { ApiError, notFound } from '../errors.js';
import { optionalAgent, requireAgent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  commentBody,
  createTicketBody,
  idParams,
  listTicketsQuery,
  updateTicketBody,
  viewerQuery,
} from '../schemas.js';

export const ticketsRouter = Router();

const withAssignee = { assignee: { select: { id: true, name: true } } };
const withThread = { ...withAssignee, comments: { orderBy: { createdAt: 'asc' } } };

// Agents may see any ticket; requesters only their own (matched by email).
// Both "missing" and "not yours" return 404 so ids can't be enumerated.
async function loadVisibleTicket(req, requesterEmail, include = withThread) {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.valid.params.id }, include });
  const isOwner = requesterEmail && requesterEmail === ticket?.requesterEmail;
  if (!ticket || !(req.agent || isOwner)) throw notFound('Ticket');
  return ticket;
}

ticketsRouter.post('/', validate({ body: createTicketBody }), async (req, res) => {
  const { email, ...data } = req.valid.body;
  const ticket = await prisma.ticket.create({ data: { ...data, requesterEmail: email } });
  res.status(201).json(ticket);
});

ticketsRouter.get('/', requireAgent, validate({ query: listTicketsQuery }), async (req, res) => {
  const { status, priority, assignee } = req.valid.query;
  const where = { status, priority, assigneeId: assignee === 'unassigned' ? null : assignee };
  res.json(
    await prisma.ticket.findMany({ where, include: withAssignee, orderBy: { createdAt: 'desc' } }),
  );
});

ticketsRouter.get(
  '/:id',
  optionalAgent,
  validate({ params: idParams, query: viewerQuery }),
  async (req, res) => res.json(await loadVisibleTicket(req, req.valid.query.email)),
);

ticketsRouter.patch(
  '/:id',
  requireAgent,
  validate({ params: idParams, body: updateTicketBody }),
  async (req, res) => {
    const { id } = req.valid.params;
    const changes = req.valid.body;
    const current = await prisma.ticket.findUnique({ where: { id } });
    if (!current) throw notFound('Ticket');

    if (
      changes.assigneeId != null &&
      !(await prisma.agent.findUnique({ where: { id: changes.assigneeId } }))
    )
      throw new ApiError(400, 'Validation failed', { assigneeId: 'Agent does not exist' });

    // resolvedAt drives the 7-day auto-close worker.
    if (changes.status && changes.status !== current.status)
      changes.resolvedAt = changes.status === 'Resolved' ? new Date() : null;

    res.json(await prisma.ticket.update({ where: { id }, data: changes, include: withThread }));
  },
);

ticketsRouter.post(
  '/:id/comments',
  optionalAgent,
  validate({ params: idParams, body: commentBody }),
  async (req, res) => {
    const { body, email } = req.valid.body;
    await loadVisibleTicket(req, email, {});

    const comment = await prisma.comment.create({
      data: {
        ticketId: req.valid.params.id,
        body,
        isAgent: Boolean(req.agent),
        author: req.agent ? req.agent.name : email,
      },
    });
    res.status(201).json(comment);
  },
);
