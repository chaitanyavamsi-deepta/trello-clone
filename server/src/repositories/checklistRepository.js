const pool = require('../db');

async function createChecklist(cardId, title, position) {
  const { rows } = await pool.query(
    'INSERT INTO checklists (card_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [cardId, title, position]
  );
  return rows[0];
}

async function deleteChecklist(id) {
  const { rowCount } = await pool.query('DELETE FROM checklists WHERE id = $1', [id]);
  return rowCount > 0;
}

async function createChecklistItem(checklistId, content, position) {
  const { rows } = await pool.query(
    'INSERT INTO checklist_items (checklist_id, content, position) VALUES ($1, $2, $3) RETURNING *',
    [checklistId, content, position]
  );
  return rows[0];
}

async function updateChecklistItem(id, content, is_complete) {
  const { rows } = await pool.query(
    `UPDATE checklist_items SET
       content = COALESCE($1, content),
       is_complete = COALESCE($2, is_complete)
     WHERE id = $3 RETURNING *`,
    [content === undefined ? null : content, is_complete ?? null, id]
  );
  return rows[0] || null;
}

async function deleteChecklistItem(id) {
  const { rowCount } = await pool.query('DELETE FROM checklist_items WHERE id = $1', [id]);
  return rowCount > 0;
}

async function checklistExists(id) {
  const { rows } = await pool.query('SELECT 1 FROM checklists WHERE id = $1', [id]);
  return rows.length > 0;
}

module.exports = { createChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem, checklistExists };
