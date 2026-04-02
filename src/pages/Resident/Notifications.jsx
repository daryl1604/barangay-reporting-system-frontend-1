import React, { useState, useEffect } from 'react';
import './styles/Notifications.css';
import ResidentLayout from './components/layout/ResidentLayout';
import NotificationItem from './components/notifications/NotificationItem';
import ReportModal from './components/reports/ReportModal';
import API from '../../api/axios';

const normalizeNotifications = (payload) => {
  const notifications = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.notifications)
      ? payload.notifications
      : [];

  return notifications.map(notification => ({
    ...notification,
    title: notification.title || notification.message || notification.subject || 'Notification',
    description: notification.description || notification.message || notification.body || '',
    date: notification.date || notification.createdAt || notification.timestamp || '',
    unread: typeof notification.unread === 'boolean' ? notification.unread : !notification.read,
  }));
};

const resolveReportPayload = (payload) => {
  const reports = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.reports)
      ? payload.reports
      : [];

  return reports.map(report => ({ ...report, id: report.id || report._id }));
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, reportsRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/reports/my'),
      ]);

      setNotifications(normalizeNotifications(notifRes.data));
      setReports(resolveReportPayload(reportsRes.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotifClick = (notif) => {
    if (notif.reportId) {
      const report = reports.find(r => r.id === notif.reportId);
      if (report) setSelectedReport(report);
    }
  };

  return (
    <ResidentLayout activePage="notifications" unreadCount={unreadCount}>
      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      <div className="notifications__header">
        <div className="notifications__label">NOTIFICATIONS</div>
        <div className="notifications__title">Status updates and admin comments.</div>
        <div className="notifications__sub">Bell icon preview expanded into a full resident notification center.</div>
      </div>

      <div className="notifications__feed-card">
        <div className="notifications__feed-header">
          <div className="notifications__feed-title">Notification Feed</div>
          {unreadCount > 0 && (
            <span className="notifications__badge">{unreadCount} new</span>
          )}
        </div>
        <div className="notifications__feed-sub">Each item is clickable and opens the report detail modal.</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            No notifications yet.
          </div>
        ) : (
          notifications.map((n, i) => (
            <NotificationItem
              key={i}
              notification={n}
              isUnread={n.unread}
              onClick={handleNotifClick}
            />
          ))
        )}
      </div>
    </ResidentLayout>
  );
}