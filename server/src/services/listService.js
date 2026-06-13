const pool = require('../db');
const repo = require('../repositories/listRepository');
const boardRepo = require('../repositories/boardRepository');
const { appendPosition, rebalanceIfNeeded } = require('../utils/position');

async function createList(boardId, title) {
  const board = await boardRepo.getBoardById(boardId);
  if (!board) return { error: 'Board not found', status: 404 };
  const position = await appendPosition(pool, 'lists', 'board_id', boardId);
  const list = await repo.createList(boardId, title.trim(), position);
  return { data: list };
}

async function updateList(id, title, position) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const list = await repo.updateList(client, id, title === undefined ? undefined : title.trim(), position);
    if (!list) { await client.query('ROLLBACK'); return { error: 'List not found', status: 404 }; }
    if (position !== undefined) await rebalanceIfNeeded(client, 'lists', 'board_id', list.board_id);
    await client.query('COMMIT');
    return { data: list };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteList(id) {
  const deleted = await repo.deleteList(id);
  if (!deleted) return { error: 'List not found', status: 404 };
  return { data: null };
}

module.exports = { createList, updateList, deleteList };
