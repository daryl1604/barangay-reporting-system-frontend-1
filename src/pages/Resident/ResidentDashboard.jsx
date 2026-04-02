import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ResidentDashboard.css';
import ResidentLayout from './components/layout/ResidentLayout';
import API from '../../api/axios';
import { normalizeReportPayload } from '../../utils/reportUtils';

// Sub-components
import MetricCard        from './components/dashboard/MetricCard';
import ReportPreviewCard from './components/dashboard/ReportPreviewCard';
import CalendarWidget    from './components/dashboard/CalendarWidget';
import RecentUpdates     from './components/dashboard/RecentUpdates';
import ReportModal       from './components/reports/ReportModal';

export default function ResidentDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
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

  const total      = reports.length;
  const pending    = reports.filter((r) => r.status === 'Pending').length;
  const inProgress = reports.filter((r) => r.status === 'In Progress').length;
  const resolved   = reports.filter((r) => r.status === 'Resolved').length;

  const recentUpdates = [
    { category: 'Noise Complaint',    action: 'Admin comment added',          status: 'In Progress', tag: 'Noise Complaint'    },
    { category: 'Public Disturbance', action: 'Status updated to In Progress', status: 'In Progress', tag: 'Public Disturbance' },
    { category: 'Broken Streetlight', action: 'Status updated to Resolved',    status: 'Resolved',    tag: 'Streetlight'        },
    { category: 'Trash Complaint',    action: 'Report received',               status: 'Pending',     tag: 'Trash'              },
  ];

  return (
    <ResidentLayout activePage="dashboard">
      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      <div className="res-dashboard">
        {/* Main column */}
        <div>
          <div className="res-dashboard__hero">
            <div className="res-dashboard__hero-label">RESIDENT DASHBOARD</div>
            <div className="res-dashboard__hero-title">Resident Reporting Dashboard</div>
            <div className="res-dashboard__hero-sub">
              Submit concerns, track progress, and receive barangay feedback in one private resident workspace.
            </div>
            <div className="res-dashboard__metrics">
              <MetricCard label="Total Reports" value={total}      />
              <MetricCard label="Pending"        value={pending}    />
              <MetricCard label="In Progress"    value={inProgress} />
              <MetricCard label="Resolved"       value={resolved}   />
            </div>
          </div>

          <div className="res-dashboard__reports">
            <div className="res-dashboard__reports-header">
              <div className="res-dashboard__reports-title">My Reports</div>
              <button
                className="res-dashboard__view-btn"
                onClick={() => navigate('/my-reports')}
                aria-label="View all reports"
              >›</button>
            </div>
            <div className="res-dashboard__reports-sub">
              Short overview of your open and recently resolved complaints.
            </div>
            <div className="res-dashboard__reports-grid">
              {reports.slice(0, 6).map((r) => (
                <ReportPreviewCard key={r.id} report={r} onClick={setSelectedReport} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="res-dashboard__right">
          <CalendarWidget />
          <RecentUpdates
            updates={recentUpdates}
            onView={() => navigate('/notifications')}
            onItemClick={() => navigate('/notifications')}
          />
        </div>
      </div>
    </ResidentLayout>
  );
}