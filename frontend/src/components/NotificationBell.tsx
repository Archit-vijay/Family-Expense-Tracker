import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

interface NotificationBellProps {
  variant?: "icon" | "sidebar";
  isCollapsed?: boolean;
  className?: string;
}

export default function NotificationBell({
  variant = "icon",
  isCollapsed = false,
  className = "",
}: NotificationBellProps) {
  const { unreadCount, openDrawer } = useNotifications();

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={openDrawer}
        title={isCollapsed ? `Notifications (${unreadCount} unread)` : undefined}
        className={`group relative flex w-full items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
          isCollapsed ? "justify-center px-3" : "gap-3 px-3.5"
        } text-white/70 hover:translate-x-1 hover:bg-white/10 hover:text-white ${className}`}
      >
        <div className="relative flex items-center justify-center">
          <Bell size={19} className="transition-transform duration-200 group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ffb3c3] px-1 text-[10px] font-bold text-[#2a234f] shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex flex-1 items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#ffb3c3] px-2 py-0.5 text-[11px] font-bold text-[#2a234f]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8e5ef] bg-white text-[#2a234f] shadow-sm transition-all duration-200 hover:border-[#ffb3c3] hover:bg-[#f8f7fb] hover:scale-105 active:scale-95 dark:border-[#2e265c] dark:bg-[#1f193d] dark:text-[#f5f3fa] dark:hover:bg-[#28214d] ${className}`}
    >
      <Bell size={19} className="transition-transform duration-200 hover:rotate-12" />

      {unreadCount > 0 && (
        <>
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff859d] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#1f193d]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] animate-ping rounded-full bg-[#ff859d] opacity-40" />
        </>
      )}
    </button>
  );
}
