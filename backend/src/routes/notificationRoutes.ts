import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  clearAllNotificationsController,
} from "../controllers/notificationController.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  getNotificationsController,
);

router.put(
  "/:id/read",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  markAsReadController,
);

router.post(
  "/read-all",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  markAllAsReadController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  deleteNotificationController,
);

router.delete(
  "/",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  clearAllNotificationsController,
);

export default router;
