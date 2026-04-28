import { startTransition, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResidentNavbar from "./ResidentNavbar";
import ResidentSidebar from "./ResidentSidebar";
import { normalizeResidentUser } from "../../../../utils/userUtils";
import API from "../../../../api/axios";
import { readNotificationPrefs, isNotificationVisible } from "../../../../utils/notificationPrefs";

const PAGE_TO_ROUTE = {
  dashboard: "/resident",
  submit: "/submit-report",
  reports: "/my-reports",
  history: "/history",
  settings: "/settings",
  profile: "/profile",
  notifications: "/notifications",
};

const resolvePage = (pathname) => {
  if (pathname.startsWith("/submit")) return "submit";
  if (pathname.startsWith("/my-reports")) return "reports";
  if (pathname.startsWith("/history")) return "history";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/notifications")) return "notifications";
  return "dashboard";
};

export default function ResidentLayout({ activePage, children, user, unreadCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [resident, setResident] = useState(null);
  const [resolvedUnreadCount, setResolvedUnreadCount] = useState(unreadCount);
  const currentPage = activePage || resolvePage(location.pathname);

  const loadResident = () => {
    if (user) {
      setResident(normalizeResidentUser(user));
      return;
    }

    if (typeof window === "undefined") {
      setResident(null);
      return;
    }

    try {
      const raw = localStorage.getItem("user");
      setResident(raw ? normalizeResidentUser(JSON.parse(raw)) : null);
    } catch {
      setResident(null);
    }
  };

  const refreshUnreadCount = async () => {
    try {
      const response = await API.get("/notifications");
      const notifications = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.notifications)
          ? response.data.notifications
          : [];
      const prefs = readNotificationPrefs();
      const nextCount = prefs.badgeVisible
        ? notifications.filter((notification) => !notification.read && isNotificationVisible(notification, prefs)).length
        : 0;

      setResolvedUnreadCount(nextCount);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNavigate = (page) => {
    const route = PAGE_TO_ROUTE[page];
    if (route && route !== location.pathname) {
      startTransition(() => {
        navigate(route);
      });
    }
  };

  const handleRequestLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutConfirmOpen(false);
  };

  const handleConfirmLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setIsLogoutConfirmOpen(false);
    navigate("/");
  };

  useEffect(() => {
    loadResident();
  }, [user]);

  useEffect(() => {
    if (unreadCount > 0) {
      setResolvedUnreadCount(unreadCount);
      return;
    }

    refreshUnreadCount();
  }, [unreadCount]);

  useEffect(() => {
    const requestLogout = () => {
      setIsLogoutConfirmOpen(true);
    };

    const handleUserUpdated = () => loadResident();
    const handleNotificationsUpdated = () => refreshUnreadCount();
    const handlePrefsUpdated = () => refreshUnreadCount();

    window.addEventListener("resident-request-logout", requestLogout);
    window.addEventListener("resident-user-updated", handleUserUpdated);
    window.addEventListener("resident-notifications-updated", handleNotificationsUpdated);
    window.addEventListener("resident-notification-prefs-updated", handlePrefsUpdated);

    return () => {
      window.removeEventListener("resident-request-logout", requestLogout);
      window.removeEventListener("resident-user-updated", handleUserUpdated);
      window.removeEventListener("resident-notifications-updated", handleNotificationsUpdated);
      window.removeEventListener("resident-notification-prefs-updated", handlePrefsUpdated);
    };
  }, []);

  return (
    <div className="resident-shell">
      {isLogoutConfirmOpen ? (
        <div className="resident-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="resident-logout-title">
          <div className="resident-confirm-modal__backdrop" onClick={handleCancelLogout} />
          <section className="resident-confirm-modal__card">
            <p className="resident-confirm-modal__eyebrow">Log Out</p>
            <h2 id="resident-logout-title">Log out of your resident account?</h2>
            <p className="resident-confirm-modal__copy">
              You will end the current session and return to the login screen.
            </p>
            <div className="resident-confirm-modal__actions">
              <button type="button" className="resident-confirm-modal__button resident-confirm-modal__button--ghost" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button type="button" className="resident-confirm-modal__button resident-confirm-modal__button--danger" onClick={handleConfirmLogout}>
                Log Out
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <ResidentNavbar activePage={currentPage} onNavigate={handleNavigate} unreadCount={resolvedUnreadCount} user={resident} />
      <div className="resident-shell__content">
        <ResidentSidebar
          activePage={currentPage}
          onNavigate={handleNavigate}
          user={resident}
          onLogout={handleRequestLogout}
        />
        <main className="resident-shell__main">{children}</main>
      </div>
    </div>
  );
}
