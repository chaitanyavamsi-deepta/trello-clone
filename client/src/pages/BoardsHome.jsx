import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { resolveBackground } from '../utils/backgrounds';
import AppNav from '../components/common/AppNav';
import Icon from '../components/common/Icon';

export function readRecentBoards() {
  try {
    return JSON.parse(localStorage.getItem('recentBoards')) || [];
  } catch {
    return [];
  }
}

function BoardTile({ board }) {
  return (
    <Link to={`/b/${board.id}`} className="home__tile">
      <span className="home__tile-bg" style={{ background: resolveBackground(board.background) }} />
      <span className="home__tile-title">{board.title}</span>
    </Link>
  );
}

export default function BoardsHome() {
  const [searchParams] = useSearchParams();
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(searchParams.get('create') === '1');
  const [title, setTitle] = useState('');
  const [q, setQ] = useState('');
  const [wsOpen, setWsOpen] = useState(true);
  const [members, setMembers] = useState([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const membersRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listBoards().then(setBoards).catch((err) => setError(err.message));
    api.listMembers().then(setMembers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!membersOpen) return;
    function onOutside(e) {
      if (membersRef.current && !membersRef.current.contains(e.target)) setMembersOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [membersOpen]);

  async function createBoard(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const board = await api.createBoard(title.trim());
      navigate(`/b/${board.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = boards?.filter((b) => b.title.toLowerCase().includes(q.trim().toLowerCase()));
  // Resolve recents against fresh board data — drops deleted boards, avoids stale titles/colors
  const recent = readRecentBoards()
    .map((r) => boards?.find((b) => b.id === r.id))
    .filter(Boolean);

  return (
    <div className="home">
      <AppNav
        variant="light"
        onCreate={() => setCreating(true)}
        search={
          <div className="appnav__searchwrap">
            <Icon name="search" className="appnav__searchicon" />
            <input
              className="appnav__search"
              type="search"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        }
      />
      <div className="home__layout">
        <nav className="home__sidebar">
          <header className="home__sidebar-header">
            <ul className="home__sidebar-list">
              <li className="home__sidebar-li">
                <span className="home__nav-item home__nav-item--active">
                  <Icon name="board" /> Boards
                </span>
              </li>
              <li className="home__sidebar-li">
                <span className="home__nav-item home__nav-item--inert">
                  <Icon name="template" /> Templates
                </span>
              </li>
              <li className="home__sidebar-li">
                <span className="home__nav-item home__nav-item--inert">
                  <Icon name="home" /> Home
                </span>
              </li>
            </ul>
          </header>
          <section className="home__sidebar-workspaces">
            <div><span className="home__ws-label">Workspaces</span></div>
            <ul className="home__sidebar-list">
              <li className="home__sidebar-li">
                <button
                  className="home__nav-item home__ws-toggle"
                  onClick={() => setWsOpen((v) => !v)}
                >
                  <span className="home__workspace-avatar home__workspace-avatar--sm">T</span>
                  Trello Workspace
                  <span className={`home__chevron${wsOpen ? ' home__chevron--open' : ''}`}>
                    <Icon name="down" size={12} />
                  </span>
                </button>
              </li>
              {wsOpen && (
                <>
                  <li className="home__sidebar-li">
                    <span className="home__nav-item home__nav-item--active home__nav-item--sub">
                      <Icon name="board" /> Boards
                    </span>
                  </li>
                  <li className="home__sidebar-li home__members-li" ref={membersRef}>
                    <button
                      className="home__nav-item home__nav-item--sub home__members-btn"
                      onClick={() => setMembersOpen((v) => !v)}
                    >
                      <Icon name="member" /> Members
                      <span className="home__members-count">{members.length}</span>
                    </button>
                    {membersOpen && (
                      <div className="home__members-pop">
                        <h4 className="home__members-pop-title">Workspace members</h4>
                        {members.map((m) => (
                          <div key={m.id} className="home__members-row">
                            <span className="avatar" style={{ background: m.avatar_color }}>
                              {m.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                            <div className="home__members-info">
                              <span className="home__members-name">{m.name}</span>
                              <span className="home__members-email">{m.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                </>
              )}
            </ul>
          </section>
        </nav>
        <main className="home__main">
          <div className="home__main-inner">
            {recent.length > 0 && !q && (
              <>
                <h2 className="home__recent"><Icon name="clock" size={20} /> Recently viewed</h2>
                <div className="home__grid home__grid--recent">
                  {recent.map((board) => (
                    <BoardTile key={board.id} board={board} />
                  ))}
                </div>
              </>
            )}

            <h2 className="home__section">YOUR WORKSPACES</h2>
            <div className="home__workspace">
              <span className="home__workspace-avatar">T</span>
              <strong>Trello Workspace</strong>
            </div>
            {error && <p className="error">{error}</p>}
            {!boards && !error && <div className="home__loading"><div className="spinner" /></div>}
            <div className="home__grid">
              {visible?.map((board) => (
                <BoardTile key={board.id} board={board} />
              ))}
              {creating ? (
                <form className="home__tile home__tile--form" onSubmit={createBoard}>
                  <input
                    autoFocus
                    value={title}
                    maxLength={512}
                    placeholder="Board title"
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => !title.trim() && setCreating(false)}
                  />
                  <button type="submit">Create</button>
                </form>
              ) : (
                <button className="home__tile home__tile--new" onClick={() => setCreating(true)}>
                  Create new board
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
