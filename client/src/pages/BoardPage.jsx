// Board view: DnD orchestration (LLD §4.2). One DndContext; lists sort
// horizontally, cards sort vertically and move across lists via onDragOver
// (live preview) + onDragEnd (fractional position persist, ADR-003/004).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoard } from '../hooks/useBoard';
import { resolveBackground, resolveDynamicBg } from '../utils/backgrounds';
import ListColumn from '../components/board/ListColumn';
import CardItem from '../components/board/CardItem';
import AddList from '../components/board/AddList';

import AppNav from '../components/common/AppNav';
import Icon from '../components/common/Icon';

import { SearchBox, FilterMenu, cardMatchesFilters, EMPTY_FILTERS } from '../components/common/FilterBar';
import CardModal from '../components/card/CardModal';

const numId = (dndId) => Number(String(dndId).split('-')[1]);

function initials(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function BoardPage() {
  const { boardId } = useParams();
const { board, loading, error, toast, actions } = useBoard(Number(boardId));
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeDrag, setActiveDrag] = useState(null); // { type, item }
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchIds, setSearchIds] = useState(null); // null = no active search
  const dragSnapshot = useRef(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [quickEdit, setQuickEdit] = useState(null); // { card, rect }
  const [quickEditTitle, setQuickEditTitle] = useState('');
  const [saveTop, setSaveTop] = useState(null);
  const [boardTitle, setBoardTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const openCardId = searchParams.get('card') ? Number(searchParams.get('card')) : null;

  useEffect(() => { if (board) setBoardTitle(board.title); }, [board?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveBoardTitle() {
    setEditingTitle(false);
    const trimmed = boardTitle.trim();
    if (!trimmed || trimmed === board.title) return;
    try { await api.updateBoard(board.id, { title: trimmed }); } catch { setBoardTitle(board.title); }
  }

  // Track for the home page's "Recently viewed" section (most recent first).
  useEffect(() => {
    if (!board) return;
    const entry = { id: board.id, title: board.title, background: board.background };
    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem('recentBoards')) || [];
    } catch {
      /* corrupt entry — start fresh */
    }
    recent = [entry, ...recent.filter((r) => r.id !== board.id)].slice(0, 4);
    localStorage.setItem('recentBoards', JSON.stringify(recent));
  }, [board?.id, board?.title, board?.background]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtersActive =
    searchIds !== null ||
    filters.labelIds.length > 0 ||
    filters.memberIds.length > 0 ||
    filters.due !== null;

  const dimmedCardIds = useMemo(() => {
    if (!board || !filtersActive) return new Set();
    const dimmed = new Set();
    for (const list of board.lists) {
      for (const card of list.cards) {
        const searchOk = searchIds === null || searchIds.has(card.id);
        if (!searchOk || !cardMatchesFilters(card, filters)) dimmed.add(card.id);
      }
    }
    return dimmed;
  }, [board, filters, searchIds, filtersActive]);

  if (loading) return <div className="board-page board-page--empty">Loading…</div>;
  if (error || !board)
    return (
      <div className="board-page board-page--empty">
        <p className="error">{error || 'Board not found'}</p>
        <Link to="/">← Back to boards</Link>
      </div>
    );

  function handleDragStart({ active }) {
    dragSnapshot.current = actions.getSnapshot();
    setActiveDrag(active.data.current);
  }

  function handleDragOver({ active, over }) {
    if (!over || active.data.current?.type !== 'card') return;
    const cardId = numId(active.id);
    const fromList = actions.findListOfCard(cardId);
    const overData = over.data.current;
    const toListId =
      overData?.type === 'card'
        ? actions.findListOfCard(numId(over.id))?.id
        : overData?.type === 'list'
          ? numId(over.id)
          : null;
    if (!toListId || !fromList || toListId === fromList.id) return;
    const toList = dragSnapshot.current && actions.getSnapshot().lists.find((l) => l.id === toListId);
    if (!toList) return;
    const overIndex =
      overData?.type === 'card'
        ? toList.cards.findIndex((c) => c.id === numId(over.id))
        : toList.cards.length;
    actions.moveCardLocal(cardId, toListId, overIndex === -1 ? toList.cards.length : overIndex);
  }

  function handleDragEnd({ active, over }) {
    const drag = activeDrag;
    setActiveDrag(null);
    if (!over) {
      actions.restoreSnapshot(dragSnapshot.current);
      return;
    }
    if (drag?.type === 'list') {
      const lists = actions.getSnapshot().lists;
      const toIndex = lists.findIndex((l) => l.id === numId(over.id));
      if (toIndex !== -1) actions.moveList(numId(active.id), toIndex, dragSnapshot.current);
      return;
    }
    if (drag?.type === 'card') {
      const cardId = numId(active.id);
      const list = actions.findListOfCard(cardId);
      if (!list) return;
      let toIndex = list.cards.findIndex((c) => c.id === cardId);
      if (over.data.current?.type === 'card' && numId(over.id) !== cardId) {
        const overList = actions.findListOfCard(numId(over.id));
        if (overList?.id === list.id) {
          toIndex = list.cards.findIndex((c) => c.id === numId(over.id));
        }
      }
      actions.commitCardMove(cardId, toIndex, dragSnapshot.current);
    }
  }

  return (
    <div className="board-page" style={{ background: resolveBackground(board.background) }}>
      {/* Row 1: global AppNav — tinted with board's dynamic background */}
      <AppNav
        bgColor={resolveDynamicBg(board.background)}
        search={<SearchBox boardId={board.id} onSearchResults={setSearchIds} onCardClick={(cardId) => setSearchParams({ card: String(cardId) })} />}
        onCreate={() => {}}
      />
      {/* Row 2: board header — translucent blur over the gradient */}
      <header className="board-header">
        <div className="board-header__left">
          {editingTitle ? (
            <input
              className="board-header__name-input"
              autoFocus
              value={boardTitle}
              maxLength={512}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={saveBoardTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveBoardTitle();
                if (e.key === 'Escape') { setBoardTitle(board.title); setEditingTitle(false); }
              }}
            />
          ) : (
            <h1 className="board-header__title" onClick={() => setEditingTitle(true)}>{boardTitle}</h1>
          )}
          <button className="board-header__icon-btn" title="Watch board"><Icon name="eye" size={16} /></button>
          <button className="board-header__icon-btn" title="Views"><Icon name="down" size={12} /></button>
          <span className="board-header__sep" />
        </div>
        <div className="board-header__right">
          <div className="board-header__facepile">
            {board.members.slice(0, 4).map((m) => (
              <span key={m.id} className="avatar board-header__member" style={{ background: m.avatar_color }} title={m.name}>
                {initials(m.name)}
              </span>
            ))}
          </div>
          <FilterMenu board={board} filters={filters} onFiltersChange={setFilters} compact />
          <button className="board-header__btn" title="Board menu"><Icon name="more" size={16} /></button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveDrag(null);
          actions.restoreSnapshot(dragSnapshot.current);
        }}
      >
        <main className="board-canvas">
          <SortableContext
            items={board.lists.map((l) => `list-${l.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {board.lists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                labels={board.labels}
                members={board.members}
                dimmedCardIds={dimmedCardIds}
                actions={actions}
                onOpenCard={(cardId) => setSearchParams({ card: String(cardId) })}
                quickEditId={quickEdit?.card?.id}
                quickEditTitle={quickEditTitle}
                onEditTitleChange={setQuickEditTitle}
                onQuickEditStart={(card, rect) => { setQuickEdit({ card, rect }); setQuickEditTitle(card.title); setSaveTop(rect.bottom + 8); }}
                onQuickClose={() => { setQuickEdit(null); setSaveTop(null); }}
                onQuickSave={(cardId, title) => { actions.updateCard(cardId, { title }); setQuickEdit(null); setSaveTop(null); }}
                onQuickArchive={(cardId) => { actions.archiveCard(cardId); setQuickEdit(null); setSaveTop(null); }}
                onExpandedRect={(rect) => setSaveTop(rect.bottom + 8)}
              />
            ))}
          </SortableContext>
          <AddList onAdd={(title) => actions.addList(title)} />
        </main>

        <DragOverlay>
          {activeDrag?.type === 'card' && (
            <div className="drag-tilt">
              <CardItem
                card={activeDrag.item}
                labels={board.labels}
                members={board.members}
                overlay
              />
            </div>
          )}
          {activeDrag?.type === 'list' && (
            <div className="drag-tilt">
              <ListColumn
                list={activeDrag.item}
                labels={board.labels}
                members={board.members}
                dimmedCardIds={dimmedCardIds}
                overlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openCardId && (
        <CardModal
          cardId={openCardId}
          board={board}
          actions={actions}
          onClose={() => setSearchParams({})}
        />
      )}

      {quickEdit && (
        <>
          <div className="qce-backdrop" onClick={() => setQuickEdit(null)} />
          {quickEdit.rect && (
            <>
              <button
                className="card__qce-save"
                style={{ top: saveTop ?? quickEdit.rect.bottom + 8, left: quickEdit.rect.left }}
                onClick={() => { const t = quickEditTitle.trim(); if (t) actions.updateCard(quickEdit.card.id, { title: t }); setQuickEdit(null); setSaveTop(null); }}
              >
                Save
              </button>
              <div className="card__qce-actions" style={{ top: quickEdit.rect.top, left: quickEdit.rect.right + 8 }}>
                <button onClick={() => { setQuickEdit(null); setSearchParams({ card: String(quickEdit.card.id) }); }}>
                  <Icon name="board" size={14} /> Open card
                </button>
                <button onClick={() => { actions.archiveCard(quickEdit.card.id); setQuickEdit(null); }}>
                  <Icon name="description" size={14} /> Archive
                </button>
              </div>
            </>
          )}
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
