import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/History.css';
import ResidentLayout from './components/layout/ResidentLayout';
import ReportModal from './components/reports/ReportModal';
import API from '../../api/axios';
import { normalizeReportPayload, normalizeReportStatus } from '../../utils/reportUtils';

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#d97706' },
  'In Progress': { bg: '#dbeafe', text: '#2563eb' },
  Resolved: { bg: '#dcfce7', text: '#16a34a' },
};

export default function History() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/my');
      setReports(normalizeReportPayload(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusNotes = {
    Pending: 'Report submitted successfully. Awaiting barangay review.',
    'In Progress': 'Admin acknowledged the complaint. Barangay tanod scheduled to visit the area.',
    Resolved: 'Maintenance request logged. Issue has been resolved and verified.',
  };
  const handleReportUpdate = (nextReport) => {
    setReports((currentReports) => currentReports.map((report) => (
      report.id === nextReport.id || report._id === nextReport._id ? { ...report, ...nextReport } : report
    )));
    setSelectedReport(nextReport);
  };

  return (
    <ResidentLayout activePage="history">
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onReportUpdate={handleReportUpdate}
        />
      )}

      <div className="history__header">
        <div className="history__header-left">
          <div className="history__label">REPORT HISTORY</div>
          <div className="history__title">Full record of previous submissions and updates.</div>
          <div className="history__sub">This screen is linked from the dashboard history button and activity cards.</div>
        </div>
        <button className="history__new-btn" onClick={() => navigate('/submit-report')}>
          Create New Report
        </button>
      </div>

      <div className="history__timeline">
        <div className="history__timeline-title">History Timeline</div>
        <div className="history__timeline-sub">
          Grouped cards for filing dates, status changes, and barangay comments.
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            Loading history...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            No reports in history yet.
          </div>
        ) : (
          reports.map(r => {
            const status = normalizeReportStatus(r.status);
            const colors = STATUS_COLORS[status] || STATUS_COLORS['Pending'];
            return (
              <div key={r.id} className="history__item">
                <div className="history__item-header">
                  <div className="history__item-title">{r.category}</div>
                  <span
                    className="history__item-status"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {status}
                  </span>
                </div>
                <div className="history__item-tags">
                  <span className="history__item-tag">{r.dateFiled}</span>
                  <span className="history__item-tag">{r.referenceNo}</span>
                  <span className="history__item-tag">{r.purok}</span>
                </div>
                <div className="history__item-note">
                  {r.adminFeedback && r.adminFeedback.length > 0
                    ? r.adminFeedback[r.adminFeedback.length - 1].text
                    : statusNotes[status] || statusNotes['Pending']}
                </div>
                <button className="history__item-view-btn" onClick={() => setSelectedReport(r)}>
                  View
                </button>
              </div>
            );
          })
        )}
      </div>
    </ResidentLayout>
  );
}
