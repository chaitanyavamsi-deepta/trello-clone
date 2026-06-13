const svc = require('../services/commentService');
const wrap = require('../utils/wrap');

const addComment = wrap(async (req, res) => {
  const result = await svc.addComment(req.params.cardId, req.body.body, req.body.member_id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.data);
});

const deleteComment = wrap(async (req, res) => {
  const result = await svc.deleteComment(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(204).end();
});

module.exports = { addComment, deleteComment };
