import { useContext, useEffect, useMemo, useRef, useState } from "react";
import AnalyticsDashboard from "../../components/analytics/AnalyticsDashboard";
import { fetchMyNotifications, markNotificationAsRead } from "../../api/notifications";
import { addReportComment, deleteReport, fetchAllReports, updateReportStatus } from "../../api/reports";
import { AuthContext } from "../../context/authContext";
import { formatDateTime, formatLongDate, isSameDay, toDate } from "../../utils/dateUtils";
import {
  filterReports,
  getPurokSummary,
  getRecentRequests,
  getReportStats,
  getResidentName,
  getStatusLabel,
} from "../../utils/filterUtils";
import AdminNavbar from "./components/layout/AdminNavbar";
import AdminSidebar from "./components/layout/AdminSidebar";
import FilterBar from "./components/dashboard/FilterBar";
import HeaderDashboard from "./components/dashboard/HeaderDashboard";
import ReportCardAdmin from "./components/reports/ReportCardAdmin";
import ReportsSection from "./components/reports/ReportsSection";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [todayStatusFilter, setTodayStatusFilter] = useState("");
  const [purokStatusFilter, setPurokStatusFilter] = useState("");
  const [allReportsStatusFilter, setAllReportsStatusFilter] = useState("");
  const [allReportsSearchTerm, setAllReportsSearchTerm] = useState("");
  const [allReportsDateFilter, setAllReportsDateFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
  const [statusUpdating, setStatusUpdating] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [reportPendingDelete, setReportPendingDelete] = useState(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isReportActionsOpen, setIsReportActionsOpen] = useState(false);
  const reportActionsRef = useRef(null);

  const reportsCacheKey = "admin-dashboard-reports";

  useEffect(() => {
    const cachedReports = localStorage.getItem(reportsCacheKey);

    if (!cachedReports) {
      return;
    }

    try {
      const parsedReports = JSON.parse(cachedReports);

      if (Array.isArray(parsedReports) && reports.length === 0) {
        setReports(parsedReports);
      }
    } catch (error) {
      console.error(error);
    }
  }, [reports.length, reportsCacheKey]);

  const loadReports = async () => {
    try {
      const data = await fetchAllReports();
      setReports(data);
      localStorage.setItem(reportsCacheKey, JSON.stringify(data));
    } catch (error) {
      console.error(error);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await fetchMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadReports();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!selectedReport) {
      return;
    }

    const refreshedSelectedReport = reports.find((report) => report._id === selectedReport._id);
    setSelectedReport(refreshedSelectedReport || null);
  }, [reports, selectedReport]);

  useEffect(() => {
    setCommentText("");
    setAttachmentFile(null);
    setIsReportActionsOpen(false);
  }, [selectedReport]);

  useEffect(() => {
    if (!isReportActionsOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!reportActionsRef.current?.contains(event.target)) {
        setIsReportActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isReportActionsOpen]);

  useEffect(() => {
    if (!attachmentFile || !attachmentFile.type.startsWith("image/")) {
      setAttachmentPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(attachmentFile);
    setAttachmentPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [attachmentFile]);

  const stats = useMemo(() => getReportStats(reports), [reports]);
  const purokFilteredReports = useMemo(
    () => filterReports(reports, { selectedStatus: purokStatusFilter }),
    [reports, purokStatusFilter]
  );
  const visiblePurokSummary = useMemo(() => getPurokSummary(purokFilteredReports), [purokFilteredReports]);

  const highlightedReportDates = useMemo(
    () => reports.map((report) => new Date(report.createdAt)).filter((date) => !Number.isNaN(date.getTime())),
    [reports]
  );

  const featuredDate = selectedDate || new Date();
  const featuredReports = useMemo(
    () =>
      filterReports(reports, {
        selectedStatus: todayStatusFilter,
        selectedDate: featuredDate,
      }),
    [reports, todayStatusFilter, featuredDate]
  );

  const allReportsFiltered = useMemo(
    () =>
      filterReports(reports, {
        searchTerm: allReportsSearchTerm,
        selectedStatus: allReportsStatusFilter,
        selectedDate: allReportsDateFilter ? toDate(allReportsDateFilter) : null,
      }),
    [reports, allReportsSearchTerm, allReportsStatusFilter, allReportsDateFilter]
  );

  const recentRequests = useMemo(() => getRecentRequests(reports), [reports]);
  const dropdownNotifications = useMemo(() => {
    return notifications
      .sort((leftNotification, rightNotification) => {
        const leftTime = new Date(leftNotification.createdAt || 0).getTime();
        const rightTime = new Date(rightNotification.createdAt || 0).getTime();
        return rightTime - leftTime;
      })
      .map((notification) => ({
        id: notification._id,
        reportId:
          typeof notification.report === "string"
            ? notification.report
            : notification.report?._id || null,
        title: notification.title || "Notification",
        description: notification.message,
        date: notification.createdAt,
        status: notification.type || "general",
        read: Boolean(notification.read),
      }));
  }, [notifications]);

  const unreadNotificationCount = useMemo(
    () => dropdownNotifications.filter((notification) => !notification.read).length,
    [dropdownNotifications]
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const updateReportsState = (nextReports) => {
    setReports(nextReports);
    localStorage.setItem(reportsCacheKey, JSON.stringify(nextReports));
  };

  const handleStatusChange = async (reportId, status) => {
    if (statusUpdating[reportId]) {
      return;
    }

    const previousReports = reports;
    const currentReport = reports.find((report) => report._id === reportId);

    if (!currentReport || currentReport.status === status) {
      return;
    }

    setStatusUpdating((currentState) => ({
      ...currentState,
      [reportId]: status,
    }));

    setReports((currentReports) =>
      currentReports.map((report) =>
        report._id === reportId
          ? {
              ...report,
              status,
            }
          : report
      )
    );

    try {
      await updateReportStatus(reportId, status);
      await Promise.all([loadReports(), loadNotifications()]);
    } catch (error) {
      console.error(error);
      updateReportsState(previousReports);
    } finally {
      setStatusUpdating((currentState) => {
        const nextState = { ...currentState };
        delete nextState[reportId];
        return nextState;
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedReport || !commentText.trim()) {
      return;
    }

    try {
      await addReportComment(selectedReport._id, commentText.trim());
      setCommentText("");
      setAttachmentFile(null);
      await Promise.all([loadReports(), loadNotifications()]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate((currentSelectedDate) =>
      currentSelectedDate && isSameDay(currentSelectedDate, date) ? null : date
    );
    setViewDate(date);
  };

  const handleMonthSelect = (monthIndex) => {
    setViewDate((currentDate) => new Date(currentDate.getFullYear(), monthIndex, 1));
  };

  const handleYearSelect = (yearValue) => {
    setViewDate((currentDate) => new Date(yearValue, currentDate.getMonth(), 1));
  };

  const getReportAttachments = (report) => {
    const attachmentCandidates = [
      report?.attachments,
      report?.files,
      report?.images,
      report?.attachment,
      report?.file,
      report?.image,
    ]
      .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
      .filter(Boolean);

    return attachmentCandidates
      .map((item, index) => {
        if (typeof item === "string") {
          const fileName = item.split("/").pop() || `Attachment ${index + 1}`;

          return {
            id: `${fileName}-${index}`,
            name: fileName,
            url: item,
            isImage: /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(item),
          };
        }

        const url = item.url || item.path || item.src || item.downloadUrl || item.fileUrl || "";
        const name = item.name || item.fileName || item.originalName || url.split("/").pop() || `Attachment ${index + 1}`;
        const type = item.type || item.mimeType || "";
        const isImage = type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url || name);

        return url
          ? {
              id: item._id || `${name}-${index}`,
              name,
              url,
              isImage,
            }
          : null;
      })
      .filter(Boolean);
  };

  const handleRequestDeleteReport = (report) => {
    setDeleteError("");
    setReportPendingDelete(report);
  };

  const handleCancelDeleteReport = () => {
    if (isDeletingReport) {
      return;
    }

    setDeleteError("");
    setReportPendingDelete(null);
  };

  const findReportForNotification = (notification) => {
    if (notification.reportId) {
      return reports.find((report) => report._id === notification.reportId) || null;
    }

    const description = notification.description || "";
    const submittedMatch = description.match(/^A new (.+) report was submitted in (.+)\.$/i);

    if (submittedMatch) {
      const [, category, purok] = submittedMatch;

      return (
        [...reports]
          .sort((leftReport, rightReport) => {
            const leftTime = new Date(leftReport.createdAt || 0).getTime();
            const rightTime = new Date(rightReport.createdAt || 0).getTime();
            return rightTime - leftTime;
          })
          .find((report) => {
            const reportCategory = String(report.category || "").trim().toLowerCase();
            const reportPurok = String(report.purok || "an unspecified purok").trim().toLowerCase();

            return (
              reportCategory === category.trim().toLowerCase() &&
              reportPurok === purok.trim().toLowerCase()
            );
          }) || null
      );
    }

    return null;
  };

  const handleOpenNotification = async (notification) => {
    const targetReport = findReportForNotification(notification);

    if (targetReport) {
      setSelectedReport(targetReport);
    }

    if (notification.read) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((currentNotification) =>
        currentNotification._id === notification.id
          ? {
              ...currentNotification,
              read: true,
            }
          : currentNotification
      )
    );

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    }
  };

  const handleDismissNotification = async (notificationId) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification._id === notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );

    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    }
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportPendingDelete || isDeletingReport) {
      return;
    }

    const reportToDelete = reportPendingDelete;
    const previousReports = reports;
    const wasSelectedReport = selectedReport?._id === reportToDelete._id;
    const nextReports = reports.filter((report) => report._id !== reportToDelete._id);

    setIsDeletingReport(true);
    setDeleteError("");
    updateReportsState(nextReports);

    if (wasSelectedReport) {
      setSelectedReport(null);
    }

    try {
      await deleteReport(reportToDelete._id);
      setReportPendingDelete(null);
    } catch (error) {
      console.error(error);
      updateReportsState(previousReports);

      if (wasSelectedReport) {
        setSelectedReport(reportToDelete);
      }

      setDeleteError("Unable to delete the report right now. Please try again.");
    } finally {
      setIsDeletingReport(false);
    }
  };

  return (
    <div className="barangay-dashboard">
      <AdminNavbar onLogout={handleLogout} />

      <div className="barangay-dashboard__content">
        <main className="barangay-dashboard__main">
          <HeaderDashboard
            stats={stats}
            notifications={dropdownNotifications}
            unreadNotificationCount={unreadNotificationCount}
            onOpenNotification={handleOpenNotification}
            onDismissNotification={handleDismissNotification}
          />

          <ReportsSection
            id="reports"
            title={selectedDate ? "Reports for Selected Date" : "Today's Reports"}
            subtitle={
              selectedDate
                ? `Showing reports filed on ${formatLongDate(selectedDate)}`
                : "Quick access to reports filed today."
            }
            action={
              <FilterBar
                label="Filter Today's Reports"
                selectedStatus={todayStatusFilter}
                onStatusChange={setTodayStatusFilter}
                searchTerm=""
                onSearchChange={() => {}}
                selectedDateLabel=""
                showSearch={false}
                showDatePill={false}
              />
            }
          >
            {featuredReports.length === 0 ? (
              <p className="dashboard-empty-state">No reports found for the current selection.</p>
            ) : (
              <div className="dashboard-report-scroll dashboard-report-scroll--today">
                <div className="report-grid">
                  {featuredReports.map((report) => (
                    <ReportCardAdmin
                      key={report._id}
                      report={report}
                      onView={setSelectedReport}
                      onStatusChange={handleStatusChange}
                      onDelete={handleRequestDeleteReport}
                      statusUpdating={statusUpdating[report._id]}
                      deletePending={isDeletingReport && reportPendingDelete?._id === report._id}
                    />
                  ))}
                </div>
              </div>
            )}
          </ReportsSection>

          <ReportsSection
            id="purok"
            title="Reports by Purok"
            subtitle="Live purok distribution based on the active filters."
            action={
              <FilterBar
                label="Filter Purok Summary"
                selectedStatus={purokStatusFilter}
                onStatusChange={setPurokStatusFilter}
                searchTerm=""
                onSearchChange={() => {}}
                selectedDateLabel=""
                showSearch={false}
                showDatePill={false}
              />
            }
          >
            {visiblePurokSummary.length === 0 ? (
              <p className="dashboard-empty-state">No purok data available for the current filters.</p>
            ) : (
              <div className="purok-grid">
                {visiblePurokSummary.map((item) => (
                  <article key={item.purok} className="purok-card">
                    <span className="purok-card__label">{item.purok}</span>
                    <strong>{item.totalReports}</strong>
                    <p>{item.totalReports} report{item.totalReports === 1 ? "" : "s"}</p>
                  </article>
                ))}
              </div>
            )}
          </ReportsSection>

          <ReportsSection
            id="analytics"
            title="Analytics"
            subtitle="Admin-only insights for weekly, monthly, and yearly report trends."
          >
            <AnalyticsDashboard reports={reports} />
          </ReportsSection>

          <ReportsSection
            id="all-reports"
            title="All Reports"
            subtitle="Every report updates instantly as the date and status filters change."
            action={
              <FilterBar
                label="Filter All Reports"
                selectedStatus={allReportsStatusFilter}
                onStatusChange={setAllReportsStatusFilter}
                searchTerm={allReportsSearchTerm}
                onSearchChange={setAllReportsSearchTerm}
                selectedDateLabel=""
                showDatePill={false}
                dateValue={allReportsDateFilter}
                dateLabel={allReportsDateFilter ? formatLongDate(toDate(allReportsDateFilter)) : "All dates"}
                onDateChange={setAllReportsDateFilter}
                onDateClear={() => setAllReportsDateFilter("")}
              />
            }
          >
            {allReportsFiltered.length === 0 ? (
              <p className="dashboard-empty-state">No reports match the active filters.</p>
            ) : (
              <div className="dashboard-report-scroll dashboard-report-scroll--all">
                <div className="report-grid report-grid--compact">
                  {allReportsFiltered.map((report) => (
                    <ReportCardAdmin
                      key={report._id}
                      report={report}
                      onView={setSelectedReport}
                      onStatusChange={handleStatusChange}
                      onDelete={handleRequestDeleteReport}
                      statusUpdating={statusUpdating[report._id]}
                      deletePending={isDeletingReport && reportPendingDelete?._id === report._id}
                    />
                  ))}
                </div>
              </div>
            )}
          </ReportsSection>
        </main>

        <AdminSidebar
          reports={recentRequests}
          selectedDate={selectedDate}
          viewDate={viewDate}
          reportDates={highlightedReportDates}
          onSelectDate={handleDateSelect}
          onPreviousMonth={() =>
            setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
          }
          onNextMonth={() =>
            setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
          }
          onSelectMonth={handleMonthSelect}
          onSelectYear={handleYearSelect}
          onClearDate={() => setSelectedDate(null)}
          onViewReport={setSelectedReport}
          onDeleteReport={handleRequestDeleteReport}
          deletingReportId={isDeletingReport ? reportPendingDelete?._id : null}
        />
      </div>

      {selectedReport ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={() => setSelectedReport(null)} />
          <section className="report-modal__card">
            <div className="report-modal__header">
              <div>
                <p className="report-modal__eyebrow">{getResidentName(selectedReport)}</p>
                <h2>{selectedReport.category}</h2>
                <span className={`report-status report-status--${selectedReport.status}`}>
                  {getStatusLabel(selectedReport.status)}
                </span>
              </div>
              <div className="report-modal__header-actions" ref={reportActionsRef}>
                <button type="button" className="report-modal__close" onClick={() => setSelectedReport(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className={["report-modal__menu-trigger", isReportActionsOpen ? "is-active" : ""].filter(Boolean).join(" ")}
                  aria-label="Report actions"
                  aria-expanded={isReportActionsOpen}
                  onClick={() => setIsReportActionsOpen((currentValue) => !currentValue)}
                >
                  <span />
                  <span />
                  <span />
                </button>

                {isReportActionsOpen ? (
                  <div className="report-modal__menu">
                    <button
                      type="button"
                      className="report-modal__menu-item report-modal__menu-item--blue"
                      disabled={
                        selectedReport.status === "in_progress" || Boolean(statusUpdating[selectedReport._id])
                      }
                      onClick={() => {
                        setIsReportActionsOpen(false);
                        handleStatusChange(selectedReport._id, "in_progress");
                      }}
                    >
                      {selectedReport.status === "in_progress" ? "Already Ongoing" : "Mark as Ongoing"}
                    </button>
                    <button
                      type="button"
                      className="report-modal__menu-item report-modal__menu-item--green"
                      disabled={
                        selectedReport.status === "resolved" || Boolean(statusUpdating[selectedReport._id])
                      }
                      onClick={() => {
                        setIsReportActionsOpen(false);
                        handleStatusChange(selectedReport._id, "resolved");
                      }}
                    >
                      {selectedReport.status === "resolved" ? "Already Resolved" : "Mark as Resolved"}
                    </button>
                    <button
                      type="button"
                      className="report-modal__menu-item report-modal__menu-item--danger"
                      onClick={() => {
                        setIsReportActionsOpen(false);
                        handleRequestDeleteReport(selectedReport);
                      }}
                    >
                      Delete Report
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="report-modal__body">
              <div className="report-modal__info-grid">
                <div>
                  <span className="report-modal__label">Date Filed</span>
                  <p>{formatDateTime(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <span className="report-modal__label">Purok</span>
                  <p>{selectedReport.purok || "N/A"}</p>
                </div>
                <div>
                  <span className="report-modal__label">Location</span>
                  <p>{selectedReport.location || "Location unavailable"}</p>
                </div>
                <div>
                  <span className="report-modal__label">Resident</span>
                  <p>{getResidentName(selectedReport)}</p>
                </div>
              </div>

              <div className="report-modal__description">
                <span className="report-modal__label">Description</span>
                <p>{selectedReport.description}</p>
              </div>

              {getReportAttachments(selectedReport).length ? (
                <div className="report-modal__attachments">
                  <span className="report-modal__label">Attachments</span>
                  <div className="report-modal__attachments-list">
                    {getReportAttachments(selectedReport).map((attachment) => (
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
                          <a href={attachment.url} target="_blank" rel="noreferrer">
                            View attachment
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {statusUpdating[selectedReport._id] ? (
                <div className="report-status-feedback">
                  <span className="report-status-feedback__spinner" />
                  Updating...
                </div>
              ) : null}

              <div className="report-modal__comments">
                <div className="report-modal__comments-header">
                  <h3>Barangay Admin Feedback</h3>
                  <span>{selectedReport.comments?.length || 0} total</span>
                </div>

                <div className="report-modal__comment-list">
                  {selectedReport.comments?.length ? (
                    selectedReport.comments.map((comment) => (
                      <article key={comment._id || `${comment.text}-${comment.date}`} className="comment-card">
                        <strong>{comment.user?.name || "Admin"}</strong>
                        <p>{comment.text}</p>
                        <span>{formatDateTime(comment.date)}</span>
                      </article>
                    ))
                  ) : (
                    <p className="dashboard-empty-state">No comments yet for this report.</p>
                  )}
                </div>

                <div className="report-modal__comment-form">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add an admin comment"
                  />
                  <label className="report-modal__attachment">
                    <span>Attach file or photo</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    type="button"
                    className="report-action-button report-action-button--ghost"
                    onClick={handleAddComment}
                  >
                    Add Comment
                  </button>
                </div>

                {attachmentFile ? (
                  <div className="report-modal__attachment-preview">
                    <div>
                      <span className="report-modal__label">Selected Attachment</span>
                      <p>{attachmentFile.name}</p>
                    </div>

                    {attachmentPreviewUrl ? (
                      <img src={attachmentPreviewUrl} alt={attachmentFile.name} />
                    ) : (
                      <p className="report-modal__attachment-note">File ready for review in the current session.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {reportPendingDelete ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={handleCancelDeleteReport} />
          <section className="report-modal__card report-modal__card--confirm">
            <div className="report-modal__header">
              <div>
                <p className="report-modal__eyebrow">Delete Report</p>
                <h2>Are you sure you want to delete this report?</h2>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="delete-report-summary">
                <div className="delete-report-summary__grid">
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Report</span>
                    <p>{reportPendingDelete.category}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Resident</span>
                    <p>{getResidentName(reportPendingDelete)}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Date</span>
                    <p>{formatDateTime(reportPendingDelete.createdAt)}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Purok</span>
                    <p>{reportPendingDelete.purok || "N/A"}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Location</span>
                    <p>{reportPendingDelete.location || "Location unavailable"}</p>
                  </div>
                </div>

                <div className="delete-report-summary__item delete-report-summary__item--full">
                  <span className="report-modal__label">Description</span>
                  <p>{reportPendingDelete.description || "No description provided."}</p>
                </div>
              </div>

              {deleteError ? <p className="report-modal__error">{deleteError}</p> : null}

              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--ghost"
                  disabled={isDeletingReport}
                  onClick={handleCancelDeleteReport}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="report-action-button report-action-button--danger"
                  disabled={isDeletingReport}
                  onClick={handleConfirmDeleteReport}
                >
                  {isDeletingReport ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDashboard;
