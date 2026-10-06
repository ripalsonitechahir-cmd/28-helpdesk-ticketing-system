import { logger } from '../logger.js';

export const notFoundHandler = (_req, res) => res.status(404).json({ error: 'Route not found' });

// Single place that turns every failure into a JSON response (no raw 500 traces).
export function errorHandler(err, req, res, _next) {
  if (err.status) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  logger.error('unhandled error', { path: req.path, error: err.message });
  res.status(500).json({ error: 'Internal server error' });
}
