import { useEffect, useRef, useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardItem from './CardItem';
import AddCard from './AddCard';
import Icon from '../common/Icon';

export default function ListColumn({
  list,
  labels,
  members,
  dimmedCardIds,
  actions,
  onOpenCard,
  quickEditId,
  quickEditTitle,
  onQuickEditStart,
  onQuickClose,
  onQuickSave,
  onQuickArchive,
  onEditTitleChange,
  onExpandedRect,
  overlay = false,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`,
    data: { type: 'list', item: list },
    disabled: overlay,
  });

  useEffect(() => {
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  function saveTitle() {
    setEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== list.title) actions.renameList(list.id, trimmed);
    else setTitle(list.title);
  }

  return (
    <section
      ref={setNodeRef}
      className={`list${isDragging ? ' list--dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <header className="list__header" {...attributes} {...listeners}>
        <div className="list__name-wrap">
          {editing ? (
            <input
              className="list__title-input"
              autoFocus
              value={title}
              maxLength={512}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            />
          ) : (
            <h2 className="list__title" onClick={() => !overlay && setEditing(true)}>
              {list.title}
            </h2>
          )}
          {!editing && <span className="list__count">{list.cards.length}</span>}
        </div>
        {!overlay && (
          <button
            className="list__collapse"
            title={collapsed ? 'Expand list' : 'Collapse list'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setCollapsed((v) => !v); }}
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} size={16} />
          </button>
        )}
        {!overlay && (
          <div className="list__menu-wrap" ref={menuRef}>
            <button
              className="list__menu"
              title="List actions"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            >
              <Icon name="more" size={16} />
            </button>
            {menuOpen && (
              <div className="list__menu-panel">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (window.confirm(`Delete list "${list.title}" and all its cards?`)) {
                      actions.deleteList(list.id);
                    }
                  }}
                >
                  Delete this list
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {!collapsed && (
        <div className="list__cards">
          <SortableContext
            items={list.cards.map((c) => `card-${c.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {list.cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                labels={labels}
                members={members}
                dimmed={dimmedCardIds?.has(card.id)}
                onOpen={() => onOpenCard?.(card.id)}
                onQuickEditStart={onQuickEditStart}
                isQuickEditing={quickEditId === card.id}
                editTitle={quickEditId === card.id ? quickEditTitle : undefined}
                onEditTitleChange={quickEditId === card.id ? onEditTitleChange : undefined}
                onExpandedRect={quickEditId === card.id ? onExpandedRect : undefined}
                onQuickClose={onQuickClose}
                onQuickSave={(title) => onQuickSave?.(card.id, title)}
                onQuickArchive={() => onQuickArchive?.(card.id)}
                overlay={overlay}
              />
            ))}
          </SortableContext>
        </div>
      )}

      {!overlay && !collapsed && <AddCard onAdd={(cardTitle) => actions.addCard(list.id, cardTitle)} />}
    </section>
  );
}
