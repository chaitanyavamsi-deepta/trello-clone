// Centralised runtime configuration — all process.env access lives here.
// Other modules import from this file; they never read process.env directly.

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 300,
  },
  bodyLimit: '100kb',
};

module.exports = config;
