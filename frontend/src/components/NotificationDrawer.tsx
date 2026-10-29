import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarClock,
  CalendarX2,
  Check,
  CheckCheck,
  ExternalLink,
  Flame,
  Info,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import type { NotificationItem, NotificationType } from "../types/notification";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function getNotificationVisuals(type: NotificationType) {
  switch (type) {
    case "budget_exceeded":
      return {
        icon: Flame,
        badgeLabel: "Budget Exceeded",
        iconColor: "text-rose-500",
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        cardBg: "bg-rose-50/40 dark:bg-rose-950/20",
        cardBorder: "border-rose-200/80 dark:border-rose-900/40",
      };
    case "budget_warning":
      return {
        icon: AlertTriangle,
        badgeLabel: "Budget Warning",
        iconColor: "text-amber-500",
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        cardBg: "bg-amber-50/30 dark:bg-amber-950/15",
        cardBorder: "border-amber-200/70 dark:border-amber-900/40",
      };
    case "bill_overdue":
      return {
        icon: CalendarX2,
        badgeLabel: "Overdue Bill",
        iconColor: "text-rose-500",
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        cardBg: "bg-rose-50/40 dark:bg-rose-950/20",
        cardBorder: "border-rose-200/80 dark:border-rose-900/40",
      };
    case "bill_due_soon":
      return {
        icon: CalendarClock,
        badgeLabel: "Upcoming Bill",
        iconColor: "text-amber-500",
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        cardBg: "bg-amber-50/30 dark:bg-amber-950/15",
        cardBorder: "border-amber-200/70 dark:border-amber-900/40",
      };
    case "anomaly":
      return {
        icon: Sparkles,
        badgeLabel: "Anomaly",
        iconColor: "text-purple-500",
        badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        cardBg: "bg-purple-50/30 dark:bg-purple-950/15",
        cardBorder: "border-purple-200/70 dark:border-purple-900/40",
      };
    default:
      return {
        icon: Info,
        badgeLabel: "System",
        iconColor: "text-blue-500",
        badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        cardBg: "bg-blue-50/30 dark:bg-blue-950/15",
        cardBorder: "border-blue-200/70 dark:border-blue-900/40",
      };
  }
}

type TabKey = "all" | "unread" | "budgets" | "bills";

