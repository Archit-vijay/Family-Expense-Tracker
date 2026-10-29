import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  clearNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import type { NotificationItem } from "../types/notification";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshNotifications: (skipSync?: boolean) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: number) => Promise<void>;
  clearAll: (onlyRead?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const refreshNotifications = useCallback(
    async (skipSync = false) => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchNotifications({ limit: 50, skipSync });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  // Sync on login / user change
  useEffect(() => {
    if (user) {
      refreshNotifications();

      // Poll periodically (every 90s)
      const intervalId = setInterval(() => {
        refreshNotifications(true); // skip heavy alert recalculation on periodic background poll
      }, 90000);

      // Refresh on window focus
      const handleFocus = () => {
        refreshNotifications(false);
      };
      window.addEventListener("focus", handleFocus);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener("focus", handleFocus);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    }
  }, [user, refreshNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Re-sync on failure
      refreshNotifications(true);
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      refreshNotifications(true);
    }
  }, [refreshNotifications]);

  const dismissNotification = useCallback(async (id: number) => {
    // Optimistic update
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });

    try {
      await deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      refreshNotifications(true);
    }
  }, [refreshNotifications]);

  const clearAll = useCallback(
    async (onlyRead = false) => {
      // Optimistic update
      setNotifications((prev) => {
        if (onlyRead) {
          return prev.filter((n) => !n.is_read);
        }
        setUnreadCount(0);
        return [];
      });

      try {
        await clearNotifications(onlyRead);
      } catch (err) {
        console.error("Failed to clear notifications:", err);
        refreshNotifications(true);
      }
    },
    [refreshNotifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        setIsOpen,
        openDrawer,
        closeDrawer,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
