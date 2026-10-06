import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Alert, Badge, Field, Options, formatDate } from '../components/ui';
import { PRIORITIES, STATUSES } from '../constants';
import { useLoad } from '../hooks';

const noFilters = { status: '', priority: '', assignee: '' };

export default function Board() {
  const { agent } = useAuth();
  const [filters, setFilters] = useState(noFilters);
  const stats = useLoad(api.stats, []);
  const agents = useLoad(api.listAgents, []).data ?? [];
  const tickets = useLoad(() => api.listTickets(filters), [filters]);

  const filterProps = (name) => ({
    name,
    value: filters[name],
    onChange: (e) => setFilters((f) => ({ ...f, [name]: e.target.value })),
  });

  return (
    <>
      <h1>Ticket board</h1>
      <Alert>{stats.error}</Alert>
      <div className="stats">
        {STATUSES.map((s) => (
          <button key={s} className="stat" onClick={() => setFilters((f) => ({ ...f, status: s }))}>
            <strong>{stats.data?.byStatus[s] ?? '–'}</strong>
            <span>{s}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <Field as="select" label="Status" {...filterProps('status')}>
          <Options items={STATUSES} blank="All" />
        </Field>
        <Field as="select" label="Priority" {...filterProps('priority')}>
          <Options items={PRIORITIES} blank="All" />
        </Field>
        <Field as="select" label="Assignee" {...filterProps('assignee')}>
          <option value="">All</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.id === agent.id ? `Me (${a.name})` : a.name}</option>
          ))}
        </Field>
        <button className="btn secondary" onClick={() => setFilters(noFilters)}>Clear</button>
      </div>

      <Alert>{tickets.error}</Alert>
      {tickets.loading && <p className="muted">Loading…</p>}
      {tickets.data?.length === 0 && <p className="muted">No tickets match these filters.</p>}
      {tickets.data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Subject</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Created</th></tr>
            </thead>
            <tbody>
              {tickets.data.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td><Link to={`/ticket/${t.id}`}>{t.subject}</Link></td>
                  <td><Badge value={t.status} /></td>
                  <td><Badge value={t.priority} /></td>
                  <td>{t.assignee?.name ?? <span className="muted">Unassigned</span>}</td>
                  <td>{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
