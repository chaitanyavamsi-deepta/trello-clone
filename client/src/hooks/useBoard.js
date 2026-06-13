// Canonical board state + optimistic mutations with snapshot rollback
// (LLD §4.1, ADR-004). `boardRef` mirrors state so mutations always read the
// latest tree and can restore it if the API call fails.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { positionAt } from '../utils/position';

/* ---------- pure state transforms (module scope: no hook dependencies) ---------- */

const withLists = (b, lists) => ({ ...b, lists });

const patchCard = (b, cardId, patch) =>
  withLists(
    b,
    b.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
    }))
  );

const removeCard = (b, cardId) =>
  withLists(
    b,
    b.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) }))
  );

const moveCardTo = (b, cardId, toListId, toIndex) => {
  const lists = b.lists.map((l) => ({ ...l, cards: [...l.cards] }));
  const from = lists.find((l) => l.cards.some((c) => c.id === cardId));
  if (!from) return b;
  const card = from.cards.find((c) => c.id === cardId);
  from.cards = from.cards.filter((c) => c.id !== cardId);
  const to = lists.find((l) => l.id === toListId);
  if (!to) return b;
  const index = Math.max(0, Math.min(toIndex, to.cards.length));
  to.cards.splice(index, 0, { ...card, list_id: toListId });
  return withLists(b, lists);
};

function findCard(board, cardId) {
  for (const list of board.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}

export function useBoard(boardId) {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const boardRef = useRef(null);
  const toastTimer = useRef(null);

  const apply = useCallback((next) => {
    boardRef.current = next;
    setBoard(next);
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      apply(await api.getBoard(boardId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [boardId, apply]);

  useEffect(() => {
    load();
    return () => clearTimeout(toastTimer.current);
  }, [load]);

  // Optimistic mutation: apply locally, persist, roll back to snapshot on failure.
  const mutate = useCallback(
    async (updater, persist, { snapshot } = {}) => {
      const before = snapshot || boardRef.current;
      apply(updater(boardRef.current));
      try {
        await persist();
      } catch (err) {
        apply(before);
        showToast(err.message);
      }
    },
    [apply, showToast]
  );

  /* ---------- actions ---------- */

  const findListOfCard = useCallback((cardId) => {
    return boardRef.current?.lists.find((l) => l.cards.some((c) => c.id === cardId)) || null;
  }, []);

  const addList = useCallback(
    async (title) => {
      try {
        const list = await api.createList(boardId, title);
        apply(withLists(boardRef.current, [...boardRef.current.lists, { ...list, cards: [] }]));
      } catch (err) {
        showToast(err.message);
      }
    },
    [boardId, apply, showToast]
  );

  const renameList = useCallback(
    (listId, title) =>
      mutate(
        (b) => withLists(b, b.lists.map((l) => (l.id === listId ? { ...l, title } : l))),
        () => api.updateList(listId, { title })
      ),
    [mutate]
  );

  const deleteList = useCallback(
    (listId) =>
      mutate(
        (b) => withLists(b, b.lists.filter((l) => l.id !== listId)),
        () => api.deleteList(listId)
      ),
    [mutate]
  );

  // Reorder a list to `toIndex`; position = midpoint of new neighbors.
  const moveList = useCallback(
    (listId, toIndex, snapshot) => {
      const lists = boardRef.current.lists;
      const fromIndex = lists.findIndex((l) => l.id === listId);
      if (fromIndex === -1 || fromIndex === toIndex) return;
      const without = lists.filter((l) => l.id !== listId);
      const position = positionAt(without, toIndex);
      const reordered = [...without];
      reordered.splice(toIndex, 0, { ...lists[fromIndex], position });
      return mutate(
        (b) => withLists(b, reordered),
        () => api.updateList(listId, { position }),
        { snapshot }
      );
    },
    [mutate]
  );

  const addCard = useCallback(
    async (listId, title) => {
      try {
        const card = await api.createCard(listId, title);
        const newCard = { ...card, label_ids: [], member_ids: [], checklist_total: 0, checklist_done: 0 };
        apply(
          withLists(
            boardRef.current,
            boardRef.current.lists.map((l) =>
              l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
            )
          )
        );
      } catch (err) {
        showToast(err.message);
      }
    },
    [apply, showToast]
  );

  // Live preview while dragging across lists — local state only, no API call.
  const moveCardLocal = useCallback(
    (cardId, toListId, toIndex) => apply(moveCardTo(boardRef.current, cardId, toListId, toIndex)),
    [apply]
  );

  // Finalize a drag: card already sits in its target list locally; reposition
  // it at `toIndex` and persist {list_id, position}. Rolls back to the
  // pre-drag snapshot on failure.
  const commitCardMove = useCallback(
    (cardId, toIndex, snapshot) => {
      const list = findListOfCard(cardId);
      if (!list) return;
      const without = list.cards.filter((c) => c.id !== cardId);
      const index = Math.max(0, Math.min(toIndex, without.length));
      const position = positionAt(without, index);
      return mutate(
        (b) => patchCard(moveCardTo(b, cardId, list.id, index), cardId, { position }),
        () => api.updateCard(cardId, { list_id: list.id, position }),
        { snapshot }
      );
    },
    [mutate, findListOfCard]
  );

  const updateCard = useCallback(
    (cardId, patch) =>
      mutate(
        (b) => patchCard(b, cardId, patch),
        () => api.updateCard(cardId, patch)
      ),
    [mutate]
  );

  const archiveCard = useCallback(
    (cardId) =>
      mutate(
        (b) => removeCard(b, cardId),
        () => api.updateCard(cardId, { is_archived: true })
      ),
    [mutate]
  );

  const deleteCard = useCallback(
    (cardId) =>
      mutate(
        (b) => removeCard(b, cardId),
        () => api.deleteCard(cardId)
      ),
    [mutate]
  );

  const toggleCardLabel = useCallback(
    (cardId, labelId, on) =>
      mutate(
        (b) =>
          patchCard(b, cardId, {
            label_ids: on
              ? [...new Set([...(findCard(b, cardId)?.label_ids || []), labelId])]
              : (findCard(b, cardId)?.label_ids || []).filter((id) => id !== labelId),
          }),
        () => (on ? api.addCardLabel(cardId, labelId) : api.removeCardLabel(cardId, labelId))
      ),
    [mutate]
  );

  const toggleCardMember = useCallback(
    (cardId, memberId, on) =>
      mutate(
        (b) =>
          patchCard(b, cardId, {
            member_ids: on
              ? [...new Set([...(findCard(b, cardId)?.member_ids || []), memberId])]
              : (findCard(b, cardId)?.member_ids || []).filter((id) => id !== memberId),
          }),
        () => (on ? api.addCardMember(cardId, memberId) : api.removeCardMember(cardId, memberId))
      ),
    [mutate]
  );

  // Sync summary fields on the board after card-modal mutations (counts, etc.).
  const patchCardInBoard = useCallback(
    (cardId, patch) => apply(patchCard(boardRef.current, cardId, patch)),
    [apply]
  );

  const getSnapshot = useCallback(() => boardRef.current, []);
  const restoreSnapshot = useCallback((snapshot) => apply(snapshot), [apply]);

  return {
    board,
    loading,
    error,
    toast,
    reload: load,
    actions: {
      addList,
      renameList,
      deleteList,
      moveList,
      addCard,
      moveCardLocal,
      commitCardMove,
      updateCard,
      archiveCard,
      deleteCard,
      toggleCardLabel,
      toggleCardMember,
      patchCardInBoard,
      findListOfCard,
      getSnapshot,
      restoreSnapshot,
      showToast,
    },
  };
}
