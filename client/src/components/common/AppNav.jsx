// Modern-Trello app navbar. Light variant (white) for the boards home,
// dark variant over board views — mirrors how Trello tints its header.
// The avatar is the assumed-logged-in default user (spec: no auth).
import { Link } from 'react-router-dom';
import Icon from './Icon';

// Trello-style logo glyph — geometry and colors taken from the reference
// page markup: 24×24 rounded square #0055CC, two white bars rx≈0.95.
function LogoGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M0 5C0 2.24 2.24 0 5 0H19C21.76 0 24 2.24 24 5V19C24 21.76 21.76 24 19 24H5C2.24 24 0 21.76 0 19V5Z"
        fill="#0055CC"
      />
      <rect x="4.43" y="4.43" width="5.91" height="13.8" rx="0.95" fill="#FFFFFF" />
      <rect x="13.66" y="4.43" width="5.91" height="8.34" rx="0.95" fill="#FFFFFF" />
    </svg>
  );
}

export default function AppNav({ variant = 'dark', search, onCreate, bgColor }) {
  return (
    <nav className={`appnav appnav--${variant}`} style={bgColor ? { background: bgColor } : undefined}>
      <span className="appnav__icon" title="Apps">
        <Icon name="grid" />
      </span>
      <Link to="/" className="appnav__logo">
        <LogoGlyph />
        Trello
      </Link>
      <div className="appnav__center">
        {search}
        {onCreate && (
          <button className="appnav__create" onClick={onCreate}>
            Create
          </button>
        )}
      </div>
      <div className="appnav__right">
        <span className="appnav__icon" title="Notifications">
          <Icon name="bell" />
        </span>
        <span className="appnav__icon" title="Help">
          <Icon name="help" />
        </span>
        <span className="avatar appnav__avatar" title="Alice Johnson (default user)">AJ</span>
      </div>
    </nav>
  );
}
