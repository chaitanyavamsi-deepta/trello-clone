// Centralised runtime configuration — all process.env access lives here.
// Other modules import from this file; they never read process.env directly.

// Normalize CORS origins: split on commas, trim whitespace, and strip any
// trailing slash. The browser's Origin header never has a trailing slash, so
// "https://app.vercel.app/" must match "https://app.vercel.app".
function parseCorsOrigin(raw) {
  if (!raw) return true; // no allowlist → reflect any origin (dev/default)
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 300,
  },
  bodyLimit: '100kb',
};

module.exports = config;
