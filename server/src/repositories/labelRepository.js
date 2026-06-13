const pool = require('../db');

async function getLabelsByBoard(boardId) {
  const { rows } = await pool.query(
    'SELECT id, name, color FROM labels WHERE board_id = $1 ORDER BY id',
    [boardId]
  );
  return rows;
}

async function createLabel(boardId, name, color) {
  const { rows } = await pool.query(
    'INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [boardId, name, color]
  );
  return rows[0];
}

async function isLabelOnCardBoard(cardId, labelId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM cards c
     JOIN lists l ON l.id = c.list_id
     JOIN labels lb ON lb.board_id = l.board_id
     WHERE c.id = $1 AND lb.id = $2`,
    [cardId, labelId]
  );
  return rows.length > 0;
}

async function attachLabel(cardId, labelId) {
  await pool.query(
    'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [cardId, labelId]
  );
}

async function detachLabel(cardId, labelId) {
  await pool.query('DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2', [cardId, labelId]);
}

module.exports = { getLabelsByBoard, createLabel, isLabelOnCardBoard, attachLabel, detachLabel };
