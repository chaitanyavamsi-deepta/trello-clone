const repo = require('../repositories/labelRepository');
const boardRepo = require('../repositories/boardRepository');

const getLabelsByBoard = (boardId) => repo.getLabelsByBoard(boardId);

async function createLabel(boardId, name, color) {
  const board = await boardRepo.getBoardById(boardId);
  if (!board) return { error: 'Board not found', status: 404 };
  const label = await repo.createLabel(boardId, (name || '').trim(), color);
  return { data: label };
}

async function attachLabel(cardId, labelId) {
  const ok = await repo.isLabelOnCardBoard(cardId, labelId);
  if (!ok) return { error: 'Card or label not found on this board', status: 404 };
  await repo.attachLabel(cardId, labelId);
  return { data: null };
}

const detachLabel = async (cardId, labelId) => { await repo.detachLabel(cardId, labelId); return { data: null }; };

module.exports = { getLabelsByBoard, createLabel, attachLabel, detachLabel };
