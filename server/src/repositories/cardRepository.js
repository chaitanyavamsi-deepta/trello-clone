const pool = require('../db');

async function createCard(listId, title, position) {
  const { rows } = await pool.query(
    'INSERT INTO cards (list_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [listId, title, position]
  );
  return rows[0];
}

async function getCardById(id) {
  const { rows } = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getCardWithDetails(id) {
  const card = await getCardById(id);
  if (!card) return null;

  const [labels, members, checklists, comments] = await Promise.all([
    pool.query('SELECT label_id FROM card_labels WHERE card_id = $1 ORDER BY label_id', [id]),
    pool.query('SELECT member_id FROM card_members WHERE card_id = $1 ORDER BY member_id', [id]),
    pool.query(
      `SELECT ch.id, ch.title, ch.position,
              COALESCE(json_agg(json_build_object(
                'id', ci.id, 'content', ci.content, 'is_complete', ci.is_complete
              ) ORDER BY ci.position, ci.id) FILTER (WHERE ci.id IS NOT NULL), '[]') AS items
       FROM checklists ch
       LEFT JOIN checklist_items ci ON ci.checklist_id = ch.id
       WHERE ch.card_id = $1
       GROUP BY ch.id
       ORDER BY ch.position, ch.id`,
      [id]
    ),
    pool.query(
      `SELECT c.id, c.member_id, c.body, c.created_at,
              m.name AS member_name, m.avatar_color AS member_color
       FROM card_comments c JOIN members m ON m.id = c.member_id
       WHERE c.card_id = $1
       ORDER BY c.created_at DESC, c.id DESC`,
      [id]
    ),
  ]);

  return {
    ...card,
    label_ids: labels.rows.map((r) => r.label_id),
    member_ids: members.rows.map((r) => r.member_id),
    checklists: checklists.rows,
    comments: comments.rows,
  };
}

async function lockCard(client, id) {
  const { rows } = await client.query('SELECT * FROM cards WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] || null;
}

async function isSameBoard(client, listId1, listId2) {
  const { rows } = await client.query(
    `SELECT 1 FROM lists src, lists dst
     WHERE src.id = $1 AND dst.id = $2 AND src.board_id = dst.board_id`,
    [listId1, listId2]
  );
  return rows.length > 0;
}

async function updateCard(client, id, fields) {
  const { title, description, due_date, due_date_set, list_id, position, is_archived } = fields;
  const { rows } = await client.query(
    `UPDATE cards SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       due_date    = CASE WHEN $3 THEN $4::timestamptz ELSE due_date END,
       list_id     = $5,
       position    = COALESCE($6, position),
       is_archived = COALESCE($7, is_archived),
       updated_at  = now()
     WHERE id = $8 RETURNING *`,
    [
      title === undefined ? null : title,
      description ?? null,
      due_date_set,
      due_date ?? null,
      list_id,
      position ?? null,
      is_archived ?? null,
      id,
    ]
  );
  return rows[0] || null;
}

async function deleteCard(id) {
  const { rowCount } = await pool.query('DELETE FROM cards WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { createCard, getCardById, getCardWithDetails, lockCard, isSameBoard, updateCard, deleteCard };
