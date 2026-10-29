import { API_URL, authFetch } from "./apiClient";
import type {
  NotificationItem,
  NotificationResponse,
} from "../types/notification";

export async function fetchNotifications(
  options: {
    limit?: number;
    offset?: number;
    type?: string;
    unreadOnly?: boolean;
    skipSync?: boolean;
  } = {},
): Promise<NotificationResponse> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.append("limit", String(options.limit));
  if (options.offset !== undefined) params.append("offset", String(options.offset));
  if (options.type) params.append("type", options.type);
  if (options.unreadOnly) params.append("unreadOnly", "true");
  if (options.skipSync) params.append("skipSync", "true");

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/notifications${queryString}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch notifications");
  }

  const json = await res.json();
  return json.data;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<NotificationItem> {
  const res = await authFetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to mark notification as read");
  }

  const json = await res.json();
  return json.data;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const res = await authFetch(`${API_URL}/notifications/read-all`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to mark all notifications as read");
  }

  const json = await res.json();
  return json.data?.updatedCount ?? 0;
}

export async function deleteNotification(
  notificationId: number,
): Promise<boolean> {
  const res = await authFetch(`${API_URL}/notifications/${notificationId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete notification");
  }

  return true;
}

export async function clearNotifications(
  onlyRead: boolean = false,
): Promise<number> {
  const queryString = onlyRead ? "?onlyRead=true" : "";
  const res = await authFetch(`${API_URL}/notifications${queryString}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to clear notifications");
  }

  const json = await res.json();
  return json.data?.deletedCount ?? 0;
}
