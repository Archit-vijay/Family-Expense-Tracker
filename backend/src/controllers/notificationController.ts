import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import {
  syncFinancialAlerts,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../services/notificationService.js";

export async function getNotificationsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    // Optional query param: skipSync=true if callers don't want to run the alert engine
    const skipSync = req.query.skipSync === "true";
    if (!skipSync) {
      await syncFinancialAlerts(family.family_id);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const type = req.query.type as string | undefined;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await getNotifications(family.family_id, {
      limit: isNaN(limit) ? 50 : Math.min(limit, 100),
      offset: isNaN(offset) ? 0 : offset,
      type,
      unreadOnly,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getNotificationsController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
}

export async function markAsReadController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const notificationId = parseInt(req.params.id as string, 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ success: false, message: "Invalid notification ID." });
      return;
    }

    const updated = await markNotificationAsRead(family.family_id, notificationId);
    if (!updated) {
      res.status(404).json({ success: false, message: "Notification not found." });
      return;
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error in markAsReadController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
}

export async function markAllAsReadController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const updatedCount = await markAllNotificationsAsRead(family.family_id);

    res.json({
      success: true,
      message: "All notifications marked as read.",
      data: { updatedCount },
    });
  } catch (error) {
    console.error("Error in markAllAsReadController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
}

export async function deleteNotificationController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const notificationId = parseInt(req.params.id as string, 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ success: false, message: "Invalid notification ID." });
      return;
    }

    const deleted = await deleteNotification(family.family_id, notificationId);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Notification not found." });
      return;
    }

    res.json({
      success: true,
      message: "Notification removed.",
    });
  } catch (error) {
    console.error("Error in deleteNotificationController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
}

export async function clearAllNotificationsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const onlyRead = req.query.onlyRead === "true";
    const deletedCount = await clearAllNotifications(family.family_id, onlyRead);

    res.json({
      success: true,
      message: onlyRead ? "Read notifications cleared." : "All notifications cleared.",
      data: { deletedCount },
    });
  } catch (error) {
    console.error("Error in clearAllNotificationsController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications.",
    });
  }
}
