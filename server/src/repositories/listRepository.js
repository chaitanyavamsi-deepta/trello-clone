const pool = require('../db');

async function createList(boardId, title, position) {
  const { rows } = await pool.query(
    'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [boardId, title, position]
  );
  return rows[0];
}

async function updateList(client, id, title, position) {
  const { rows } = await client.query(
    `UPDATE lists SET title = COALESCE($1, title), position = COALESCE($2, position)
     WHERE id = $3 RETURNING *`,
    [title === undefined ? null : title, position ?? null, id]
  );
  return rows[0] || null;
}

async function deleteList(id) {
  const { rowCount } = await pool.query('DELETE FROM lists WHERE id = $1', [id]);
  return rowCount > 0;
}

async function findBoardOfList(id) {
  const { rows } = await pool.query('SELECT board_id FROM lists WHERE id = $1', [id]);
  return rows[0]?.board_id ?? null;
}

module.exports = { createList, updateList, deleteList, findBoardOfList };
