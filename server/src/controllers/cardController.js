const svc = require('../services/cardService');
const wrap = require('../utils/wrap');

const createCard = wrap(async (req, res) => {
  const result = await svc.createCard(req.params.listId, req.body.title);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
});

const getCard = wrap(async (req, res) => {
  const result = await svc.getCard(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const updateCard = wrap(async (req, res) => {
  const result = await svc.updateCard(req.params.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const deleteCard = wrap(async (req, res) => {
  const result = await svc.deleteCard(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

module.exports = { createCard, getCard, updateCard, deleteCard };
