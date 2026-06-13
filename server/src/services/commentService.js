const repo = require('../repositories/commentRepository');
const cardRepo = require('../repositories/cardRepository');
const { DEFAULT_USER_ID } = require('../constants');

async function addComment(cardId, body, memberId) {
  const card = await cardRepo.getCardById(cardId);
  if (!card) return { error: 'Card not found', status: 404 };
  // No auth: attribute to the assumed logged-in user unless a member is given.
  const comment = await repo.createComment(cardId, memberId ?? DEFAULT_USER_ID, body.trim());
  return { data: comment };
}

async function deleteComment(id) {
  const deleted = await repo.deleteComment(id);
  if (!deleted) return { error: 'Comment not found', status: 404 };
  return { data: null };
}

module.exports = { addComment, deleteComment };
