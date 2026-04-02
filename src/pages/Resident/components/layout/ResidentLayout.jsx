import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResidentNavbar from "./ResidentNavbar";
import ResidentSidebar from "./ResidentSidebar";

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
  const currentPage = activePage || resolvePage(location.pathname);

  const resident = useMemo(() => {
    if (user) return user;
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user]);

  const handleNavigate = (page) => {
    const route = PAGE_TO_ROUTE[page];
    if (route) {
      navigate(route);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/");
  };

  return (
    <div className="resident-shell">
      <ResidentNavbar activePage={currentPage} onNavigate={handleNavigate} unreadCount={unreadCount} user={resident} />
      <div className="resident-shell__content">
        <ResidentSidebar
          activePage={currentPage}
          onNavigate={handleNavigate}
          user={resident}
          onLogout={handleLogout}
        />
        <main className="resident-shell__main">{children}</main>
      </div>
    </div>
  );
}
