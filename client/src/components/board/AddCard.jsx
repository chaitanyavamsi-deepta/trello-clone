import { useState } from 'react';

export default function AddCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function submit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle(''); // composer stays open for rapid entry (user story C1)
  }

  if (!open) {
    return (
      <button className="add-card add-card--closed" onClick={() => setOpen(true)}>
        + Add a card
      </button>
    );
  }
  return (
    <form className="add-card add-card--open" onSubmit={submit}>
      <textarea
        autoFocus
        value={title}
        maxLength={512}
        placeholder="Enter a title for this card…"
        rows={2}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) submit(e);
          if (e.key === 'Escape') { setOpen(false); setTitle(''); }
        }}
      />
      <div className="add-card__actions">
        <button type="submit">Add card</button>
        <button type="button" className="ghost" onClick={() => { setOpen(false); setTitle(''); }}>
          ×
        </button>
      </div>
    </form>
  );
}
