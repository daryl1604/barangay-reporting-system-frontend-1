import API from "./axios";

export async function fetchMyNotifications() {
  const response = await API.get("/notifications");
  return response.data;
}

export async function markNotificationAsRead(notificationId) {
  const response = await API.put(`/notifications/${notificationId}/read`);
  return response.data;
}
