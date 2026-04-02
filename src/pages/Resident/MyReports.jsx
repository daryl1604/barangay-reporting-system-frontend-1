import React, { useState, useEffect } from 'react';
import './styles/MyReports.css';
import ResidentLayout from './components/layout/ResidentLayout';
import ReportCard from './components/reports/ReportCard';
import ReportModal from './components/reports/ReportModal';
import API from '../../api/axios';
import { normalizeReportPayload } from '../../utils/reportUtils';

const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const filtered = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  return (
    <ResidentLayout activePage="reports">
      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      <div className="my-reports__header">
        <div className="my-reports__label">MY REPORTS</div>
        <div className="my-reports__title">Only your submitted reports are shown here.</div>
        <div className="my-reports__sub">Residents can review status, admin comments, and complaint details.</div>
        <div className="my-reports__filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`my-reports__filter-btn${filter === f ? ' my-reports__filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="my-reports__card-section">
        <div className="my-reports__section-title">Report Cards</div>
        <div className="my-reports__section-sub">Click any card to open the detailed resident view.</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            Loading your reports...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            No {filter !== 'All' ? filter.toLowerCase() : ''} reports found.
          </div>
        ) : (
          <div className="my-reports__grid">
            {filtered.map(r => (
              <ReportCard key={r.id} report={r} onClick={setSelectedReport} />
            ))}
          </div>
        )}
      </div>
    </ResidentLayout>
  );
}