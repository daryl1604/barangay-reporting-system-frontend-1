const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  ongoing: 'In Progress',
  "in progress": 'In Progress',
  "in-progress": 'In Progress',
};

export function normalizeReportStatus(status) {
  if (!status && status !== 0) {
    return 'Pending';
  }

  const raw = String(status).trim().toLowerCase();
  return STATUS_LABELS[raw] || STATUS_LABELS[raw.replace(/\s+/g, '_')] || STATUS_LABELS[raw.replace(/-/g, '_')] || status;
}

export function normalizeReportPayload(payload) {
  const reports = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.reports)
      ? payload.reports
      : [];

  return reports.map((report) => ({
    ...report,
    id: report.id || report._id,
    status: normalizeReportStatus(report.status),
  }));
}
