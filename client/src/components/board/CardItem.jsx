import { useLayoutEffect, useRef, useCallback, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../common/Icon';

function initials(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function dueState(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  if (due - now < 24 * 60 * 60 * 1000) return 'soon';
  return 'later';
}

export default function CardItem({
  card, labels, members, dimmed, onOpen, onQuickEditStart,
  isQuickEditing, onQuickClose, onQuickSave,
  editTitle, onEditTitleChange, onExpandedRect,
  overlay = false,
}) {
  const [done, setDone] = useState(false);
  const [bursting, setBursting] = useState(false);
  const articleRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: 'card', item: card },
    disabled: overlay || isQuickEditing,
  });

  // Merge DnD ref + our measurement ref
  const setRefs = useCallback((node) => {
    articleRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  // After quick-edit card renders (expanded), report actual bounding rect
  useLayoutEffect(() => {
    if (isQuickEditing && articleRef.current) {
      onExpandedRect?.(articleRef.current.getBoundingClientRect());
    }
  });

  const cardLabels = labels.filter((l) => card.label_ids?.includes(l.id));
  const cardMembers = members.filter((m) => card.member_ids?.includes(m.id));
  const due = dueState(card.due_date);
  const style = { transform: CSS.Transform.toString(transform), transition };

  /* ── Quick-edit mode ── */
  if (isQuickEditing) {
    return (
      <article ref={setRefs} className="card card--qce" style={style}>
        {cardLabels.length > 0 && (
          <div className="card__labels">
            {cardLabels.map((l) => (
              <span key={l.id} className="card__label" style={{ background: l.color }} />
            ))}
          </div>
        )}
        <textarea
          autoFocus
          className="card__qce-input"
          value={editTitle}
          rows={3}
          onChange={(e) => onEditTitleChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onQuickSave?.(editTitle?.trim()); }
            if (e.key === 'Escape') onQuickClose();
          }}
        />
      </article>
    );
  }

  /* ── Normal card ── */
  return (
    <article
      ref={setRefs}
      {...attributes}
      {...listeners}
      className={`card${isDragging ? ' card--dragging' : ''}${dimmed ? ' card--dimmed' : ''}${done ? ' card--done' : ''}`}
      style={style}
      onClick={() => !overlay && onOpen?.()}
    >
      {cardLabels.length > 0 && (
        <div className="card__labels">
          {cardLabels.map((label) => (
            <span key={label.id} className="card__label" style={{ background: label.color }} title={label.name} />
          ))}
        </div>
      )}
      <div className="card__title-row">
        <button
          className={`card__done-btn${done ? ' card__done-btn--done' : ''}${bursting ? ' card__done-btn--burst' : ''}`}
          title={done ? 'Mark incomplete' : 'Mark complete'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!done) { setBursting(true); setTimeout(() => setBursting(false), 500); }
            setDone((v) => !v);
          }}
        >
          <Icon name={done ? 'circledone' : 'circle'} size={16} />
          {bursting && [0,45,90,135,180,225,270,315].map((angle, i) => (
            <span key={i} className="card__spark" style={{ '--angle': `${angle}deg`, '--color': i % 2 === 0 ? '#22a06b' : '#4bce97' }} />
          ))}
        </button>
        <p className="card__title">{card.title}</p>
      </div>
      {(due || card.checklist_total > 0 || cardMembers.length > 0) && (
        <div className="card__badges">
          {due && (
            <span className={`badge badge--due-${due}`}>
              <Icon name="clock" size={12} />
              {new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {card.checklist_total > 0 && (
            <span className={`badge${card.checklist_done === card.checklist_total ? ' badge--done' : ''}`}>
              <Icon name="checklist" size={12} />
              {card.checklist_done}/{card.checklist_total}
            </span>
          )}
          {cardMembers.length > 0 && (
            <span className="card__avatars">
              {cardMembers.map((m) => (
                <span key={m.id} className="avatar" style={{ background: m.avatar_color }} title={m.name}>
                  {initials(m.name)}
                </span>
              ))}
            </span>
          )}
        </div>
      )}
      {!overlay && (
        <button
          className="card__edit"
          title="Edit card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickEditStart) {
              const rect = e.currentTarget.closest('.card')?.getBoundingClientRect();
              onQuickEditStart(card, rect);
            } else {
              onOpen?.();
            }
          }}
        >
          <Icon name="edit" size={12} />
        </button>
      )}
    </article>
  );
}
