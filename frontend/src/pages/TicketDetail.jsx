import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Thread from '../components/Thread';
import { Alert, Badge, Field, Options, formatDate } from '../components/ui';
import { PRIORITIES, STATUSES } from '../constants';
import { useLoad } from '../hooks';

// Agent controls: each change is saved immediately via PATCH.
function AgentControls({ ticket, onSaved }) {
  const [error, setError] = useState('');
  const agents = useLoad(api.listAgents, []).data ?? [];

  const save = (field, parse = (v) => v) => async (e) => {
    setError('');
    try {
      await api.updateTicket(ticket.id, { [field]: parse(e.target.value) });
      await onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="filters">
      <Alert>{error}</Alert>
      <Field as="select" label="Status" value={ticket.status} onChange={save('status')}>
        <Options items={STATUSES} />
      </Field>
      <Field as="select" label="Priority" value={ticket.priority} onChange={save('priority')}>
        <Options items={PRIORITIES} />
      </Field>
      <Field
        as="select"
        label="Assignee"
        value={ticket.assigneeId ?? ''}
        onChange={save('assigneeId', (v) => (v === '' ? null : Number(v)))}
      >
        <option value="">Unassigned</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </Field>
    </div>
  );
}

// Used by agents (/ticket/:id) and requesters (/ticket/:id?email=...).
export default function TicketDetail() {
  const { id } = useParams();
  const email = useSearchParams()[0].get('email') ?? undefined;
  const { agent } = useAuth();
  const { data: ticket, error, loading, reload } = useLoad(() => api.getTicket(id, email), [id, email]);

  if (loading && !ticket) return <p className="muted">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="card">
      {agent && <Link to="/board">← Back to board</Link>}
      <h1>#{ticket.id} {ticket.subject}</h1>
      <p>
        <Badge value={ticket.status} /> <Badge value={ticket.priority} />{' '}
        <span className="muted">
          {ticket.assignee ? `Assigned to ${ticket.assignee.name}` : 'Unassigned'} · {ticket.requesterEmail} ·{' '}
          {formatDate(ticket.createdAt)}
        </span>
      </p>
      <p className="description">{ticket.description}</p>
      {agent && <AgentControls ticket={ticket} onSaved={reload} />}
      <Thread ticketId={ticket.id} comments={ticket.comments} email={agent ? undefined : email} onPosted={reload} />
    </div>
  );
}
