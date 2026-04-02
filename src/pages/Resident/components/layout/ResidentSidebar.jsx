import React from 'react';
import '../../styles/ResidentLayout.css';

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'submit', label: 'Submit Report' },
  { key: 'reports', label: 'My Reports' },
  { key: 'history', label: 'History' },
  { key: 'settings', label: 'Settings' },
];

export default function ResidentSidebar({ activePage, onNavigate, user, onLogout }) {
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JD';

  return (
    <aside className="res-sidebar">
      <div className="res-sidebar__profile" onClick={() => onNavigate('profile')} style={{ cursor: 'pointer' }}>
        <div className="res-sidebar__avatar">{initials}</div>
        <div className="res-sidebar__info">
          <div className="res-sidebar__name">{user?.fullName || 'Juan Dela Cruz'}</div>
          <div className="res-sidebar__purok">{user?.purok || 'Purok 1'}</div>
          <div className="res-sidebar__role">Resident</div>
        </div>
      </div>

      <nav className="res-sidebar__nav">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`res-sidebar__nav-item${activePage === item.key ? ' res-sidebar__nav-item--active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="res-sidebar__access-card">
        <div className="res-sidebar__access-label">Resident Portal Access</div>
        <div className="res-sidebar__access-title">Private report tracking only</div>
        <div className="res-sidebar__access-desc">
          You can only view reports submitted from your own account.
        </div>
      </div>

      <button className="res-sidebar__logout" onClick={onLogout}>Log Out</button>
    </aside>
  );
}