import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./test.db';
rmSync(new URL('../prisma/test.db', import.meta.url), { force: true });
execSync('npx prisma migrate deploy', { stdio: 'ignore', env: process.env });
execSync('node prisma/seed.js', { stdio: 'ignore', env: process.env });

const { app } = await import('../src/app.js');
const { prisma } = await import('../src/db.js');
const { closeStaleTickets } = await import('../src/closeStale.js');

let server, base, token;
const call = async (method, path, body, auth = false) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
};

before(async () => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
  token = (await call('POST', '/api/auth/login', { email: 'alice@helpdesk.local', password: 'Agent@123' })).json.token;
});
after(async () => {
  server.close();
  await prisma.$disconnect();
});

test('health', async () => assert.equal((await call('GET', '/health')).status, 200));

test('login rejects bad credentials and bad input', async () => {
  assert.equal((await call('POST', '/api/auth/login', { email: 'alice@helpdesk.local', password: 'x' })).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { email: 'nope' })).status, 400);
});

test('agents list requires auth', async () => {
  assert.equal((await call('GET', '/api/agents')).status, 401);
  assert.equal((await call('GET', '/api/agents', null, true)).json.length, 3);
});

test('ticket validation', async () => {
  const r = await call('POST', '/api/tickets', { subject: '', email: 'bad' });
  assert.equal(r.status, 400);
  assert.ok(r.json.details.subject && r.json.details.email && r.json.details.description);
});

test('full ticket journey', async () => {
  const created = await call('POST', '/api/tickets', { subject: 'S', description: 'D', priority: 'High', email: 'Me@Example.com' });
  assert.equal(created.status, 201);
  const id = created.json.id;

  assert.equal((await call('GET', `/api/tickets/${id}`)).status, 404, 'anonymous without email');
  assert.equal((await call('GET', `/api/tickets/${id}?email=other@example.com`)).status, 404);
  assert.equal((await call('GET', `/api/tickets/${id}?email=me@example.com`)).status, 200);

  assert.equal((await call('GET', '/api/tickets')).status, 401);
  assert.equal((await call('PATCH', `/api/tickets/${id}`, { status: 'Closed' })).status, 401);
  assert.equal((await call('PATCH', `/api/tickets/${id}`, { status: 'Bogus' }, true)).status, 400);
  assert.equal((await call('PATCH', `/api/tickets/${id}`, { assigneeId: 999 }, true)).status, 400);

  const patched = await call('PATCH', `/api/tickets/${id}`, { status: 'Resolved', assigneeId: 1 }, true);
  assert.equal(patched.json.status, 'Resolved');
  assert.equal(patched.json.assignee.id, 1);

  assert.equal((await call('POST', `/api/tickets/${id}/comments`, { body: 'hi', email: 'other@example.com' })).status, 404);
  assert.equal((await call('POST', `/api/tickets/${id}/comments`, { body: 'thanks', email: 'me@example.com' })).status, 201);
  const agentReply = await call('POST', `/api/tickets/${id}/comments`, { body: 'done' }, true);
  assert.equal(agentReply.json.isAgent, true);

  const detail = await call('GET', `/api/tickets/${id}?email=me@example.com`);
  assert.equal(detail.json.comments.length, 2);

  const filtered = await call('GET', '/api/tickets?status=Resolved&assignee=1&priority=High', null, true);
  assert.ok(filtered.json.some((t) => t.id === id));
  assert.equal((await call('GET', '/api/tickets?status=Nope', null, true)).status, 400);
  const unassigned = await call('GET', '/api/tickets?assignee=unassigned', null, true);
  assert.ok(unassigned.json.every((t) => t.assignee === null));

  const stats = await call('GET', '/api/stats', null, true);
  assert.ok(stats.json.byStatus.Resolved >= 1);
  assert.equal(Object.keys(stats.json.byStatus).length, 4);

  // auto-close worker
  assert.equal(await closeStaleTickets(), 0);
  assert.equal(await closeStaleTickets(new Date(Date.now() + 8 * 86_400_000)), 1);
  assert.equal((await call('GET', `/api/tickets/${id}?email=me@example.com`)).json.status, 'Closed');
});

test('malformed JSON and unknown routes give JSON errors', async () => {
  const res = await fetch(base + '/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
  assert.equal((await call('GET', '/api/nope')).status, 404);
});
