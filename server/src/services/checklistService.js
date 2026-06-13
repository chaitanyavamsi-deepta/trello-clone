const pool = require('../db');
const repo = require('../repositories/checklistRepository');
const cardRepo = require('../repositories/cardRepository');
const { appendPosition } = require('../utils/position');

async function createChecklist(cardId, title) {
  const card = await cardRepo.getCardById(cardId);
  if (!card) return { error: 'Card not found', status: 404 };
  const position = await appendPosition(pool, 'checklists', 'card_id', cardId);
  const checklist = await repo.createChecklist(cardId, title.trim(), position);
  return { data: { ...checklist, items: [] } };
}

async function deleteChecklist(id) {
  const deleted = await repo.deleteChecklist(id);
  if (!deleted) return { error: 'Checklist not found', status: 404 };
  return { data: null };
}

async function createChecklistItem(checklistId, content) {
  const exists = await repo.checklistExists(checklistId);
  if (!exists) return { error: 'Checklist not found', status: 404 };
  const position = await appendPosition(pool, 'checklist_items', 'checklist_id', checklistId);
  const item = await repo.createChecklistItem(checklistId, content.trim(), position);
  return { data: item };
}

async function updateChecklistItem(id, content, is_complete) {
  const item = await repo.updateChecklistItem(id, content, is_complete);
  if (!item) return { error: 'Checklist item not found', status: 404 };
  return { data: item };
}

async function deleteChecklistItem(id) {
  const deleted = await repo.deleteChecklistItem(id);
  if (!deleted) return { error: 'Checklist item not found', status: 404 };
  return { data: null };
}

module.exports = { createChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem };
