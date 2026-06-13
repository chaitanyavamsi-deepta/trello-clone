const svc = require('../services/listService');
const wrap = require('../utils/wrap');

const createList = wrap(async (req, res) => {
  const result = await svc.createList(req.params.boardId, req.body.title);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
});

const updateList = wrap(async (req, res) => {
  const { title, position } = req.body;
  const result = await svc.updateList(req.params.id, title, position);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const deleteList = wrap(async (req, res) => {
  const result = await svc.deleteList(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

module.exports = { createList, updateList, deleteList };
