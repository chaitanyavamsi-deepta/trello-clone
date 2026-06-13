const pool = require('../db');

// Comments joined with their author's display fields, newest first.
async function listByCard(cardId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.card_id, c.member_id, c.body, c.created_at,
            m.name AS member_name, m.avatar_color AS member_color
     FROM card_comments c
     JOIN members m ON m.id = c.member_id
     WHERE c.card_id = $1
     ORDER BY c.created_at DESC, c.id DESC`,
    [cardId]
  );
  return rows;
}

async function createComment(cardId, memberId, body) {
  const { rows } = await pool.query(
    `WITH inserted AS (
       INSERT INTO card_comments (card_id, member_id, body)
       VALUES ($1, $2, $3) RETURNING *
     )
     SELECT i.id, i.card_id, i.member_id, i.body, i.created_at,
            m.name AS member_name, m.avatar_color AS member_color
     FROM inserted i JOIN members m ON m.id = i.member_id`,
    [cardId, memberId, body]
  );
  return rows[0];
}

async function deleteComment(id) {
  const { rowCount } = await pool.query('DELETE FROM card_comments WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listByCard, createComment, deleteComment };
