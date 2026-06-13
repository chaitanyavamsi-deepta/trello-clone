import { useState } from 'react';
import Icon from '../common/Icon';

const ACTIONS = [
  { key: 'open',    icon: 'board',       label: 'Open card' },
  { key: 'labels',  icon: 'filter',      label: 'Edit labels' },
  { key: 'members', icon: 'member',      label: 'Change members' },
  { key: 'dates',   icon: 'clock',       label: 'Edit dates' },
  { key: 'archive', icon: 'description', label: 'Archive' },
];

export default function QuickCardEditor({ card, onClose, onOpen, onSave, onArchive }) {
  const [title, setTitle] = useState(card.title);

  function handleSave() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) onSave(trimmed);
    onClose();
  }

  function handleAction(key) {
    if (key === 'open') { onClose(); onOpen(); }
    else if (key === 'archive') { onArchive(); onClose(); }
    else { onClose(); onOpen(); } // fallback: open full modal
  }

  return (
    <div className="qce-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qce">
        <div className="qce__card">
          <textarea
            className="qce__title"
            value={title}
            autoFocus
            rows={3}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
          />
          <button className="qce__save" onClick={handleSave}>Save</button>
        </div>
        <div className="qce__menu">
          {ACTIONS.map((a) => (
            <button key={a.key} className="qce__action" onClick={() => handleAction(a.key)}>
              <Icon name={a.icon} size={16} />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
