import { useState } from 'react';

export default function Checklist({ checklist, onAddItem, onToggleItem, onDeleteItem, onDelete }) {
  const [content, setContent] = useState('');
  const total = checklist.items.length;
  const done = checklist.items.filter((i) => i.is_complete).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function submit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onAddItem(checklist.id, trimmed);
    setContent('');
  }

  return (
    <div className="checklist">
      <div className="checklist__header">
        <h4>☑ {checklist.title}</h4>
        <button className="ghost" onClick={() => onDelete(checklist.id)}>
          Delete
        </button>
      </div>
      <div className="checklist__progress">
        <span className="checklist__pct">{pct}%</span>
        <div className="checklist__bar">
          <div
            className={`checklist__fill${pct === 100 ? ' checklist__fill--done' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ul className="checklist__items">
        {checklist.items.map((item) => (
          <li key={item.id} className={item.is_complete ? 'checklist__item--done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={item.is_complete}
                onChange={() => onToggleItem(checklist.id, item.id, !item.is_complete)}
              />
              {item.content}
            </label>
            <button className="ghost" onClick={() => onDeleteItem(checklist.id, item.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="checklist__add">
        <input
          value={content}
          maxLength={1024}
          placeholder="Add an item…"
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
