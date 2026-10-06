import { z } from 'zod';
import { PRIORITIES, STATUSES } from './constants.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const text = (label, max) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);
const id = z.coerce.number().int().positive();

export const idParams = z.object({ id });
export const viewerQuery = z.object({ email: email.optional() });

export const createTicketBody = z.object({
  subject: text('Subject', 150),
  description: text('Description', 5000),
  priority: z.enum(PRIORITIES).default('Medium'),
  email,
});

export const listTicketsQuery = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  // agent id, or "unassigned"
  assignee: z.union([z.literal('unassigned'), id]).optional(),
});

export const updateTicketBody = z
  .object({
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    assigneeId: id.nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const commentBody = z.object({ body: text('Comment', 5000), email: email.optional() });

export const loginBody = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});
