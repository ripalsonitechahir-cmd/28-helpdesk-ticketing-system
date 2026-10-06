const STORAGE_KEY = 'helpdesk_session';

export class ApiError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const session = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  },
  set: (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  clear: () => localStorage.removeItem(STORAGE_KEY),
};

const query = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return qs.size ? `?${qs}` : '';
};

async function request(method, path, body) {
  const token = session.get()?.token;
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(res.status, data.error || 'Something went wrong', data.details);
  }
  return data;
}

export const api = {
  login: (credentials) => request('POST', '/api/auth/login', credentials),
  createTicket: (ticket) => request('POST', '/api/tickets', ticket),
  listTickets: (filters) => request('GET', `/api/tickets${query(filters)}`),
  getTicket: (id, email) => request('GET', `/api/tickets/${id}${query({ email })}`),
  updateTicket: (id, changes) => request('PATCH', `/api/tickets/${id}`, changes),
  addComment: (id, comment) => request('POST', `/api/tickets/${id}/comments`, comment),
  listAgents: () => request('GET', '/api/agents'),
  stats: () => request('GET', '/api/stats'),
};
