export type NotificationType =
  | "budget_warning"
  | "budget_exceeded"
  | "bill_due_soon"
  | "bill_overdue"
  | "anomaly"
  | "system";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationItem {
  id: number;
  family_id: number;
  user_id: number | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}
