import React, { useEffect, useState } from 'react';
import '../../styles/MyReports.css';
import API from '../../../../api/axios';
import { getCommentAttachment, getReportAttachments, normalizeReportStatus } from '../../../../utils/reportUtils';
import { formatDateTime } from '../../../../utils/dateUtils';

const statusColors = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
};

export default function ReportModal({ report, onClose, onReportUpdate }) {
  const [currentReport, setCurrentReport] = useState(report);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    setCurrentReport(report);
    setCommentText('');
    setError('');
    setIsPosting(false);
  }, [report]);

  if (!report) return null;

  const activeReport = currentReport || report;
  const comments = Array.isArray(activeReport.comments) && activeReport.comments.length > 0
    ? activeReport.comments
    : Array.isArray(activeReport.adminFeedback)
      ? activeReport.adminFeedback
      : [];
  const attachments = getReportAttachments(activeReport);
  const status = normalizeReportStatus(activeReport.status);

  const handleSubmitComment = async () => {
    const nextComment = commentText.trim();

    if (!nextComment) {
      setError('Comment cannot be empty.');
      return;
    }

    setIsPosting(true);
    setError('');

    try {
      const response = await API.post(`/reports/${activeReport.id || activeReport._id}/comment`, {
        text: nextComment,
      });
      const nextComments = Array.isArray(response.data) ? response.data : comments;
      const nextReport = {
        ...activeReport,
        comments: nextComments,
        adminFeedback: nextComments,
      };

      setCurrentReport(nextReport);
      setCommentText('');
      onReportUpdate?.(nextReport);
    } catch (postError) {
      console.error(postError);
      setError(postError?.response?.data?.msg || 'Unable to post comment right now.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="report-modal__overlay" onClick={onClose}>
      <div className="report-modal__box" onClick={e => e.stopPropagation()}>
        <div className="report-modal__header">
          <div>
            <h2 className="report-modal__title">{activeReport.category}</h2>
            <span
              className="report-modal__status-badge"
              style={{ background: `${statusColors[status]}22`, color: statusColors[status] }}
            >
              {status}
            </span>
          </div>
          <button className="report-modal__close" onClick={onClose}>Close</button>
        </div>

        <div className="report-modal__grid">
          <div className="report-modal__field">
            <div className="report-modal__field-label">Reference No.</div>
            <div className="report-modal__field-value">{activeReport.referenceNo}</div>
          </div>
          <div className="report-modal__field">
            <div className="report-modal__field-label">Purok</div>
            <div className="report-modal__field-value">{activeReport.purok}</div>
          </div>
          <div className="report-modal__field">
            <div className="report-modal__field-label">Date Filed</div>
            <div className="report-modal__field-value">{activeReport.dateFiled}</div>
          </div>
          <div className="report-modal__field">
            <div className="report-modal__field-label">Resident</div>
            <div className="report-modal__field-value">{activeReport.resident}</div>
          </div>
        </div>

        <div className="report-modal__field report-modal__field--full">
          <div className="report-modal__field-label">Location</div>
          <div className="report-modal__field-value">{activeReport.location}</div>
        </div>

        <div className="report-modal__section">
          <div className="report-modal__section-label">DESCRIPTION</div>
          <div className="report-modal__section-body">{activeReport.description}</div>
        </div>

        {activeReport.personInvolved && (
          <div className="report-modal__section">
            <div className="report-modal__section-label">PERSON INVOLVED</div>
            <div className="report-modal__section-body">{activeReport.personInvolved}</div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="report-modal__section">
            <div className="report-modal__section-header">
              <div className="report-modal__section-label">ATTACHMENTS</div>
              <div className="report-modal__section-count">{attachments.length} total</div>
            </div>
            <div className="report-modal__attachments-list">
              {attachments.map((attachment) => (
                <article key={attachment.id} className="report-modal__attachment-card">
                  {attachment.isImage ? (
                    <img src={attachment.url} alt={attachment.name} className="report-modal__report-image" />
                  ) : (
                    <div className="report-modal__report-file">
                      <strong>{attachment.name}</strong>
                      <span>File attachment</span>
                    </div>
                  )}

                  <div className="report-modal__report-file-meta">
                    <p>{attachment.name}</p>
                    {attachment.isImage ? (
                      <span className="report-modal__feedback-link">Photo attachment</span>
                    ) : (
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        View attachment
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="report-modal__section">
          <div className="report-modal__section-header">
            <div className="report-modal__section-label">COMMENTS</div>
            <div className="report-modal__section-count">{comments.length} total</div>
          </div>
          {comments.length === 0 ? (
            <div className="report-modal__no-feedback">
              <div className="report-modal__no-feedback-title">No comments yet</div>
              <div className="report-modal__no-feedback-desc">
                No one has posted a comment on this report yet.
              </div>
            </div>
          ) : (
            comments.map((fb, i) => {
              const attachment = getCommentAttachment(fb);

              return (
              <div key={fb._id || fb.id || i} className="report-modal__feedback-item">
                <div className="report-modal__feedback-author">{fb.author || fb.user?.name || 'Admin'}</div>
                <div className="report-modal__feedback-text">{fb.text || fb.comment || fb.message}</div>
                {attachment && (
                  <div className="report-modal__feedback-attachment">
                    {attachment.isImage ? (
                      <img src={attachment.url} alt={attachment.name} className="report-modal__feedback-image" />
                    ) : (
                      <a href={attachment.url} target="_blank" rel="noreferrer" className="report-modal__feedback-link">
                        {attachment.name}
                      </a>
                    )}
                  </div>
                )}
                {(fb.date || fb.createdAt || fb.updatedAt) && (
                  <div className="report-modal__feedback-date">
                    {formatDateTime(fb.date || fb.createdAt || fb.updatedAt)}
                  </div>
                )}
              </div>
            )})
          )}

          <div className="report-modal__comment-compose">
            <textarea
              className={`report-modal__comment-input${error ? ' report-modal__comment-input--error' : ''}`}
              placeholder="Add a comment"
              value={commentText}
              onChange={(event) => {
                setCommentText(event.target.value);
                if (error) {
                  setError('');
                }
              }}
            />
            <div className="report-modal__comment-actions">
              <button
                type="button"
                className="report-modal__comment-button"
                onClick={handleSubmitComment}
                disabled={isPosting}
              >
                {isPosting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
            {error ? <div className="report-modal__comment-error">{error}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
