import CalendarWidget from "../dashboard/CalendarWidget";
import { formatDateTime } from "../../../../utils/dateUtils";
import { getResidentName, getStatusLabel } from "../../../../utils/filterUtils";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3.75A2.25 2.25 0 0 0 6.75 6H4.5a.75.75 0 0 0 0 1.5h.8l.74 10.38A2.25 2.25 0 0 0 8.29 20h7.42a2.25 2.25 0 0 0 2.25-2.12l.74-10.38h.8a.75.75 0 0 0 0-1.5h-2.25A2.25 2.25 0 0 0 15 3.75H9Zm0 1.5h6A.75.75 0 0 1 15.75 6h-7.5A.75.75 0 0 1 9 5.25Zm.22 4.03a.75.75 0 0 1 .75.7l.25 6a.75.75 0 1 1-1.5.06l-.25-6a.75.75 0 0 1 .7-.76h.05Zm5.56 0a.75.75 0 0 1 .7.76l-.25 6a.75.75 0 1 1-1.5-.06l.25-6a.75.75 0 0 1 .75-.7h.05ZM12 9.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 12 9.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AdminSidebar({
  reports,
  selectedDate,
  viewDate,
  reportDates,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  onClearDate,
  onViewReport,
  onDeleteReport,
  deletingReportId,
}) {
  return (
    <aside className="dashboard-sidebar">
      <CalendarWidget
        viewDate={viewDate}
        selectedDate={selectedDate}
        reportDates={reportDates}
        onSelectDate={onSelectDate}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
        onSelectMonth={onSelectMonth}
        onSelectYear={onSelectYear}
        onClearDate={onClearDate}
      />

      <section className="dashboard-panel dashboard-panel--split">
        <div className="reports-section__header reports-section__header--sticky">
          <div>
            <h2>Recent Requests</h2>
            <p>Persistent list of pending and recent reports that need admin attention.</p>
          </div>
        </div>

        <div className="dashboard-panel__scroll-area">
          <div className="sidebar-report-list">
            {reports.length === 0 ? (
              <p className="dashboard-empty-state">No recent requests available.</p>
            ) : (
              reports.map((report) => (
                <article key={report._id} className="sidebar-report-card">
                  <div className="sidebar-report-card__avatar">
                    {getResidentName(report).slice(0, 1).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    className="sidebar-report-card__main"
                    onClick={() => onViewReport(report)}
                  >
                    <div className="sidebar-report-card__content">
                      <strong>{getResidentName(report)}</strong>
                      <span>{report.category}</span>
                      <span>{formatDateTime(report.createdAt)}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="sidebar-report-card__delete"
                    aria-label="Delete report"
                    title="Delete report"
                    disabled={deletingReportId === report._id}
                    onClick={() => onDeleteReport(report)}
                  >
                    <TrashIcon />
                  </button>
                  <span className={`report-status report-status--${report.status}`}>
                    {getStatusLabel(report.status)}
                  </span>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </aside>
  );
}

export default AdminSidebar;
