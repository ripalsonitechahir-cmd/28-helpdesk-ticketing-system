// Structured (JSON) logs to stdout.
const write = (level, msg, extra = {}) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), level, msg, ...extra }));

export const logger = {
  info: (msg, extra) => write('info', msg, extra),
  warn: (msg, extra) => write('warn', msg, extra),
  error: (msg, extra) => write('error', msg, extra),
};
