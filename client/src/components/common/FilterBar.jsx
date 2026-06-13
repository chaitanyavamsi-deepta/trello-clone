// Search (server-side, debounced) + label/member/due filters (client-side) —
// HLD §4.3, ADR-007. Split for the modern chrome: SearchBox lives in the
// navbar; FilterMenu lives in the board header bar.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import Icon from './Icon';

export const EMPTY_FILTERS = { labelIds: [], memberIds: [], due: null };

const DAY = 24 * 60 * 60 * 1000;

// Does a card's due date fall within the selected due-date filter window?
function matchesDue(dueDate, filter) {
  if (filter === 'none') return !dueDate;
  if (!dueDate) return false;
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  switch (filter) {
    case 'overdue': return due < now;
    case 'soon':    return due >= now && due < now + DAY;       // next day
    case 'week':    return due >= now && due < now + 7 * DAY;   // next week
    case 'month':   return due >= now && due < now + 31 * DAY;  // next month
    default:        return true;
  }
}

export function cardMatchesFilters(card, filters) {
  if (filters.labelIds.length && !filters.labelIds.some((id) => card.label_ids?.includes(id))) {
    return false;
  }
  if (filters.memberIds.length && !filters.memberIds.some((id) => card.member_ids?.includes(id))) {
    return false;
  }
  if (filters.due && !matchesDue(card.due_date, filters.due)) return false;
  return true;
}

function toggle(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function SearchBox({ boardId, onSearchResults, onCardClick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!q.trim()) {
      onSearchResults(null);
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const data = await api.searchCards(boardId, q.trim());
        setResults(data);
        setOpen(true);
        onSearchResults(new Set(data.map((c) => c.id)));
      } catch {
        onSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [q, boardId, onSearchResults]);

  function handleSelect(card) {
    setOpen(false);
    setQ('');
    onSearchResults(null);
    onCardClick?.(card.id);
  }

  return (
    <div className="appnav__searchwrap" ref={wrapRef}>
      <Icon name="search" className="appnav__searchicon" />
      <input
        className="appnav__search"
        type="search"
        placeholder="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown">
          <p className="search-dropdown__heading">Cards</p>
          {results.map((card) => (
            <button key={card.id} className="search-dropdown__item" onMouseDown={() => handleSelect(card)}>
              <Icon name="board" size={14} className="search-dropdown__icon" />
              <span className="search-dropdown__content">
                <span className="search-dropdown__title">{card.title}</span>
                <span className="search-dropdown__sub">{card.board_title}: {card.list_title}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DUE_OPTIONS = [
  { value: 'none',    label: 'No dates',            iconColor: '#44546f' },
  { value: 'overdue', label: 'Overdue',              iconColor: '#eb5a46' },
  { value: 'soon',    label: 'Due in the next day',  iconColor: '#f2d600' },
  { value: 'week',    label: 'Due in the next week', iconColor: '#44546f' },
  { value: 'month',   label: 'Due in the next month',iconColor: '#44546f' },
];

export function FilterMenu({ board, filters, onFiltersChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const activeCount = filters.labelIds.length + filters.memberIds.length + (filters.due ? 1 : 0);

  return (
    <div className="filter-bar" ref={panelRef}>
      <button
        className={`filter-bar__toggle${activeCount ? ' filter-bar__toggle--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="filter" />
        {!compact && ' Filters'}
        {activeCount > 0 && <span className="filter-bar__badge">{activeCount}</span>}
      </button>
      {activeCount > 0 && (
        <button className="filter-bar__clearall" onClick={() => onFiltersChange(EMPTY_FILTERS)}>
          Clear all
        </button>
      )}

      {open && (
        <div className="filter-panel">
          <div className="filter-panel__header">
            <h3>Filter</h3>
            <button className="filter-panel__close" onClick={() => setOpen(false)}>
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Due date */}
          <div className="filter-panel__section">
            {DUE_OPTIONS.map(({ value, label, iconColor }) => (
              <label key={value} className="filter-panel__row">
                <input
                  type="checkbox"
                  checked={filters.due === value}
                  onChange={() => onFiltersChange({ ...filters, due: filters.due === value ? null : value })}
                />
                <Icon name="clock" size={16} style={{ color: iconColor }} />
                {label}
              </label>
            ))}
          </div>

          {/* Labels */}
          <div className="filter-panel__section">
            <p className="filter-panel__section-title">Labels</p>
            <label className="filter-panel__row">
              <input type="checkbox" checked={false} readOnly />
              <Icon name="label" size={16} />
              No labels
            </label>
            {board.labels.map((label) => (
              <label key={label.id} className="filter-panel__row">
                <input
                  type="checkbox"
                  checked={filters.labelIds.includes(label.id)}
                  onChange={() => onFiltersChange({ ...filters, labelIds: toggle(filters.labelIds, label.id) })}
                />
                <span className="filter-panel__label-chip" style={{ background: label.color }}>
                  {label.name || ''}
                </span>
              </label>
            ))}
          </div>

          {/* Members */}
          <div className="filter-panel__section">
            <p className="filter-panel__section-title">Members</p>
            {board.members.map((member) => (
              <label key={member.id} className="filter-panel__row">
                <input
                  type="checkbox"
                  checked={filters.memberIds.includes(member.id)}
                  onChange={() => onFiltersChange({ ...filters, memberIds: toggle(filters.memberIds, member.id) })}
                />
                <span className="avatar" style={{ background: member.avatar_color, width: 24, height: 24, fontSize: 10 }}>
                  {member.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                {member.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
