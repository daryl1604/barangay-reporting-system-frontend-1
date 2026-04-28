import { formatShortDate } from "./dateUtils";

const PRODUCTION_API_URL = "https://barangay-reporting-system-backend-production.up.railway.app/api";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : "http://localhost:5000/api");
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveAttachmentUrl(rawUrl) {
  const normalizedRawUrl = String(rawUrl || "").replace(/\\/g, "/").trim();

  if (!normalizedRawUrl) {
    return "";
  }

  if (/^(https?:|data:|blob:)/i.test(normalizedRawUrl)) {
    return normalizedRawUrl;
  }

  const normalizedPath = normalizedRawUrl.replace(/^\/+/, "");
  return `${API_ORIGIN}/${normalizedPath}`;
}

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  ongoing: 'In Progress',
  "in progress": 'In Progress',
  "in-progress": 'In Progress',
};

function normalizeComment(comment) {
  if (!comment) {
    return null;
  }

  return {
    ...comment,
    id: comment.id || comment._id,
    author: comment.author || comment.user?.name || comment.user?.fullName || "Admin",
    text: comment.text || comment.comment || comment.message || "",
    date: comment.date || comment.createdAt || comment.updatedAt || "",
  };
}

function normalizeAttachmentItem(item, index = 0) {
  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    const normalizedStringUrl = item.replace(/\\/g, "/").trim();
    const fileName = normalizedStringUrl.split("/").pop() || `Attachment ${index + 1}`;
    const isImage = /^data:image\//i.test(normalizedStringUrl) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(normalizedStringUrl);
    const url = resolveAttachmentUrl(normalizedStringUrl);

    return {
      id: `${fileName}-${index}`,
      name: fileName,
      url,
      mimeType: "",
      isImage,
    };
  }

  if (typeof item !== "object") {
    return null;
  }

  const rawUrl = String(
    item.url ||
    item.path ||
    item.href ||
    item.src ||
    item.downloadUrl ||
    item.fileUrl ||
    item.base64 ||
    item.data ||
    item.secure_url ||
    ""
  ).trim();
  const normalizedRawUrl = rawUrl.replace(/\\/g, "/");
  const url = resolveAttachmentUrl(normalizedRawUrl);
  const name =
    item.name ||
    item.fileName ||
    item.originalName ||
    item.filename ||
    item.public_id ||
    `Attachment ${index + 1}`;
  const mimeType = item.mimeType || item.type || "";
  const isImage =
    Boolean(item.isImage) ||
    mimeType.startsWith("image/") ||
    /^data:image\//i.test(url) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url || name);

  if (!url) {
    return null;
  }

  return {
    ...item,
    id: item.id || item._id || `${name}-${index}`,
    name,
    url,
    mimeType,
    isImage,
  };
}

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
    referenceNo: report.referenceNo || String(report.id || report._id || "").slice(-6).toUpperCase() || "N/A",
    dateFiled: report.dateFiled || formatShortDate(report.createdAt || report.incidentDate),
    resident: report.resident?.name || report.resident?.fullName || report.resident?.email || report.resident || "Resident",
    comments: (Array.isArray(report.comments) ? report.comments : Array.isArray(report.adminFeedback) ? report.adminFeedback : [])
      .map(normalizeComment)
      .filter(Boolean),
    adminFeedback: (Array.isArray(report.adminFeedback) ? report.adminFeedback : Array.isArray(report.comments) ? report.comments : [])
      .map(normalizeComment)
      .filter(Boolean),
  }));
}

export function getReportAttachments(report) {
  const attachmentCandidates = [
    report?.attachments,
    report?.files,
    report?.images,
    report?.attachment,
    report?.file,
    report?.image,
    report?.photos,
    report?.photo,
    report?.media,
    report?.mediaFiles,
    report?.documents,
    report?.document,
    report?.evidence,
    report?.evidences,
    report?.proof,
    report?.proofs,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .filter(Boolean);

  const discoveredObjectAttachments = Object.values(report || {})
    .filter((value) => value && typeof value === "object")
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value, index) => normalizeAttachmentItem(value, attachmentCandidates.length + index))
    .filter(Boolean);

  return [...attachmentCandidates, ...discoveredObjectAttachments]
    .map((item, index) => normalizeAttachmentItem(item, index))
    .filter(Boolean)
    .filter(
      (attachment, index, items) =>
        items.findIndex((item) => item.url === attachment.url && item.name === attachment.name) === index
    );
}

export function getCommentAttachment(comment) {
  return normalizeAttachmentItem(comment?.attachment || comment?.file || comment?.image || null);
}
