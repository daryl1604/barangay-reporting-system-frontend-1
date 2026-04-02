import React from 'react';

export default function NotificationItem({ notification, onClick, isUnread }) {
  return (
    <div className={`notif-item${isUnread ? ' notif-item--unread' : ''}`} onClick={() => onClick && onClick(notification)}>
      <div className="notif-item__avatar">J</div>
      <div className="notif-item__content">
        <div className="notif-item__title">{notification.title}</div>
        <div className="notif-item__desc">{notification.description}</div>
        <div className="notif-item__date">{notification.date}</div>
      </div>
      {isUnread && <div className="notif-item__dot" />}
    </div>
  );
}