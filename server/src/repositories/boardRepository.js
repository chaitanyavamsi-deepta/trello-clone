const pool = require('../db');

async function listBoards() {
  const { rows } = await pool.query('SELECT * FROM boards ORDER BY created_at');
  return rows;
}

async function createBoard(title, background) {
  const { rows } = await pool.query(
    "INSERT INTO boards (title, background) VALUES ($1, COALESCE($2, 'gradient-purple')) RETURNING *",
    [title, background ?? null]
  );
  return rows[0];
}

async function getBoardById(id) {
  const { rows } = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getBoardWithDetails(id) {
  const board = await getBoardById(id);
  if (!board) return null;

  const [lists, cards, labels, members] = await Promise.all([
    pool.query('SELECT * FROM lists WHERE board_id = $1 ORDER BY position, id', [id]),
    pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.position,
              COALESCE(cl.label_ids, '{}') AS label_ids,
              COALESCE(cm.member_ids, '{}') AS member_ids,
              COALESCE(ck.total, 0)::int AS checklist_total,
              COALESCE(ck.done, 0)::int AS checklist_done
       FROM cards c
       JOIN lists l ON l.id = c.list_id
       LEFT JOIN (SELECT card_id, array_agg(label_id ORDER BY label_id) AS label_ids
                  FROM card_labels GROUP BY card_id) cl ON cl.card_id = c.id
       LEFT JOIN (SELECT card_id, array_agg(member_id ORDER BY member_id) AS member_ids
                  FROM card_members GROUP BY card_id) cm ON cm.card_id = c.id
       LEFT JOIN (SELECT ch.card_id, COUNT(ci.id) AS total,
                         COUNT(*) FILTER (WHERE ci.is_complete) AS done
                  FROM checklists ch
                  LEFT JOIN checklist_items ci ON ci.checklist_id = ch.id
                  GROUP BY ch.card_id) ck ON ck.card_id = c.id
       WHERE l.board_id = $1 AND NOT c.is_archived
       ORDER BY c.position, c.id`,
      [id]
    ),
    pool.query('SELECT id, name, color FROM labels WHERE board_id = $1 ORDER BY id', [id]),
    pool.query('SELECT id, name, email, avatar_color FROM members ORDER BY id'),
  ]);

  const cardsByList = new Map();
  for (const card of cards.rows) {
    if (!cardsByList.has(card.list_id)) cardsByList.set(card.list_id, []);
    cardsByList.get(card.list_id).push(card);
  }

  return {
    ...board,
    lists: lists.rows.map((list) => ({ ...list, cards: cardsByList.get(list.id) || [] })),
    labels: labels.rows,
    members: members.rows,
  };
}

async function updateBoard(id, title, background) {
  const { rows } = await pool.query(
    `UPDATE boards SET title = COALESCE($1, title), background = COALESCE($2, background)
     WHERE id = $3 RETURNING *`,
    [title === undefined ? null : title, background ?? null, id]
  );
  return rows[0] || null;
}

async function deleteBoard(id) {
  const { rowCount } = await pool.query('DELETE FROM boards WHERE id = $1', [id]);
  return rowCount > 0;
}

async function searchCards(boardId, q) {
  const { rows } = await pool.query(
    `SELECT c.id, c.list_id, c.title, l.title AS list_title, b.title AS board_title
     FROM cards c
     JOIN lists l ON l.id = c.list_id
     JOIN boards b ON b.id = l.board_id
     WHERE l.board_id = $1 AND NOT c.is_archived AND c.title ILIKE '%' || $2 || '%'
     ORDER BY c.position, c.id
     LIMIT 10`,
    [boardId, q]
  );
  return rows;
}

module.exports = { listBoards, createBoard, getBoardById, getBoardWithDetails, updateBoard, deleteBoard, searchCards };
