import React from 'react';
import '../../styles/ResidentDashboard.css';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarWidget() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });

  // Build grid cells: leading nulls + day numbers
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="res-calendar">
      <div className="res-calendar__label">CALENDAR</div>
      <div className="res-calendar__month">
        {monthName} {year}
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
            <div
              key={day}
              className={`res-calendar__day${
                day === today.getDate() ? ' res-calendar__day--today' : ''
              }`}
            >
              {day}
            </div>
          )
        )}
      </div>
    </div>
  );
}