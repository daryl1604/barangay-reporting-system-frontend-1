import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ResidentDashboard.css';
import ResidentLayout from './components/layout/ResidentLayout';
import API from '../../api/axios';
import { normalizeReportPayload } from '../../utils/reportUtils';
import { isNotificationVisible, readNotificationPrefs } from '../../utils/notificationPrefs';
import { isSameDay, toDate } from '../../utils/dateUtils';

// Sub-components
import MetricCard        from './components/dashboard/MetricCard';
import ReportPreviewCard from './components/dashboard/ReportPreviewCard';
import CalendarWidget    from './components/dashboard/CalendarWidget';
import RecentUpdates     from './components/dashboard/RecentUpdates';
import ReportModal       from './components/reports/ReportModal';

export default function ResidentDashboard() {
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const reportsGridRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [reportsRes, notificationsRes] = await Promise.all([
        API.get('/reports/my'),
        API.get('/notifications'),
      ]);
      setReports(normalizeReportPayload(reportsRes.data));
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
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

  const updateReportInState = (nextReport) => {
    setReports((currentReports) => currentReports.map((report) => (
      report.id === nextReport.id || report._id === nextReport._id ? { ...report, ...nextReport } : report
    )));
    setSelectedReport(nextReport);
  };

  const filteredReports = selectedDate
    ? reports.filter((report) => isSameDay(toDate(report.createdAt || report.incidentDate), selectedDate))
    : reports;
  const reportDates = reports.map((report) => toDate(report.createdAt || report.incidentDate)).filter(Boolean);
  const prefs = readNotificationPrefs();
  const recentUpdates = notifications
    .filter((notification) => isNotificationVisible(notification, prefs))
    .slice(0, 4)
    .map((notification) => {
      const linkedReport = reports.find((report) => report.id === notification.report || report._id === notification.report);

      return {
        id: notification._id,
        category: linkedReport?.category || 'Report Update',
        action: notification.title || notification.message || 'Notification',
        status: linkedReport?.status || 'Pending',
        tag: linkedReport?.purok || 'Update',
        reportId: linkedReport?.id || linkedReport?._id || notification.report,
      };
    });

  useLayoutEffect(() => {
    const syncPreviewCardHeights = () => {
      const gridElement = reportsGridRef.current;
      if (!gridElement) {
        return;
      }

      const cardElements = Array.from(gridElement.querySelectorAll('.res-preview-card'));
      if (cardElements.length === 0) {
        return;
      }

      cardElements.forEach((cardElement) => {
        cardElement.style.height = 'auto';
      });

      const maxHeight = Math.max(...cardElements.map((cardElement) => cardElement.offsetHeight));

      cardElements.forEach((cardElement) => {
        cardElement.style.height = `${maxHeight}px`;
      });
    };

    syncPreviewCardHeights();
    window.addEventListener('resize', syncPreviewCardHeights);

    return () => {
      window.removeEventListener('resize', syncPreviewCardHeights);
    };
  }, [filteredReports, loading]);

  return (
    <ResidentLayout activePage="dashboard">
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onReportUpdate={updateReportInState}
        />
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
              {selectedDate ? 'Reports filed on the selected date.' : 'Short overview of your open and recently resolved complaints.'}
            </div>
            {loading ? (
              <div className="res-dashboard__empty">Loading your reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="res-dashboard__empty">No reports found for the selected date.</div>
            ) : (
              <div className="res-dashboard__reports-grid" ref={reportsGridRef}>
                {filteredReports.slice(0, 6).map((r) => (
                  <ReportPreviewCard key={r.id} report={r} onClick={setSelectedReport} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="res-dashboard__right">
          <CalendarWidget
            viewDate={viewDate}
            selectedDate={selectedDate}
            reportDates={reportDates}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
            onClearDate={() => setSelectedDate(null)}
            onPreviousMonth={() => setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            onNextMonth={() => setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          />
          <RecentUpdates
            updates={recentUpdates}
            onView={() => navigate('/notifications')}
            onItemClick={(item) => {
              const report = reports.find((entry) => entry.id === item.reportId || entry._id === item.reportId);

              if (report) {
                setSelectedReport(report);
              }
            }}
          />
        </div>
      </div>
    </ResidentLayout>
  );
}
