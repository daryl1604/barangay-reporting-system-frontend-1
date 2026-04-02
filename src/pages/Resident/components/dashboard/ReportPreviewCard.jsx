import React from 'react';
import '../../styles/ResidentDashboard.css';
import { normalizeReportStatus } from '../../../../utils/reportUtils';

const STATUS_COLORS = {
  Pending:       { bg: '#fef3c7', text: '#d97706' },
  'In Progress': { bg: '#dbeafe', text: '#2563eb' },
  Resolved:      { bg: '#dcfce7', text: '#16a34a' },
};

/**
 * ReportPreviewCard
 * A compact card used in the Dashboard "My Reports" preview grid.
 * For the full card used in MyReports screen, see components/reports/ReportCard.jsx
 *
 * Props:
 *  - report   {object}   Report object
 *  - onClick  {Function} Called with report when card is clicked
 */
export default function ReportPreviewCard({ report, onClick }) {
  const status = normalizeReportStatus(report.status);
  const colors = STATUS_COLORS[status] || STATUS_COLORS['Pending'];

  return (
    <div className="res-preview-card" onClick={() => onClick && onClick(report)}>
      <div className="res-preview-card__title">{report.category}</div>
      <div className="res-preview-card__meta">
        {report.dateFiled} • {report.location}
      </div>
      <div className="res-preview-card__desc">{report.description}</div>
      <div className="res-preview-card__footer">
        <span
          className="res-preview-card__badge"
          style={{ background: colors.bg, color: colors.text }}
        >
          {status}
        </span>
        <span className="res-preview-card__tag">{report.category}</span>
        <span className="res-preview-card__arrow">›</span>
      </div>
    </div>
  );
}