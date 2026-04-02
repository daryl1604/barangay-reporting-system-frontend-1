import React from 'react';
import { normalizeReportStatus } from '../../../../utils/reportUtils';

const statusColors = {
  Pending: { bg: '#fef3c7', text: '#d97706' },
  'In Progress': { bg: '#dbeafe', text: '#2563eb' },
  Resolved: { bg: '#dcfce7', text: '#16a34a' },
};

export default function ReportCard({ report, onClick }) {
  const status = normalizeReportStatus(report.status);
  const colors = statusColors[status] || statusColors['Pending'];

  return (
    <div className="report-card" onClick={() => onClick(report)}>
      <div className="report-card__header">
        <div className="report-card__title">{report.category}</div>
      </div>
      <div className="report-card__meta">
        {report.dateFiled} • {report.location}
      </div>
      <div className="report-card__desc">{report.description}</div>
      <div className="report-card__footer">
        <span className="report-card__badge" style={{ background: colors.bg, color: colors.text }}>
          {status}
        </span>
        <span className="report-card__tag">{report.category}</span>
        <span className="report-card__arrow">›</span>
      </div>
    </div>
  );
}