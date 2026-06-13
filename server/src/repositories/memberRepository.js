const pool = require('../db');

async function getAllMembers() {
  const { rows } = await pool.query(
    'SELECT id, name, email, avatar_color FROM members ORDER BY id'
  );
  return rows;
}

async function cardExists(cardId) {
  const { rows } = await pool.query('SELECT 1 FROM cards WHERE id = $1', [cardId]);
  return rows.length > 0;
}

async function memberExists(memberId) {
  const { rows } = await pool.query('SELECT 1 FROM members WHERE id = $1', [memberId]);
  return rows.length > 0;
}

async function attachMember(cardId, memberId) {
  await pool.query(
    'INSERT INTO card_members (card_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [cardId, memberId]
  );
}

async function detachMember(cardId, memberId) {
  await pool.query('DELETE FROM card_members WHERE card_id = $1 AND member_id = $2', [cardId, memberId]);
}

module.exports = { getAllMembers, cardExists, memberExists, attachMember, detachMember };
