import React, { useState, useEffect } from 'react';
import './styles/Notifications.css';
import ResidentLayout from './components/layout/ResidentLayout';
import NotificationItem from './components/notifications/NotificationItem';
import ReportModal from './components/reports/ReportModal';
import API from '../../api/axios';
import { deleteNotification, markNotificationAsRead } from '../../api/notifications';
import { normalizeReportPayload } from '../../utils/reportUtils';
import { isNotificationVisible, readNotificationPrefs } from '../../utils/notificationPrefs';

const normalizeNotifications = (payload) => {
  const notifications = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.notifications)
      ? payload.notifications
      : [];

  return notifications.map(notification => ({
    ...notification,
    id: notification.id || notification._id,
    title: notification.title || notification.message || notification.subject || 'Notification',
    description: notification.description || notification.message || notification.body || '',
    date: notification.date || notification.createdAt || notification.timestamp || '',
    reportId: notification.reportId || notification.report || '',
    unread: typeof notification.unread === 'boolean' ? notification.unread : !notification.read,
  }));
};

const resolveReportPayload = (payload) => {
  return normalizeReportPayload(payload);
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(readNotificationPrefs());

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handlePrefsUpdated = (event) => {
      setPrefs(event.detail || readNotificationPrefs());
    };

    window.addEventListener('resident-notification-prefs-updated', handlePrefsUpdated);
    return () => window.removeEventListener('resident-notification-prefs-updated', handlePrefsUpdated);
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

  const visibleNotifications = notifications.filter((notification) => isNotificationVisible(notification, prefs));
  const unreadCount = visibleNotifications.filter(n => n.unread).length;

  const handleNotifClick = async (notif) => {
    if (notif.unread) {
      try {
        await markNotificationAsRead(notif._id || notif.id);
        const nextNotifications = notifications.map((notification) => (
          (notification._id || notification.id) === (notif._id || notif.id)
            ? { ...notification, unread: false, read: true }
            : notification
        ));
        setNotifications(nextNotifications);
        window.dispatchEvent(new CustomEvent('resident-notifications-updated'));
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.reportId) {
      const report = reports.find(r => r.id === notif.reportId);
      if (report) setSelectedReport(report);
    }
  };

  const handleDeleteNotification = async (notif) => {
    try {
      await deleteNotification(notif._id || notif.id);
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => (notification._id || notification.id) !== (notif._id || notif.id))
      );
      window.dispatchEvent(new CustomEvent('resident-notifications-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportUpdate = (nextReport) => {
    setReports((currentReports) => currentReports.map((report) => (
      report.id === nextReport.id || report._id === nextReport._id ? { ...report, ...nextReport } : report
    )));
    setSelectedReport(nextReport);
  };

  return (
    <ResidentLayout activePage="notifications" unreadCount={unreadCount}>
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onReportUpdate={handleReportUpdate}
        />
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
        ) : visibleNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 15 }}>
            No notifications match your current settings.
          </div>
        ) : (
          visibleNotifications.map((n, i) => (
            <NotificationItem
              key={i}
              notification={n}
              isUnread={n.unread}
              onClick={handleNotifClick}
              onDelete={handleDeleteNotification}
            />
          ))
        )}
      </div>
    </ResidentLayout>
  );
}
