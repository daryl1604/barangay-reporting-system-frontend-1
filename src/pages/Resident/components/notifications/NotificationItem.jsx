import React from 'react';
import { formatDateTime } from '../../../../utils/dateUtils';

export default function NotificationItem({ notification, onClick, onDelete, isUnread }) {
  return (
    <div className={`notif-item${isUnread ? ' notif-item--unread' : ''}`} onClick={() => onClick && onClick(notification)}>
      <div className={`notif-item__avatar${isUnread ? ' notif-item__avatar--unread' : ''}`}>{(notification.title || 'N').trim().slice(0, 1).toUpperCase()}</div>
      <div className="notif-item__content">
        <div className="notif-item__title">{notification.title}</div>
        <div className="notif-item__desc">{notification.description}</div>
        <div className="notif-item__date">{formatDateTime(notification.date)}</div>
      </div>
      <button
        type="button"
        className="notif-item__delete"
        aria-label="Delete notification"
        title="Delete notification"
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.(notification);
        }}
      >
        &times;
      </button>
    </div>
  );
}