export default function NotificationDrawer() {
  const {
    notifications,
    unreadCount,
    isOpen,
    closeDrawer,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useNotifications();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Lock body scroll and ESC key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDrawer]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.is_read);
      case "budgets":
        return notifications.filter((n) =>
          ["budget_warning", "budget_exceeded"].includes(n.type),
        );
      case "bills":
        return notifications.filter((n) =>
          ["bill_due_soon", "bill_overdue"].includes(n.type),
        );
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const readCount = useMemo(
    () => notifications.filter((n) => n.is_read).length,
    [notifications],
  );

  const budgetAlertsCount = useMemo(
    () =>
      notifications.filter((n) =>
        ["budget_warning", "budget_exceeded"].includes(n.type),
      ).length,
    [notifications],
  );

  const billAlertsCount = useMemo(
    () =>
      notifications.filter((n) =>
        ["bill_due_soon", "bill_overdue"].includes(n.type),
      ).length,
    [notifications],
  );

  function handleNotificationClick(item: NotificationItem) {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    if (item.link) {
      closeDrawer();
      navigate(item.link);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2a234f]/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          aria-label="Notification center"
          className="flex w-screen max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#1a1438] animate-slide-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e8e5ef] px-6 py-5 dark:border-[#2e265c]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3]/30 text-[#2a234f] dark:bg-[#ffb3c3]/20 dark:text-[#ffb3c3]">
                <Bell size={20} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#ff859d] px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                  Financial warnings & payment reminders
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  title="Mark all as read"
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2a234f] transition hover:bg-[#f8f7fb] dark:text-[#f5f3fa] dark:hover:bg-[#28214d]"
                >
                  <CheckCheck size={14} className="text-emerald-500" />
                  <span>Mark all read</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close notifications panel"
                className="rounded-lg p-2 text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:bg-[#28214d] dark:hover:text-[#f5f3fa]"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#e8e5ef] px-6 dark:border-[#2e265c]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`relative py-3 px-3 text-xs font-semibold transition ${
                activeTab === "all"
                  ? "text-[#2a234f] dark:text-[#f5f3fa]"
                  : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-[#f5f3fa]"
              }`}
            >
              All ({notifications.length})
              {activeTab === "all" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff859d]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`relative py-3 px-3 text-xs font-semibold transition ${
                activeTab === "unread"
                  ? "text-[#2a234f] dark:text-[#f5f3fa]"
                  : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-[#f5f3fa]"
              }`}
            >
              Unread ({unreadCount})
              {activeTab === "unread" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff859d]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("budgets")}
              className={`relative py-3 px-3 text-xs font-semibold transition ${
                activeTab === "budgets"
                  ? "text-[#2a234f] dark:text-[#f5f3fa]"
                  : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-[#f5f3fa]"
              }`}
            >
              Budgets ({budgetAlertsCount})
              {activeTab === "budgets" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff859d]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bills")}
              className={`relative py-3 px-3 text-xs font-semibold transition ${
                activeTab === "bills"
                  ? "text-[#2a234f] dark:text-[#f5f3fa]"
                  : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-[#f5f3fa]"
              }`}
            >
              Bills ({billAlertsCount})
              {activeTab === "bills" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff859d]" />
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f7fb] text-[#77738a] dark:bg-[#28214d] dark:text-[#a5a0ba]">
                  <BellOff size={28} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#2a234f] dark:text-[#f5f3fa]">
                  No notifications
                </h3>
                <p className="mt-1 max-w-xs text-xs text-[#77738a] dark:text-[#a5a0ba]">
                  {activeTab === "unread"
                    ? "You are all caught up! No unread notifications."
                    : activeTab === "budgets"
                    ? "All your budget categories are within safe limits."
                    : activeTab === "bills"
                    ? "No upcoming or overdue recurring bills."
                    : "No financial alerts or reminders right now."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const visual = getNotificationVisuals(item.type);
                const IconComponent = visual.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                      visual.cardBorder
                    } ${visual.cardBg} ${
                      !item.is_read
                        ? "shadow-sm ring-1 ring-[#ff859d]/30"
                        : "opacity-80 hover:opacity-100"
                    } hover:shadow-md hover:scale-[1.01]`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.badgeBg}`}
                      >
                        <IconComponent size={18} className={visual.iconColor} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${visual.badgeBg}`}
                          >
                            {visual.badgeLabel}
                          </span>

                          <span className="text-[11px] font-medium text-[#77738a] dark:text-[#a5a0ba]">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>

                        <h4 className="mt-1 text-sm font-semibold text-[#2a234f] dark:text-[#f5f3fa]">
                          {item.title}
                        </h4>

                        <p className="mt-0.5 text-xs leading-relaxed text-[#77738a] dark:text-[#a5a0ba]">
                          {item.message}
                        </p>

                        {/* Action Link indicator */}
                        {item.link && (
                          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[#2a234f] transition group-hover:text-[#ff859d] dark:text-[#f5f3fa] dark:group-hover:text-[#ffb3c3]">
                            <span>View details</span>
                            <ExternalLink size={12} />
                          </div>
                        )}
                      </div>

                      {/* Right action / unread indicator */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {!item.is_read ? (
                          <span
                            title="Unread"
                            className="h-2.5 w-2.5 rounded-full bg-[#ff859d] ring-2 ring-white dark:ring-[#1a1438]"
                          />
                        ) : null}

                        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          {!item.is_read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(item.id);
                              }}
                              title="Mark as read"
                              className="rounded-lg p-1 text-[#77738a] hover:bg-white hover:text-emerald-600 dark:text-[#a5a0ba] dark:hover:bg-[#28214d] dark:hover:text-emerald-400"
                            >
                              <Check size={14} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(item.id);
                            }}
                            title="Dismiss notification"
                            className="rounded-lg p-1 text-[#77738a] hover:bg-white hover:text-rose-600 dark:text-[#a5a0ba] dark:hover:bg-[#28214d] dark:hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[#e8e5ef] p-4 flex items-center justify-between dark:border-[#2e265c] bg-[#f8f7fb]/60 dark:bg-[#1f193d]/50">
              {readCount > 0 ? (
                <button
                  type="button"
                  onClick={() => clearAll(true)}
                  className="text-xs font-semibold text-[#77738a] transition hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-[#f5f3fa]"
                >
                  Clear read alerts ({readCount})
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => clearAll(false)}
                className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
              >
                Clear all
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
