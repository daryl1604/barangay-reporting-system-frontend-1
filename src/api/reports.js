import API from "./axios";

export async function fetchAllReports() {
  const response = await API.get("/reports/all");
  return response.data;
}

export async function fetchAnalyticsPeriodSummary(period) {
  const response = await API.get("/reports/analytics/period-summary", {
    params: { period }
  });
  return response.data;
}

export async function fetchAnalyticsTrends(period) {
  const response = await API.get("/reports/analytics/trends", {
    params: { period }
  });
  return response.data;
}

export async function fetchYearlyAnalytics() {
  const response = await API.get("/reports/analytics/yearly");
  return response.data;
}

export async function updateReportStatus(reportId, status) {
  const response = await API.put(`/reports/${reportId}`, { status });
  return response.data;
}

export async function deleteReport(reportId) {
  const response = await API.delete(`/reports/${reportId}`);
  return response.data;
}

export async function addReportComment(reportId, text, attachment) {
  const response = await API.post(`/reports/${reportId}/comment`, { text, attachment });
  return response.data;
}

export async function updateReportComment(reportId, commentId, text) {
  if (!reportId || !commentId) {
    throw new Error("Missing reportId or commentId for comment update.");
  }

  const response = await API.put(`/reports/${reportId}/comment/${commentId}`, { text });
  return response.data;
}

export async function deleteReportComment(reportId, commentId) {
  if (!reportId || !commentId) {
    throw new Error("Missing reportId or commentId for comment delete.");
  }

  const response = await API.delete(`/reports/${reportId}/comment/${commentId}`);
  return response.data;
}
