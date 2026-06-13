require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // behind Render/Railway proxy

// Security middleware chain (security-guardrails.md)
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.bodyLimit }));
app.use('/api', rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/v1', require('./routes/boards'));
app.use('/api/v1', require('./routes/lists'));
app.use('/api/v1', require('./routes/cards'));
app.use('/api/v1', require('./routes/labels'));
app.use('/api/v1', require('./routes/members'));
app.use('/api/v1', require('./routes/checklists'));
app.use('/api/v1', require('./routes/comments'));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => console.log(`API listening on :${config.port}`));
}

module.exports = app;
