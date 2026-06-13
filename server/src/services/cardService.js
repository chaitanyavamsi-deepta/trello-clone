const pool = require('../db');
const repo = require('../repositories/cardRepository');
const listRepo = require('../repositories/listRepository');
const { appendPosition, rebalanceIfNeeded } = require('../utils/position');

async function createCard(listId, title) {
  const listExists = (await pool.query('SELECT id FROM lists WHERE id = $1', [listId])).rows[0];
  if (!listExists) return { error: 'List not found', status: 404 };
  const position = await appendPosition(pool, 'cards', 'list_id', listId);
  const card = await repo.createCard(listId, title.trim(), position);
  return { data: card };
}

async function getCard(id) {
  const card = await repo.getCardWithDetails(id);
  if (!card) return { error: 'Card not found', status: 404 };
  return { data: card };
}

async function updateCard(id, patch) {
  const { title, description, due_date, list_id, position, is_archived } = patch;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const card = await repo.lockCard(client, id);
    if (!card) { await client.query('ROLLBACK'); return { error: 'Card not found', status: 404 }; }

    let targetListId = card.list_id;
    if (list_id !== undefined && list_id !== card.list_id) {
      const same = await repo.isSameBoard(client, card.list_id, list_id);
      if (!same) { await client.query('ROLLBACK'); return { error: 'Target list not found on this board', status: 404 }; }
      targetListId = list_id;
    }

    let targetPosition = position;
    if (targetListId !== card.list_id && targetPosition === undefined) {
      targetPosition = await appendPosition(client, 'cards', 'list_id', targetListId);
    }

    const updated = await repo.updateCard(client, id, {
      title: title === undefined ? undefined : title.trim(),
      description,
      due_date,
      due_date_set: due_date !== undefined,
      list_id: targetListId,
      position: targetPosition,
      is_archived,
    });

    if (targetPosition !== undefined) await rebalanceIfNeeded(client, 'cards', 'list_id', targetListId);
    await client.query('COMMIT');
    return { data: updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteCard(id) {
  const deleted = await repo.deleteCard(id);
  if (!deleted) return { error: 'Card not found', status: 404 };
  return { data: null };
}

module.exports = { createCard, getCard, updateCard, deleteCard };
