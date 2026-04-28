const STORAGE_KEY = "residentNotificationPrefs";

export const DEFAULT_NOTIFICATION_PREFS = {
  statusAlerts: true,
  adminAlerts: true,
  badgeVisible: true,
};

export function readNotificationPrefs() {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(nextPrefs) {
  if (typeof window === "undefined") {
    return nextPrefs;
  }

  const mergedPrefs = { ...DEFAULT_NOTIFICATION_PREFS, ...nextPrefs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPrefs));
  window.dispatchEvent(new CustomEvent("resident-notification-prefs-updated", { detail: mergedPrefs }));
  return mergedPrefs;
}

export function getNotificationType(notification) {
  const rawType = String(notification?.type || "").trim().toLowerCase();

  if (rawType === "status_update" || rawType === "admin_alert") {
    return rawType;
  }

  const sourceText = `${notification?.title || ""} ${notification?.description || ""} ${notification?.message || ""}`.toLowerCase();

  if (sourceText.includes("status")) {
    return "status_update";
  }

  if (sourceText.includes("comment") || sourceText.includes("admin")) {
    return "admin_alert";
  }

  return "general";
}

export function isNotificationVisible(notification, prefs = DEFAULT_NOTIFICATION_PREFS) {
  const type = getNotificationType(notification);

  if (type === "status_update" && !prefs.statusAlerts) {
    return false;
  }

  if (type === "admin_alert" && !prefs.adminAlerts) {
    return false;
  }

  return true;
}
