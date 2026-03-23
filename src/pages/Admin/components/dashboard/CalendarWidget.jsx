import { useMemo, useState } from "react";
import { buildCalendarDays, isSameDay } from "../../../../utils/dateUtils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.78 5.47a.75.75 0 0 1 0 1.06L9.31 12l5.47 5.47a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.22 5.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 0 1-1.06-1.06L14.69 12 9.22 6.53a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarWidget({
  viewDate,
  selectedDate,
  reportDates,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onClearDate,
  onSelectMonth,
  onSelectYear,
}) {
  const [pickerMode, setPickerMode] = useState(null);
  const days = buildCalendarDays(viewDate);
  const today = new Date();
  const yearOptions = useMemo(() => {
    const startYear = viewDate.getFullYear() - 6;
    return Array.from({ length: 13 }, (_, index) => startYear + index);
  }, [viewDate]);

  return (
    <section className="dashboard-panel">
      <div className="calendar-widget__title-row">
        <div className="calendar-widget__title-display">
          <p className="dashboard-panel__eyebrow">Calendar</p>
          <h2 className="calendar-widget__display-date">
            <button
              type="button"
              className={["calendar-widget__display-trigger", pickerMode === "month" ? "is-open" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setPickerMode((currentMode) => (currentMode === "month" ? null : "month"))}
            >
              {MONTH_NAMES[viewDate.getMonth()]}
            </button>
            <span className="calendar-widget__display-day">
              {(selectedDate || today).getDate()},
            </span>
            <button
              type="button"
              className={["calendar-widget__display-trigger", pickerMode === "year" ? "is-open" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setPickerMode((currentMode) => (currentMode === "year" ? null : "year"))}
            >
              {viewDate.getFullYear()}
            </button>
          </h2>
        </div>
        {selectedDate ? (
          <button type="button" className="calendar-widget__clear" onClick={onClearDate}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="calendar-widget">
        <div className="calendar-widget__header">
          <span className="calendar-widget__header-label">Select a day</span>

          <div className="calendar-widget__controls">
            <button type="button" aria-label="Previous month" onClick={onPreviousMonth}>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Next month" onClick={onNextMonth}>
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        {pickerMode === "month" ? (
          <div className="calendar-widget__picker-grid">
            {MONTH_NAMES.map((monthName, monthIndex) => (
              <button
                key={monthName}
                type="button"
                className={[
                  "calendar-widget__picker-option",
                  viewDate.getMonth() === monthIndex ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  onSelectMonth(monthIndex);
                  setPickerMode(null);
                }}
              >
                {monthName}
              </button>
            ))}
          </div>
        ) : null}

        {pickerMode === "year" ? (
          <div className="calendar-widget__picker-grid calendar-widget__picker-grid--years">
            {yearOptions.map((yearValue) => (
              <button
                key={yearValue}
                type="button"
                className={[
                  "calendar-widget__picker-option",
                  viewDate.getFullYear() === yearValue ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  onSelectYear(yearValue);
                  setPickerMode(null);
                }}
              >
                {yearValue}
              </button>
            ))}
          </div>
        ) : null}

        <div className="calendar-widget__weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-widget__grid">
          {days.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="calendar-widget__cell calendar-widget__cell--empty" />;
            }

            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const hasReports = reportDates.some((reportDate) => isSameDay(reportDate, day));

            return (
              <button
                key={day.toISOString()}
                type="button"
                className={[
                  "calendar-widget__cell",
                  isSelected ? "is-selected" : "",
                  isToday ? "is-today" : "",
                  hasReports ? "has-reports" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectDate(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CalendarWidget;
