const svc = require('../services/checklistService');
const wrap = require('../utils/wrap');

const createChecklist = wrap(async (req, res) => {
  const result = await svc.createChecklist(req.params.cardId, req.body.title);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
});

const deleteChecklist = wrap(async (req, res) => {
  const result = await svc.deleteChecklist(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

const createChecklistItem = wrap(async (req, res) => {
  const result = await svc.createChecklistItem(req.params.checklistId, req.body.content);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
});

const updateChecklistItem = wrap(async (req, res) => {
  const { content, is_complete } = req.body;
  const result = await svc.updateChecklistItem(req.params.id, content, is_complete);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const deleteChecklistItem = wrap(async (req, res) => {
  const result = await svc.deleteChecklistItem(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

module.exports = { createChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem };
