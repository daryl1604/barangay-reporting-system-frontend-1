import API from "./axios";

export async function fetchAnnouncements() {
  const response = await API.get("/announcements");
  return response.data;
}

export async function createAnnouncement(payload) {
  const response = await API.post("/announcements", payload);
  return response.data;
}
