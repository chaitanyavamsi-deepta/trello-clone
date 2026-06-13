// Thin fetch wrapper + one function per endpoint (docs/api-documentation.md).
const BASE = import.meta.env.VITE_API_URL || '';

async function http(method, path, body) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      message = (await res.json()).error || message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listMembers: () => http('GET', '/members'),
  listBoards: () => http('GET', '/boards'),
  createBoard: (title) => http('POST', '/boards', { title }),
  getBoard: (id) => http('GET', `/boards/${id}`),
  updateBoard: (id, patch) => http('PUT', `/boards/${id}`, patch),
  deleteBoard: (id) => http('DELETE', `/boards/${id}`),
  searchCards: (boardId, q) =>
    http('GET', `/boards/${boardId}/cards/search?q=${encodeURIComponent(q)}`),

  createList: (boardId, title) => http('POST', `/boards/${boardId}/lists`, { title }),
  updateList: (id, patch) => http('PUT', `/lists/${id}`, patch),
  deleteList: (id) => http('DELETE', `/lists/${id}`),

  createCard: (listId, title) => http('POST', `/lists/${listId}/cards`, { title }),
  getCard: (id) => http('GET', `/cards/${id}`),
  updateCard: (id, patch) => http('PUT', `/cards/${id}`, patch),
  deleteCard: (id) => http('DELETE', `/cards/${id}`),

  createLabel: (boardId, name, color) => http('POST', `/boards/${boardId}/labels`, { name, color }),
  addCardLabel: (cardId, labelId) => http('POST', `/cards/${cardId}/labels`, { label_id: labelId }),
  removeCardLabel: (cardId, labelId) => http('DELETE', `/cards/${cardId}/labels/${labelId}`),

  addCardMember: (cardId, memberId) =>
    http('POST', `/cards/${cardId}/members`, { member_id: memberId }),
  removeCardMember: (cardId, memberId) => http('DELETE', `/cards/${cardId}/members/${memberId}`),

  createChecklist: (cardId, title) => http('POST', `/cards/${cardId}/checklists`, { title }),
  deleteChecklist: (id) => http('DELETE', `/checklists/${id}`),
  createChecklistItem: (checklistId, content) =>
    http('POST', `/checklists/${checklistId}/items`, { content }),
  updateChecklistItem: (id, patch) => http('PUT', `/checklist-items/${id}`, patch),
  deleteChecklistItem: (id) => http('DELETE', `/checklist-items/${id}`),

  addComment: (cardId, body) => http('POST', `/cards/${cardId}/comments`, { body }),
  deleteComment: (id) => http('DELETE', `/comments/${id}`),
};
