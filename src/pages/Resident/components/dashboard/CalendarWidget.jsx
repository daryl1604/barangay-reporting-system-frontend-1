import React from 'react';
import '../../styles/ResidentDashboard.css';
import { buildCalendarDays, isSameDay } from '../../../../utils/dateUtils';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarWidget({
  viewDate,
  selectedDate,
  reportDates = [],
  onSelectDate,
  onClearDate,
  onPreviousMonth,
  onNextMonth,
}) {
  const today = new Date();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const cells = buildCalendarDays(viewDate);

  return (
    <div className="res-calendar">
      <div className="res-calendar__header">
        <div>
          <div className="res-calendar__label">CALENDAR</div>
          <div className="res-calendar__month">
            {monthName} {viewDate.getFullYear()}
          </div>
        </div>
        {selectedDate ? (
          <button className="res-calendar__reset" type="button" onClick={onClearDate}>
            Reset
          </button>
        ) : null}
      </div>

      <div className="res-calendar__controls">
        <button className="res-calendar__control" type="button" onClick={onPreviousMonth}>
          ‹
        </button>
        <button className="res-calendar__control" type="button" onClick={onNextMonth}>
          ›
        </button>
      </div>

      <div className="res-calendar__grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="res-calendar__day-name">
            {d}
          </div>
        ))}

        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} className="res-calendar__day res-calendar__day--empty" />
          ) : (
            <button
              key={day.toISOString()}
              type="button"
              className={`res-calendar__day${
                isSameDay(day, today) ? ' res-calendar__day--today' : ''
              }${
                selectedDate && isSameDay(day, selectedDate) ? ' res-calendar__day--selected' : ''
              }${
                reportDates.some((reportDate) => isSameDay(reportDate, day)) ? ' res-calendar__day--has-report' : ''
              }`}
              onClick={() => onSelectDate(day)}
            >
              {day.getDate()}
            </button>
          )
        )}
      </div>
    </div>
  );
}
