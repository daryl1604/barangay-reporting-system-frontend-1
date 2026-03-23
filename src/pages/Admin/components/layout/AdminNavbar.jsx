import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "reports", label: "Reports" },
  { id: "purok", label: "Purok" },
  { id: "analytics", label: "Analytics" },
  { id: "all-reports", label: "All Reports" },
];

function getNavOffset() {
  const nav = document.querySelector(".dashboard-nav");
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;
  return navHeight + 24;
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.75 3.75a.75.75 0 0 1 0 1.5h-4A1.75 1.75 0 0 0 5 7v10a1.75 1.75 0 0 0 1.75 1.75h4a.75.75 0 0 1 0 1.5h-4A3.25 3.25 0 0 1 3.5 17V7a3.25 3.25 0 0 1 3.25-3.25h4Zm5.72 3.97a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06l2.47-2.47H9a.75.75 0 0 1 0-1.5h9.94l-2.47-2.47a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AdminNavbar({ onLogout }) {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);

    if (sections.length === 0) {
      return undefined;
    }

    const updateActiveSection = () => {
      const navOffset = getNavOffset();
      const activationLine = window.scrollY + navOffset + 120;
      const sectionPositions = sections.map((section) => ({
        id: section.id,
        top: section.offsetTop,
      }));

      let nextActiveId = sectionPositions[0].id;

      sectionPositions.forEach((section) => {
        if (activationLine >= section.top) {
          nextActiveId = section.id;
        }
      });

      setActiveId(nextActiveId);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const handleNavigate = (targetId) => {
    const section = document.getElementById(targetId);

    if (!section) {
      return;
    }

    setActiveId(targetId);
    const targetTop = section.getBoundingClientRect().top + window.scrollY - getNavOffset();

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  };

  return (
    <header className="dashboard-nav">
      <button
        type="button"
        className="dashboard-nav__brand"
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }}
      >
        Barangay Mataas na Lupa Reporting System
      </button>

      <nav className="dashboard-nav__links" aria-label="Dashboard sections">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={["dashboard-nav__link", activeId === item.id ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={() => handleNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="dashboard-nav__logout" onClick={onLogout} aria-label="Logout" title="Logout">
          <LogoutIcon />
        </button>
      </nav>
    </header>
  );
}

export default AdminNavbar;
