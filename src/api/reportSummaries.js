import API from "./axios";

export async function fetchReportSummaries() {
  const response = await API.get("/reports/summaries");
  return response.data;
}

export async function createReportSummary(payload) {
  const response = await API.post("/reports/summaries", payload);
  return response.data;
}
