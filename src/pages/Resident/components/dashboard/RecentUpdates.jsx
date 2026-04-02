import React from 'react';
import '../../styles/ResidentDashboard.css';
import { normalizeReportStatus } from '../../../../utils/reportUtils';

const STATUS_COLORS = {
  Pending:      { bg: '#fef3c7', text: '#d97706' },
  'In Progress':{ bg: '#dbeafe', text: '#2563eb' },
  Resolved:     { bg: '#dcfce7', text: '#16a34a' },
};

/**
 * RecentUpdates
 * Props:
 *  - updates   {Array}    Array of { category, action, status, tag }
 *  - onView    {Function} Called when the "View" button is clicked
 *  - onItemClick {Function} Called with item when a row is clicked
 */
export default function RecentUpdates({ updates = [], onView, onItemClick }) {
  return (
    <div className="res-updates">
      <div className="res-updates__header">
        <div className="res-updates__title">Recent Updates</div>
        <button className="res-updates__view-btn" onClick={onView}>
          View
        </button>
      </div>
      <div className="res-updates__sub">Latest changes from your submissions.</div>

      {updates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 14 }}>
          No recent updates yet.
        </div>
      ) : (
        updates.map((u, i) => {
          const status = normalizeReportStatus(u.status);
          const colors = STATUS_COLORS[status] || STATUS_COLORS['Pending'];
          return (
            <div
              key={i}
              className="res-update-item"
              onClick={() => onItemClick && onItemClick(u)}
            >
              <div className="res-update-item__category">{u.category}</div>
              <div className="res-update-item__action">{u.action}</div>
              <div className="res-update-item__tags">
                <span
                  className="res-update-item__tag"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {status}
                </span>
                <span
                  className="res-update-item__tag"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  {u.tag}
                </span>
                <span className="res-update-item__chevron">›</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}