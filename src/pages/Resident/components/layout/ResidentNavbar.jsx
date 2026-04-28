import React from 'react';
import '../../styles/ResidentLayout.css';

export default function ResidentNavbar({ activePage, onNavigate, unreadCount, user }) {
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'R';

  const bellActive = activePage === 'notifications';
  const profileActive = activePage === 'profile';

  return (
    <header className="res-navbar">
      <div className="res-navbar__brand">Barangay Mataas na Lupa Monitoring</div>
      <div className="res-navbar__actions">
        <button className={`res-navbar__bell${bellActive ? ' res-navbar__bell--active' : ''}`} onClick={() => onNavigate('notifications')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && <span className="res-navbar__badge">{unreadCount}</span>}
        </button>
        <div className={`res-navbar__user${profileActive ? ' res-navbar__user--active' : ''}`} onClick={() => onNavigate('profile')}>
          <div className="res-navbar__user-avatar">{initials}</div>
          <div className="res-navbar__user-info">
            <div className="res-navbar__user-name">{user?.fullName || user?.email || 'Resident Account'}</div>
            <div className="res-navbar__user-role">Resident</div>
          </div>
        </div>
      </div>
    </header>
  );
}
