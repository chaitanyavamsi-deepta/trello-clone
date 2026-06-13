const svc = require('../services/boardService');
const wrap = require('../utils/wrap');

const listBoards = wrap(async (req, res) => {
  res.json(await svc.listBoards());
});

const createBoard = wrap(async (req, res) => {
  const board = await svc.createBoard(req.body.title, req.body.background);
  res.status(201).json(board);
});

const getBoard = wrap(async (req, res) => {
  const board = await svc.getBoardWithDetails(req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

const updateBoard = wrap(async (req, res) => {
  const { title, background } = req.body;
  const result = await svc.updateBoard(req.params.id, title, background);
  if (!result) return res.status(404).json({ error: 'Board not found' });
  res.json(result);
});

const deleteBoard = wrap(async (req, res) => {
  const ok = await svc.deleteBoard(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Board not found' });
  res.status(204).end();
});

const searchCards = wrap(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) return res.json([]);
  res.json(await svc.searchCards(req.params.boardId, q));
});

module.exports = { listBoards, createBoard, getBoard, updateBoard, deleteBoard, searchCards };
