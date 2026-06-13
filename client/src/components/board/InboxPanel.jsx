import { useState } from 'react';
import Icon from '../common/Icon';

export default function InboxPanel({ onAddCard }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  function submit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddCard?.(trimmed);
    setTitle('');
    setAdding(false);
  }

  return (
    <aside className="inbox-panel">
      <div className="inbox-panel__header">
        <div className="inbox-panel__title-row">
          <h2 className="inbox-panel__title">
            <Icon name="inbox" size={16} />
            Inbox
          </h2>
          <div className="inbox-panel__btns">
            <button className="inbox-panel__btn" title="Filter">
              <Icon name="filter" size={16} />
            </button>
            <button className="inbox-panel__btn" title="Menu">
              <Icon name="more" size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="inbox-panel__add-wrap">
        {adding ? (
          <form className="inbox-panel__form" onSubmit={submit}>
            <textarea
              autoFocus
              className="inbox-panel__textarea"
              placeholder="Card title…"
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submit(e);
                if (e.key === 'Escape') { setAdding(false); setTitle(''); }
              }}
            />
            <div className="inbox-panel__form-actions">
              <button type="submit" className="inbox-panel__add-submit">Add card</button>
              <button type="button" className="inbox-panel__btn" onClick={() => { setAdding(false); setTitle(''); }}>
                <Icon name="close" size={16} />
              </button>
            </div>
          </form>
        ) : (
          <button className="inbox-panel__add-btn" onClick={() => setAdding(true)}>
            Add a card
          </button>
        )}
      </div>
    </aside>
  );
}
