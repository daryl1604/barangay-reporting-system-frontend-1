import { useRef } from "react";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 3.75a6.75 6.75 0 1 1 0 13.5 6.75 6.75 0 0 1 0-13.5Zm0 1.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm9.53 12.97a.75.75 0 0 1 0 1.06l-1.75 1.75a.75.75 0 1 1-1.06-1.06l1.75-1.75a.75.75 0 0 1 1.06 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 2.75a.75.75 0 0 1 .75.75V5h8.5V3.5a.75.75 0 0 1 1.5 0V5h.75A2.5 2.5 0 0 1 21 7.5v11A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5h.75V3.5A.75.75 0 0 1 7 2.75Zm11.5 7.5h-13v8.25c0 .55.45 1 1 1h11c.55 0 1-.45 1-1v-8.25Zm-1-3.75h-11c-.55 0-1 .45-1 1v1.25h13V7.5c0-.55-.45-1-1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Ongoing", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

function FilterBar({
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  selectedDateLabel,
  label,
  showSearch = true,
  showDatePill = true,
  dateValue = "",
  dateLabel = "",
  onDateChange,
  onDateClear,
}) {
  const dateInputRef = useRef(null);

  return (
    <div className="filter-bar">
      {label ? <p className="filter-bar__label">{label}</p> : null}

      <div className="filter-bar__status-group">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={[
              "filter-bar__chip",
              selectedStatus === option.value ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showSearch ? (
        <div className="filter-bar__search">
          <SearchIcon />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search report type, resident, location..."
          />
        </div>
      ) : null}

      {showDatePill ? <div className="filter-bar__date-pill">{selectedDateLabel}</div> : null}

      {onDateChange ? (
        <div
          className="filter-bar__date-control"
          role="button"
          tabIndex={0}
          onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click();
            }
          }}
        >
          <CalendarIcon />
          <span>{dateLabel || "All dates"}</span>
          {dateValue ? (
            <button
              type="button"
              className="filter-bar__date-clear"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDateClear?.();
              }}
            >
              Reset
            </button>
          ) : null}
          <input
            ref={dateInputRef}
            type="date"
            value={dateValue}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

export default FilterBar;
