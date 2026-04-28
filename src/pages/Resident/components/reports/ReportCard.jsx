import React from 'react';
import { normalizeReportStatus } from '../../../../utils/reportUtils';

const statusColors = {
  Pending: { bg: '#fef3c7', text: '#d97706' },
  'In Progress': { bg: '#dbeafe', text: '#2563eb' },
  Resolved: { bg: '#dcfce7', text: '#16a34a' },
};

export default function ReportCard({ report, onClick }) {
  const status = normalizeReportStatus(report.status);
  const colors = statusColors[status] || statusColors.Pending;

  return (
    <div className="report-card" onClick={() => onClick(report)}>
      <div
        className="report-card__accent"
        style={{ background: `linear-gradient(90deg, ${colors.text} 0%, ${colors.bg} 100%)` }}
      />
      <div className="report-card__header">
        <div className="report-card__title">{report.category}</div>
      </div>
      <div className="report-card__meta">
        <span>{report.dateFiled}</span>
        <span>{report.location}</span>
      </div>
      <div className="report-card__desc">{report.description}</div>
      <div className="report-card__footer">
        <span className="report-card__badge" style={{ background: colors.bg, color: colors.text }}>
          {status}
        </span>
        <span className="report-card__tag">{report.category}</span>
        <span className="report-card__arrow" aria-hidden="true">&#8250;</span>
      </div>
    </div>
  );
}
