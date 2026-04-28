import React, { useState } from 'react';
import './styles/Settings.css';
import ResidentLayout from './components/layout/ResidentLayout';
import { readNotificationPrefs, saveNotificationPrefs } from '../../utils/notificationPrefs';

function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-switch__slider" />
    </label>
  );
}

export default function Settings() {
  const [prefs, setPrefs] = useState(readNotificationPrefs());
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSuccess, setPwSuccess] = useState(false);

  const setPref = (key, val) => {
    const nextPrefs = saveNotificationPrefs({ ...prefs, [key]: val });
    setPrefs(nextPrefs);

    if (key === 'badgeVisible' && !val) {
      window.alert('Notification badge will be hidden');
    }

    window.dispatchEvent(new CustomEvent('resident-notifications-updated'));
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwords.current) errs.current = 'Current password is required.';
    if (!passwords.newPass) errs.newPass = 'New password is required.';
    else if (passwords.newPass.length < 8) errs.newPass = 'Password must be at least 8 characters.';
    if (!passwords.confirm) errs.confirm = 'Please confirm your new password.';
    else if (passwords.confirm !== passwords.newPass) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handlePasswordSave = () => {
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      return;
    }

    setPwSuccess(true);
    setShowPasswordForm(false);
    setPasswords({ current: '', newPass: '', confirm: '' });
    setPwErrors({});
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent('resident-request-logout'));
  };

  return (
    <ResidentLayout activePage="settings">
      {pwSuccess && (
        <div className="submit-report__toast" style={{ background: '#22c55e' }}>
          Password updated successfully.
        </div>
      )}

      <div className="settings__header">
        <div className="settings__label">SETTINGS</div>
        <div className="settings__title">Notification, privacy, and account controls.</div>
        <div className="settings__sub">Resident settings screen added from the left dashboard navigation.</div>
      </div>

      <div className="settings__grid">
        <div className="settings__card settings__card--wide">
          <div className="settings__card-title">Notification Preferences, Privacy and Security</div>
          <div className="settings__card-sub">Your resident alerts and account controls now live in one container.</div>

          <div className="settings__toggle-row">
            <div>
              <div className="settings__toggle-label">Status update alerts</div>
              <div className="settings__toggle-desc">If on, status updates continue appearing in your resident notifications.</div>
            </div>
            <ToggleSwitch checked={prefs.statusAlerts} onChange={v => setPref('statusAlerts', v)} />
          </div>

          <div className="settings__toggle-row">
            <div>
              <div className="settings__toggle-label">Admin alerts</div>
              <div className="settings__toggle-desc">If on, admin comments and alerts continue appearing in your resident notifications.</div>
            </div>
            <ToggleSwitch checked={prefs.adminAlerts} onChange={v => setPref('adminAlerts', v)} />
          </div>

          <div className="settings__toggle-row">
            <div>
              <div className="settings__toggle-label">Notification badge</div>
              <div className="settings__toggle-desc">If on, the unread badge stays visible in the top bar until notifications are read or removed.</div>
            </div>
            <ToggleSwitch checked={prefs.badgeVisible} onChange={v => setPref('badgeVisible', v)} />
          </div>

          <div className="settings__privacy-item">
            <div>
              <div className="settings__privacy-label">Change Password</div>
              <div className="settings__privacy-desc">Update your password regularly for account protection.</div>
              {showPasswordForm && (
                <div className="settings__pw-form">
                  {['current', 'newPass', 'confirm'].map(k => (
                    <div key={k}>
                      <input
                        type="password"
                        className={`submit-report__input${pwErrors[k] ? ' submit-report__input--error' : ''}`}
                        placeholder={k === 'current' ? 'Current password' : k === 'newPass' ? 'New password (min 8 chars)' : 'Confirm new password'}
                        value={passwords[k]}
                        onChange={e => {
                          setPasswords(p => ({ ...p, [k]: e.target.value }));
                          if (pwErrors[k]) setPwErrors(p => ({ ...p, [k]: '' }));
                        }}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                      {pwErrors[k] && <div className="submit-report__error-text">{pwErrors[k]}</div>}
                    </div>
                  ))}
                  <div className="settings__pw-actions">
                    <button className="submit-report__btn-submit" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handlePasswordSave}>
                      Save
                    </button>
                    <button className="submit-report__btn-draft" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => { setShowPasswordForm(false); setPwErrors({}); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!showPasswordForm && (
              <button className="settings__privacy-btn" onClick={() => setShowPasswordForm(true)}>Edit</button>
            )}
          </div>

          <div className="settings__privacy-item">
            <div>
              <div className="settings__privacy-label">Logout</div>
              <div className="settings__privacy-desc">Return to the sign in and sign up screens.</div>
            </div>
            <button className="settings__privacy-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </ResidentLayout>
  );
}
