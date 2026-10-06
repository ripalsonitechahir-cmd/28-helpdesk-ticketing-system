const env = process.env;

export const config = {
  port: Number(env.PORT) || 4000,
  jwtSecret: env.JWT_SECRET || 'dev-only-secret',
  jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
  autoCloseDays: Number(env.AUTO_CLOSE_DAYS) || 7,
  autoCloseIntervalMs: (Number(env.AUTO_CLOSE_INTERVAL_MINUTES) || 60) * 60_000,
};

// Called by the API process only (the worker doesn't use JWT).
export function assertProductionConfig() {
  if (env.NODE_ENV === 'production' && config.jwtSecret === 'dev-only-secret')
    throw new Error('JWT_SECRET must be set in production');
}
