const svc = require('../services/labelService');
const wrap = require('../utils/wrap');

const getLabelsByBoard = wrap(async (req, res) => {
  res.json(await svc.getLabelsByBoard(req.params.boardId));
});

const createLabel = wrap(async (req, res) => {
  const result = await svc.createLabel(req.params.boardId, req.body.name, req.body.color);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
});

const attachLabel = wrap(async (req, res) => {
  const result = await svc.attachLabel(req.params.cardId, req.body.label_id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

const detachLabel = wrap(async (req, res) => {
  await svc.detachLabel(req.params.cardId, req.params.labelId);
  res.status(204).end();
});

module.exports = { getLabelsByBoard, createLabel, attachLabel, detachLabel };
