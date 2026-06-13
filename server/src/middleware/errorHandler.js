// Central error handler (LLD §3.3): generic message in production, details to
// server logs only — no stack traces leak to clients.

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';
  res.status(status).json({ error: message });
};
