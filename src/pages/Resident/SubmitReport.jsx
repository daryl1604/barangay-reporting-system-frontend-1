import React, { useRef, useState } from 'react';
import './styles/SubmitReport.css';
import ResidentLayout from './components/layout/ResidentLayout';
import API from '../../api/axios';
import { PUROK_OPTIONS } from '../../constants/puroks';

const CATEGORIES = [
  'Trash Complaint',
  'Noise Complaint',
  'Broken Streetlight',
  'Drainage Concern',
  'Public Disturbance',
  'Water Leak',
  'Road Damage',
  'Other',
];

const GUIDE_ITEMS = [
  { title: 'Use the exact location', desc: 'Include landmarks, street name, or purok for faster barangay action.' },
  { title: 'Describe what happened', desc: 'State the issue clearly and mention who or what is involved when applicable.' },
  { title: 'Attach supporting proof', desc: 'Photos are optional but helpful for trash, drainage, and damaged property concerns.' },
  { title: 'Track updates privately', desc: 'Only your resident account and authorized barangay admins can view your report.' },
];

function validate(fields) {
  const errors = {};
  if (!fields.category) errors.category = 'Please select a category.';
  if (!fields.purok) errors.purok = 'Please select your purok.';
  if (!fields.location.trim()) errors.location = 'Location is required.';
  else if (fields.location.trim().length < 5) errors.location = 'Please provide a more specific location.';
  if (!fields.date) errors.date = 'Date of incident is required.';
  if (!fields.description.trim()) errors.description = 'Description is required.';
  else if (fields.description.trim().length < 20) errors.description = 'Description must be at least 20 characters.';
  return errors;
}

export default function SubmitReport() {
  const today = new Date().toISOString().split('T')[0];
  const fileRef = useRef(null);
  const [fields, setFields] = useState({
    category: 'Trash Complaint',
    purok: PUROK_OPTIONS[0],
    location: '',
    date: today,
    personInvolved: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  const set = (key, val) => {
    setFields(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    setSelectedFile(file || null);
    setFileName(file ? file.name : '');
  };

  const handleDraft = () => {
    setToast('draft');
    setTimeout(() => setToast(false), 2800);
  };

  const handleSubmit = async () => {
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      let attachmentPayload;

      if (selectedFile) {
        const attachmentUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Unable to read the selected file.'));
          reader.readAsDataURL(selectedFile);
        });

        attachmentPayload = {
          name: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          url: attachmentUrl,
          isImage: selectedFile.type.startsWith('image/'),
        };
      }

      await API.post('/reports', {
        category: fields.category,
        purok: fields.purok,
        location: fields.location,
        date: fields.date,
        personInvolved: fields.personInvolved,
        description: fields.description,
        attachment: attachmentPayload,
        attachments: attachmentPayload ? [attachmentPayload] : [],
      });

      setToast('success');
      setFields(f => ({ ...f, location: '', personInvolved: '', description: '', date: today }));
      setFileName('');
      setSelectedFile(null);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      setToast('error');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(false), 3000);
    }
  };

  return (
    <ResidentLayout activePage="submit">
      {toast === 'success' && (
        <div className="submit-report__toast">Report submitted successfully! Reference number assigned.</div>
      )}
      {toast === 'draft' && (
        <div className="submit-report__toast" style={{ background: '#3b72e8' }}>Draft saved.</div>
      )}
      {toast === 'error' && (
        <div className="submit-report__toast" style={{ background: '#ef4444', color: '#ffffff' }}>Report submission failed. Please try again.</div>
      )}

      <div className="submit-report__header">
        <div className="submit-report__label">SUBMIT REPORT</div>
        <div className="submit-report__title">File a new barangay concern.</div>
        <div className="submit-report__sub">A cleaner, production-style report form while keeping the same visual language.</div>
      </div>

      <div className="submit-report">
        <div className="submit-report__form-card">
          <div className="submit-report__row">
            <div className="submit-report__field">
              <label className="submit-report__field-label">Category <span>*</span></label>
              <select
                className={`submit-report__select${errors.category ? ' submit-report__select--error' : ''}`}
                value={fields.category}
                onChange={e => set('category', e.target.value)}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <div className="submit-report__error-text">{errors.category}</div>}
            </div>

            <div className="submit-report__field">
              <label className="submit-report__field-label">Purok <span>*</span></label>
              <select
                className={`submit-report__select${errors.purok ? ' submit-report__select--error' : ''}`}
                value={fields.purok}
                onChange={e => set('purok', e.target.value)}
              >
                <option value="">Select purok...</option>
                {PUROK_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.purok && <div className="submit-report__error-text">{errors.purok}</div>}
            </div>
          </div>

          <div className="submit-report__row">
            <div className="submit-report__field">
              <label className="submit-report__field-label">Location <span>*</span></label>
              <input
                className={`submit-report__input${errors.location ? ' submit-report__input--error' : ''}`}
                type="text"
                placeholder="e.g. Near sari-sari store, Sampaguita Street"
                value={fields.location}
                onChange={e => set('location', e.target.value)}
              />
              {errors.location && <div className="submit-report__error-text">{errors.location}</div>}
            </div>

            <div className="submit-report__field">
              <label className="submit-report__field-label">Date of Incident <span>*</span></label>
              <input
                className={`submit-report__input${errors.date ? ' submit-report__input--error' : ''}`}
                type="date"
                max={today}
                value={fields.date}
                onChange={e => set('date', e.target.value)}
              />
              {errors.date && <div className="submit-report__error-text">{errors.date}</div>}
            </div>
          </div>

          <div className="submit-report__field">
            <label className="submit-report__field-label">Name of Person Involved</label>
            <input
              className="submit-report__input"
              type="text"
              placeholder="Leave blank if unknown"
              value={fields.personInvolved}
              onChange={e => set('personInvolved', e.target.value)}
            />
          </div>

          <div className="submit-report__field">
            <label className="submit-report__field-label">Description <span>*</span></label>
            <textarea
              className={`submit-report__textarea${errors.description ? ' submit-report__textarea--error' : ''}`}
              placeholder="Describe the incident clearly. Minimum 20 characters."
              value={fields.description}
              onChange={e => set('description', e.target.value)}
            />
            <div style={{ fontSize: 12, color: fields.description.length < 20 && fields.description.length > 0 ? '#ef4444' : '#94a3b8', textAlign: 'right' }}>
              {fields.description.length} / 500
            </div>
            {errors.description && <div className="submit-report__error-text">{errors.description}</div>}
          </div>

          <div className="submit-report__field">
            <label className="submit-report__field-label">Attach Photo</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              className="submit-report__file-btn"
              onClick={() => fileRef.current.click()}
              type="button"
            >
              {fileName || 'Choose file or photo'}
            </button>
          </div>

          <div className="submit-report__actions">
            <button className="submit-report__btn-draft" type="button" onClick={handleDraft}>
              Save Draft
            </button>
            <button
              className="submit-report__btn-submit"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>

        <div>
          <div className="submit-report__guide">
            <div className="submit-report__guide-title">Submission Guide</div>
            <div className="submit-report__guide-sub">
              Short resident instructions to make the reporting experience clearer and more standard.
            </div>
            {GUIDE_ITEMS.map(g => (
              <div key={g.title} className="submit-report__guide-item">
                <div className="submit-report__guide-item-title">{g.title}</div>
                <div className="submit-report__guide-item-desc">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResidentLayout>
  );
}
