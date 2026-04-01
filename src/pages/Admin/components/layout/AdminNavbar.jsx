import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { id: "reports", label: "Reports" },
  { id: "analytics", label: "Analytics" },
  { id: "all-reports", label: "All Reports" },
];

function getNavOffset() {
  const nav = document.querySelector(".dashboard-nav");
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;
  return navHeight + 24;
}

function ChevronDownIcon({ isOpen = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={["dashboard-nav__chevron", isOpen ? "is-open" : ""].filter(Boolean).join(" ")}
    >
      <path d="M5.25 7.75 10 12.5l4.75-4.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function AdminNavbar({ adminName, onAddResident, onManageResidents, onViewProfile, onRequestLogout }) {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);
  const [isResidentsMenuOpen, setIsResidentsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const residentsMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileInitial = (adminName || "A").trim().slice(0, 1).toUpperCase();

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

  useEffect(() => {
    if (!isResidentsMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!residentsMenuRef.current?.contains(event.target)) {
        setIsResidentsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isResidentsMenuOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isProfileMenuOpen]);

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
        <div className="dashboard-nav__menu" ref={residentsMenuRef}>
          <button
            type="button"
            className={["dashboard-nav__action", "dashboard-nav__menu-trigger", isResidentsMenuOpen ? "is-active" : ""]
              .filter(Boolean)
              .join(" ")}
            aria-expanded={isResidentsMenuOpen}
            onClick={() => setIsResidentsMenuOpen((currentValue) => !currentValue)}
          >
            Residents
            <ChevronDownIcon isOpen={isResidentsMenuOpen} />
          </button>

          {isResidentsMenuOpen ? (
            <div className="dashboard-nav__dropdown-menu">
              <button
                type="button"
                className="dashboard-nav__dropdown-item"
                onClick={() => {
                  setIsResidentsMenuOpen(false);
                  onAddResident();
                }}
              >
                Add Resident
              </button>
              <button
                type="button"
                className="dashboard-nav__dropdown-item"
                onClick={() => {
                  setIsResidentsMenuOpen(false);
                  onManageResidents();
                }}
              >
                Manage Residents
              </button>
            </div>
          ) : null}
        </div>
        <div className="dashboard-nav__profile" ref={profileMenuRef}>
          <button
            type="button"
            className={["dashboard-nav__profile-button", isProfileMenuOpen ? "is-active" : ""].filter(Boolean).join(" ")}
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((currentValue) => !currentValue)}
          >
            <span className="dashboard-nav__profile-avatar">{profileInitial}</span>
            <ChevronDownIcon isOpen={isProfileMenuOpen} />
          </button>

          {isProfileMenuOpen ? (
            <div className="dashboard-nav__profile-menu">
              <button
                type="button"
                className="dashboard-nav__profile-item"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onViewProfile();
                }}
              >
                View Profile
              </button>
              <button
                type="button"
                className="dashboard-nav__profile-item dashboard-nav__profile-item--danger"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onRequestLogout();
                }}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

export default AdminNavbar;
