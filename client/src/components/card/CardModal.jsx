import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import LabelPicker from './LabelPicker';
import MemberPicker from './MemberPicker';
import Checklist from './Checklist';
import Icon from '../common/Icon';

export default function CardModal({ cardId, board, actions, onClose }) {
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [picker, setPicker] = useState(null); // 'labels' | 'members' | null
  const [descEditing, setDescEditing] = useState(false);
  const [newChecklist, setNewChecklist] = useState('');
  const [newComment, setNewComment] = useState('');
  const attrsRef = useRef(null);

  const syncChecklistCounts = useCallback((checklists) => {
    const total = checklists.reduce((n, ch) => n + ch.items.length, 0);
    const done = checklists.reduce((n, ch) => n + ch.items.filter((i) => i.is_complete).length, 0);
    actions.patchCardInBoard(cardId, { checklist_total: total, checklist_done: done });
  }, [actions, cardId]);

  useEffect(() => {
    if (!picker) return;
    function onOutside(e) {
      if (attrsRef.current && !attrsRef.current.contains(e.target)) setPicker(null);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [picker]);

  useEffect(() => {
    let cancelled = false;
    api.getCard(cardId)
      .then((data) => { if (!cancelled) { setCard(data); setTitle(data.title); setDescription(data.description); } })
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [cardId]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (error) return <Overlay onClose={onClose}><p className="error">{error}</p></Overlay>;
  if (!card) return <Overlay onClose={onClose}><div className="modal__loading"><div className="spinner" /></div></Overlay>;

  const listName = board.lists.find((l) => l.id === card.list_id)?.title;

  function saveTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) { setCard({ ...card, title: trimmed }); actions.updateCard(cardId, { title: trimmed }); }
    else setTitle(card.title);
  }

  function saveDescription() {
    if (description !== card.description) { setCard({ ...card, description }); actions.updateCard(cardId, { description }); }
  }

  function setDueDate(value) {
    const due_date = value ? new Date(value).toISOString() : null;
    setCard({ ...card, due_date }); actions.updateCard(cardId, { due_date });
  }

  function toggleLabel(labelId, on) {
    const label_ids = on ? [...card.label_ids, labelId] : card.label_ids.filter((id) => id !== labelId);
    setCard({ ...card, label_ids }); actions.toggleCardLabel(cardId, labelId, on);
  }

  function toggleMember(memberId, on) {
    const member_ids = on ? [...card.member_ids, memberId] : card.member_ids.filter((id) => id !== memberId);
    setCard({ ...card, member_ids }); actions.toggleCardMember(cardId, memberId, on);
  }

  async function addChecklist(e) {
    e.preventDefault();
    const trimmed = newChecklist.trim();
    if (!trimmed) return;
    try {
      const checklist = await api.createChecklist(cardId, trimmed);
      const checklists = [...card.checklists, checklist];
      setCard({ ...card, checklists });
      setNewChecklist('');
      syncChecklistCounts(checklists);
    } catch (err) { actions.showToast(err.message); }
  }

  async function deleteChecklist(checklistId) {
    try {
      await api.deleteChecklist(checklistId);
      const checklists = card.checklists.filter((ch) => ch.id !== checklistId);
      setCard({ ...card, checklists });
      syncChecklistCounts(checklists);
    } catch (err) { actions.showToast(err.message); }
  }

  async function addItem(checklistId, content) {
    try {
      const item = await api.createChecklistItem(checklistId, content);
      const checklists = card.checklists.map((ch) =>
        ch.id === checklistId ? { ...ch, items: [...ch.items, item] } : ch
      );
      setCard({ ...card, checklists });
      syncChecklistCounts(checklists);
    } catch (err) { actions.showToast(err.message); }
  }

  async function toggleItem(checklistId, itemId, is_complete) {
    const checklists = card.checklists.map((ch) =>
      ch.id === checklistId
        ? { ...ch, items: ch.items.map((i) => (i.id === itemId ? { ...i, is_complete } : i)) }
        : ch
    );
    setCard({ ...card, checklists });
    syncChecklistCounts(checklists);
    try { await api.updateChecklistItem(itemId, { is_complete }); }
    catch (err) { actions.showToast(err.message); }
  }

  async function deleteItem(checklistId, itemId) {
    try {
      await api.deleteChecklistItem(itemId);
      const checklists = card.checklists.map((ch) =>
        ch.id === checklistId ? { ...ch, items: ch.items.filter((i) => i.id !== itemId) } : ch
      );
      setCard({ ...card, checklists });
      syncChecklistCounts(checklists);
    } catch (err) { actions.showToast(err.message); }
  }

  async function addComment(e) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    try {
      const comment = await api.addComment(cardId, trimmed);
      setCard({ ...card, comments: [comment, ...(card.comments || [])] });
      setNewComment('');
    } catch (err) { actions.showToast(err.message); }
  }

  async function deleteComment(commentId) {
    try {
      await api.deleteComment(commentId);
      setCard({ ...card, comments: card.comments.filter((c) => c.id !== commentId) });
    } catch (err) { actions.showToast(err.message); }
  }

  function relativeTime(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function initials(name) {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  const cardLabels = board.labels.filter((l) => card.label_ids.includes(l.id));
  const cardMembers = board.members.filter((m) => card.member_ids.includes(m.id));
  const dueLocal = card.due_date
    ? new Date(new Date(card.due_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : '';

  return (
    <Overlay onClose={onClose}>
      {/* Top bar: list name + close */}
      <div className="modal__topbar">
        <span className="modal__list-chip"><Icon name="board" size={12} /> {listName}</span>
        <button className="modal__close" onClick={onClose} title="Close"><Icon name="close" size={16} /></button>
      </div>

      {/* Title with completion circle */}
      <div className="modal__title-row">
        <button className="modal__title-circle" title="Mark complete">
          <Icon name="circle" size={20} />
        </button>
        <input
          className="modal__title"
          value={title}
          maxLength={512}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      </div>
      {card.is_archived && <p className="modal__subtitle">Archived</p>}

      <div className="modal__body">
        <div className="modal__main">

          {/* Empty state: quick-add chips row (like real Trello) */}
          {cardMembers.length === 0 && cardLabels.length === 0 && !card.due_date ? (
            <div className="modal__quick-add">
              <button onClick={() => setPicker(picker === 'labels' ? null : 'labels')}>
                <Icon name="label" size={14} /> Labels
              </button>
              <button onClick={() => setDueDate(new Date().toISOString().slice(0, 16))}>
                <Icon name="clock" size={14} /> Dates
              </button>
              <button onClick={() => setPicker(picker === 'members' ? null : 'members')}>
                <Icon name="addmember" size={14} /> Members
              </button>
            </div>
          ) : (
            /* Populated state: always show Members + Labels (even if empty), Due date when set */
            <div className="modal__attrs" ref={attrsRef}>
              <div className="modal__attr">
                <span className="modal__attr-label">Members</span>
                <div className="modal__attr-values">
                  {cardMembers.map((m) => (
                    <span key={m.id} className="avatar" style={{ background: m.avatar_color }} title={m.name}>
                      {m.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  ))}
                  <button className="modal__attr-add" onClick={() => setPicker(picker === 'members' ? null : 'members')}>+</button>
                </div>
                {picker === 'members' && <MemberPicker members={board.members} selectedIds={card.member_ids} onToggle={toggleMember} />}
              </div>

              <div className="modal__attr">
                <span className="modal__attr-label">Labels</span>
                <div className="modal__attr-values">
                  {cardLabels.map((l) => (
                    <span key={l.id} className="chip" style={{ background: l.color }}>{l.name || ''}</span>
                  ))}
                  <button className="modal__attr-add" onClick={() => setPicker(picker === 'labels' ? null : 'labels')}>+</button>
                </div>
                {picker === 'labels' && <LabelPicker labels={board.labels} selectedIds={card.label_ids} onToggle={toggleLabel} />}
              </div>

              <div className="modal__attr">
                <span className="modal__attr-label">Due date</span>
                <div className="modal__attr-values">
                  {card.due_date ? (
                    <>
                      <input type="datetime-local" className="modal__due-input" value={dueLocal} onChange={(e) => setDueDate(e.target.value)} />
                      <button className="ghost" onClick={() => setDueDate('')}>Clear</button>
                    </>
                  ) : (
                    <button className="modal__attr-add" onClick={() => setDueDate(new Date().toISOString().slice(0, 16))}>+</button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Pickers when in empty/quick-add mode */}
          {(cardMembers.length === 0 && cardLabels.length === 0 && !card.due_date) && picker === 'labels' && (
            <LabelPicker labels={board.labels} selectedIds={card.label_ids} onToggle={toggleLabel} />
          )}
          {(cardMembers.length === 0 && cardLabels.length === 0 && !card.due_date) && picker === 'members' && (
            <MemberPicker members={board.members} selectedIds={card.member_ids} onToggle={toggleMember} />
          )}

          {/* Description */}
          <section className="modal__section">
            <div className="modal__section-head">
              <Icon name="description" size={16} />
              <h3>Description</h3>
            </div>
            <textarea
              value={description}
              maxLength={5000}
              rows={descEditing ? 6 : 4}
              placeholder="Add a more detailed description…"
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setDescEditing(true)}
            />
            {descEditing && (
              <div className="modal__desc-actions">
                <button className="modal__desc-save" onClick={() => { saveDescription(); setDescEditing(false); }}>Save</button>
                <button className="modal__desc-cancel" onClick={() => { setDescription(card.description); setDescEditing(false); }}>Cancel</button>
              </div>
            )}
          </section>

          {/* Checklists */}
          {card.checklists.map((checklist) => (
            <Checklist
              key={checklist.id}
              checklist={checklist}
              onAddItem={addItem}
              onToggleItem={toggleItem}
              onDeleteItem={deleteItem}
              onDelete={deleteChecklist}
            />
          ))}

          {/* Add checklist form */}
          <form className="modal__add-checklist" onSubmit={addChecklist}>
            <input
              value={newChecklist}
              maxLength={512}
              placeholder="Add a checklist…"
              onChange={(e) => setNewChecklist(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>

          {/* Comments */}
          <section className="modal__section">
            <div className="modal__section-head">
              <Icon name="description" size={16} />
              <h3>Comments</h3>
            </div>
            <form className="modal__comment-add" onSubmit={addComment}>
              <input
                value={newComment}
                maxLength={5000}
                placeholder="Write a comment…"
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" disabled={!newComment.trim()}>Comment</button>
            </form>
            <ul className="modal__comments">
              {(card.comments || []).map((c) => (
                <li key={c.id} className="modal__comment">
                  <span className="avatar" style={{ background: c.member_color }} title={c.member_name}>
                    {initials(c.member_name)}
                  </span>
                  <div className="modal__comment-body">
                    <div className="modal__comment-meta">
                      <strong>{c.member_name}</strong>
                      <span className="modal__comment-time">{relativeTime(c.created_at)}</span>
                    </div>
                    <p>{c.body}</p>
                    <button className="modal__comment-delete" onClick={() => deleteComment(c.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">{children}</div>
    </div>
  );
}
