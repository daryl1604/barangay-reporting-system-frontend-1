import React, { useEffect, useState } from 'react';
import './styles/Profile.css';
import ResidentLayout from './components/layout/ResidentLayout';
import API from '../../api/axios';
import { normalizeReportPayload } from '../../utils/reportUtils';
import { normalizeResidentUser } from '../../utils/userUtils';
import { isNotificationVisible, readNotificationPrefs } from '../../utils/notificationPrefs';
import { PUROK_OPTIONS } from '../../constants/puroks';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', contactNumber: '', purokNumber: PUROK_OPTIONS[0], age: '', gender: '' });
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const syncUserState = (rawUser) => {
    const normalizedUser = normalizeResidentUser(rawUser);
    setUser(normalizedUser);
    setForm({
      name: normalizedUser?.name || '',
      contactNumber: normalizedUser?.contactNumber || '',
      purokNumber: normalizedUser?.purokNumber || PUROK_OPTIONS[0],
      age: normalizedUser?.age || '',
      gender: normalizedUser?.gender || '',
    });
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      syncUserState(JSON.parse(saved));
    }

    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [reportsRes, notificationsRes] = await Promise.all([
        API.get('/reports/my'),
        API.get('/notifications'),
      ]);
      setReports(normalizeReportPayload(reportsRes.data));
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'R';
  const resolved = reports.filter(r => r.status === 'Resolved').length;
  const visibleUnreadNotifications = notifications.filter(
    (notification) => !notification.read && isNotificationVisible(notification, readNotificationPrefs())
  ).length;

  const fields = [
    { label: 'Full Name', value: user?.fullName || 'Not provided', editable: 'name' },
    { label: 'Email', value: user?.email || 'Not provided' },
    { label: 'Mobile Number', value: user?.mobile || 'Not provided', editable: 'contactNumber' },
    { label: 'Purok', value: user?.purok || 'Not provided', editable: 'purokNumber' },
    { label: 'Age', value: user?.age || 'Not provided', editable: 'age' },
    { label: 'Gender', value: user?.gender || 'Not provided', editable: 'gender' },
    { label: 'Account Type', value: 'Resident' },
    { label: 'Member Since', value: user?.memberSince || 'Not available' },
  ];

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent('resident-request-logout'));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      const response = await API.put('/auth/me', {
        name: form.name.trim(),
        contactNumber: form.contactNumber.trim(),
        purokNumber: form.purokNumber,
        age: form.age,
        gender: form.gender.trim(),
      });

      syncUserState(response.data.user);
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('resident-user-updated'));
    } catch (err) {
      console.error(err);
      setSaveError(err?.response?.data?.msg || 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResidentLayout activePage="profile">
      <div className="profile__hero">
        <div className="profile__hero-left">
          <div className="profile__hero-avatar">{initials}</div>
          <div>
            <div className="profile__hero-label">USER PROFILE</div>
            <div className="profile__hero-name">{user?.fullName || 'Resident Account'}</div>
            <div className="profile__hero-sub">Resident account preview linked from the top profile card.</div>
          </div>
        </div>
        <button className="profile__hero-logout" onClick={handleLogout}>Log Out</button>
      </div>

      <div className="profile__grid">
        <div className="profile__info-card">
          <div className="profile__info-header">
            <div>
              <div className="profile__info-title">Personal Information</div>
              <div className="profile__info-sub">Resident details displayed in the same card style.</div>
            </div>
            <button
              className="profile__edit-btn"
              type="button"
              onClick={() => {
                if (isEditing && user) {
                  syncUserState(user);
                }
                setIsEditing((currentValue) => !currentValue);
                setSaveError('');
              }}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="profile__fields-grid">
            {fields.map(f => (
              <div key={f.label} className="profile__field">
                <div className="profile__field-label">{f.label}</div>
                {isEditing && f.editable ? (
                  f.editable === 'purokNumber' ? (
                    <select
                      className="profile__field-input"
                      value={form[f.editable]}
                      onChange={(event) => setForm((currentForm) => ({ ...currentForm, [f.editable]: event.target.value }))}
                    >
                      {PUROK_OPTIONS.map((purokOption) => (
                        <option key={purokOption} value={purokOption}>{purokOption}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="profile__field-input"
                      type={f.editable === 'age' ? 'number' : 'text'}
                      value={form[f.editable]}
                      onChange={(event) => setForm((currentForm) => ({ ...currentForm, [f.editable]: event.target.value }))}
                    />
                  )
                ) : (
                  <div className="profile__field-value">{f.value}</div>
                )}
              </div>
            ))}
          </div>
          {isEditing ? (
            <div className="profile__edit-actions">
              <button className="profile__save-btn" type="button" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : null}
          {saveError ? <div className="profile__save-error">{saveError}</div> : null}
        </div>

        <div className="profile__summary-card">
          <div className="profile__summary-title">Resident Summary</div>
          <div className="profile__summary-sub">Visual account snapshot for the user profile screen.</div>
          {[
            { label: 'Total Reports', value: reports.length },
            { label: 'Resolved Reports', value: resolved },
            { label: 'Unread Notifications', value: visibleUnreadNotifications },
          ].map(s => (
            <div key={s.label} className="profile__summary-item">
              <div className="profile__summary-label">{s.label}</div>
              <div className="profile__summary-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </ResidentLayout>
  );
}
