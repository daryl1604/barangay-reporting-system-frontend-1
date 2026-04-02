import React from 'react';
import '../../styles/MyReports.css';
import { normalizeReportStatus } from '../../../../utils/reportUtils';

const statusColors = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
};

export default function ReportModal({ report, onClose }) {
  if (!report) return null;

  const adminFeedback = report.adminFeedback || [];
  const status = normalizeReportStatus(report.status);

  return (
    <div className="report-modal__overlay" onClick={onClose}>
      <div className="report-modal__box" onClick={e => e.stopPropagation()}>
        <div className="report-modal__header">
          <div>
            <h2 className="report-modal__title">{report.category}</h2>
            <span
              className="report-modal__status-badge"
              style={{ background: `${statusColors[status]}22`, color: statusColors[status] }}
            >
              {status}
            </span>
          </div>
          <button className="report-modal__close" onClick={onClose}>Close</button>
        </div>

        <div className="report-modal__grid">
          <div className="report-modal__field">
            <div className="report-modal__field-label">Reference No.</div>
            <div className="report-modal__field-value">{report.referenceNo}</div>
          </div>
          <div className="report-modal__field">
            <div className="report-modal__field-label">Purok</div>
            <div className="report-modal__field-value">{report.purok}</div>
          </div>
          <div className="report-modal__field">
            <div className="report-modal__field-label">Date Filed</div>
            <div className="report-modal__field-value">{report.dateFiled}</div>
          </div>
          <div className="report-modal__field">
            <div className="report-modal__field-label">Resident</div>
            <div className="report-modal__field-value">{report.resident}</div>
          </div>
        </div>

        <div className="report-modal__field report-modal__field--full">
          <div className="report-modal__field-label">Location</div>
          <div className="report-modal__field-value">{report.location}</div>
        </div>

        <div className="report-modal__section">
          <div className="report-modal__section-label">DESCRIPTION</div>
          <div className="report-modal__section-body">{report.description}</div>
        </div>

        {report.personInvolved && (
          <div className="report-modal__section">
            <div className="report-modal__section-label">PERSON INVOLVED</div>
            <div className="report-modal__section-body">{report.personInvolved}</div>
          </div>
        )}

        <div className="report-modal__section">
          <div className="report-modal__section-header">
            <div className="report-modal__section-label">BARANGAY ADMIN FEEDBACK</div>
            <div className="report-modal__section-count">{adminFeedback.length} total</div>
          </div>
          {adminFeedback.length === 0 ? (
            <div className="report-modal__no-feedback">
              <div className="report-modal__no-feedback-title">No comments yet</div>
              <div className="report-modal__no-feedback-desc">
                The barangay admin has not posted feedback on this report yet.
              </div>
            </div>
          ) : (
            adminFeedback.map((fb, i) => (
              <div key={i} className="report-modal__feedback-item">
                <div className="report-modal__feedback-author">{fb.author}</div>
                <div className="report-modal__feedback-text">{fb.text}</div>
                {fb.date && <div className="report-modal__feedback-date">{fb.date}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}