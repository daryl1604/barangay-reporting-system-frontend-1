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

function ReportCardAdmin({
  report,
  onView,
  onStatusChange,
  onDelete,
  statusUpdating,
  deletePending,
  showDescription = true,
}) {
  const statusLabel = getStatusLabel(report.status);
  const isUpdating = Boolean(statusUpdating);
  const isOngoing = report.status === "in_progress";
  const isResolved = report.status === "resolved";
  const description = report.description || "No description provided.";

  return (
    <article
      className={[
        "report-card",
        !showDescription ? "report-card--compact" : "",
        isUpdating ? "report-card--updating" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onView(report)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(report);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="report-card__header">
        <p className="report-card__resident">{getResidentName(report)}</p>
        <div className="report-card__header-actions">
          <span
            className={[
              `report-status report-status--${report.status}`,
              isUpdating ? "report-status--animating" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isUpdating ? "Updating..." : statusLabel}
          </span>
          <button
            type="button"
            className="report-card__delete"
            aria-label="Delete report"
            title="Delete report"
            disabled={deletePending}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(report);
            }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="report-card__heading">
        <h3>{report.category}</h3>
      </div>

      <div className="report-card__meta">
        <span>{formatDateTime(report.createdAt)}</span>
        <span>Purok {report.purok || "N/A"}</span>
      </div>

      <div className="report-card__body">
        {showDescription ? (
          <div className="report-card__description-block">
            <p className="report-card__description report-card__description--clamped">{description}</p>
          </div>
        ) : null}
        <p className="report-card__location">{report.location || "Location unavailable"}</p>
      </div>

      <div className="report-card__actions">
        <button
          type="button"
          className="report-action-button report-action-button--ghost"
          onClick={(event) => {
            event.stopPropagation();
            onView(report);
          }}
        >
          View Report
        </button>
        <button
          type="button"
          className={[
            "report-action-button",
            "report-action-button--blue",
            isOngoing ? "report-action-button--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={isUpdating || isOngoing}
          onClick={(event) => {
            event.stopPropagation();
            onStatusChange(report._id, "in_progress");
          }}
        >
          {isUpdating && statusUpdating === "in_progress"
            ? "Updating..."
            : isOngoing
              ? "Ongoing"
              : "Mark as Ongoing"}
        </button>
        <button
          type="button"
          className={[
            "report-action-button",
            "report-action-button--green",
            isResolved ? "report-action-button--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={isUpdating || isResolved}
          onClick={(event) => {
            event.stopPropagation();
            onStatusChange(report._id, "resolved");
          }}
        >
          {isUpdating && statusUpdating === "resolved"
            ? "Updating..."
            : isResolved
              ? "Resolved"
              : "Mark as Resolved"}
        </button>
      </div>
    </article>
  );
}

export default ReportCardAdmin;
