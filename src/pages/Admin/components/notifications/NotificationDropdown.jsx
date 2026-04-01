import { useEffect, useRef, useState } from "react";

function formatNotificationTime(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.75A4.75 4.75 0 0 0 7.25 8.5v1.56c0 .87-.28 1.72-.8 2.41l-1.3 1.72a1.75 1.75 0 0 0 1.4 2.81h11.9a1.75 1.75 0 0 0 1.4-2.81l-1.3-1.72a4 4 0 0 1-.8-2.41V8.5A4.75 4.75 0 0 0 12 3.75Zm0 17.5a2.76 2.76 0 0 1-2.63-1.94.75.75 0 0 1 1.43-.47 1.25 1.25 0 0 0 2.4 0 .75.75 0 1 1 1.43.47A2.76 2.76 0 0 1 12 21.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.53 5.47a.75.75 0 0 1 1.06 0L12 9.94l4.41-4.47a.75.75 0 1 1 1.06 1.06L13.06 11l4.41 4.47a.75.75 0 0 1-1.06 1.06L12 12.06l-4.41 4.47a.75.75 0 0 1-1.06-1.06L10.94 11 6.53 6.53a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function NotificationDropdown({ notifications, unreadNotificationCount, onOpenNotification, onDismissNotification }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div className="dashboard-notifications" ref={dropdownRef}>
      <button
        type="button"
        className={["dashboard-icon-button", isOpen ? "is-active" : ""].filter(Boolean).join(" ")}
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentState) => !currentState)}
      >
        <BellIcon />
        {unreadNotificationCount > 0 ? (
          <span className="dashboard-notifications__badge">{Math.min(unreadNotificationCount, 9)}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="dashboard-notifications__dropdown">
          <div className="dashboard-notifications__header">
            <div>
              <h3>Notifications</h3>
              <p className="dashboard-notifications__subtitle">Recent activity updates</p>
            </div>
            <span>{unreadNotificationCount > 0 ? `${unreadNotificationCount} new` : "Up to date"}</span>
          </div>

          <div className="dashboard-notifications__list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={[
                    "dashboard-notifications__item",
                    notification.read ? "is-read" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    onOpenNotification(notification);
                    setIsOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenNotification(notification);
                      setIsOpen(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <button
                    type="button"
                    className="dashboard-notifications__dismiss"
                    aria-label="Remove notification"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDismissNotification(notification.id);
                    }}
                  >
                    <CloseIcon />
                  </button>
                  <strong>{notification.title}</strong>
                  <p>{notification.description}</p>
                  <span>{formatNotificationTime(notification.date)}</span>
                </article>
              ))
            ) : (
              <p className="dashboard-notifications__empty">No notifications yet</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationDropdown;
