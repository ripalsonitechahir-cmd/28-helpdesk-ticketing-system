import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const password = process.env.SEED_AGENT_PASSWORD || 'Agent@123';

const agents = [
  { name: 'Alice Admin', email: 'alice@helpdesk.local' },
  { name: 'Bob Support', email: 'bob@helpdesk.local' },
  { name: 'Carol Care', email: 'carol@helpdesk.local' },
];

const passwordHash = await bcrypt.hash(password, 10);
for (const a of agents)
  await prisma.agent.upsert({ where: { email: a.email }, update: {}, create: { ...a, passwordHash } });

// Demo tickets only on an empty database.
if ((await prisma.ticket.count()) === 0) {
  const bob = await prisma.agent.findUnique({ where: { email: 'bob@helpdesk.local' } });
  await prisma.ticket.createMany({
    data: [
      { subject: 'Cannot log in to VPN', description: 'VPN client says certificate expired.', priority: 'High', requesterEmail: 'user1@example.com' },
      { subject: 'Request new monitor', description: 'Need a second monitor for my desk.', priority: 'Low', requesterEmail: 'user2@example.com' },
      { subject: 'Email not syncing on phone', description: 'Outlook mobile stopped syncing since Monday.', priority: 'Medium', requesterEmail: 'user3@example.com', status: 'In Progress', assigneeId: bob.id },
    ],
  });
}
await prisma.$disconnect();
