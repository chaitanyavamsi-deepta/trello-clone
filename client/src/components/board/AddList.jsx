import { useState } from 'react';

export default function AddList({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function submit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
  }

  if (!open) {
    return (
      <button className="add-list add-list--closed" onClick={() => setOpen(true)}>
        + Add a list
      </button>
    );
  }
  return (
    <form className="add-list add-list--open" onSubmit={submit}>
      <input
        autoFocus
        value={title}
        maxLength={512}
        placeholder="Enter list title…"
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="add-list__actions">
        <button type="submit">Add list</button>
        <button type="button" className="ghost" onClick={() => { setOpen(false); setTitle(''); }}>
          ×
        </button>
      </div>
    </form>
  );
}
