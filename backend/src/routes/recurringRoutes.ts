import { Router } from "express";
import {
  createRecurringController,
  deleteRecurringController,
  getRecurringController,
  processDueRecurringController,
  recordSingleRecurringNowController,
  togglePauseRecurringController,
  updateRecurringController,
} from "../controllers/recurringController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = Router();

// Retrieve recurring transactions (viewers, members, admins)
router.get("/", authMiddleware, getRecurringController);

// Manage recurring transactions (members and admins)
router.post(
  "/",
  authMiddleware,
  requireRole("admin", "member"),
  createRecurringController,
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole("admin", "member"),
  updateRecurringController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin", "member"),
  deleteRecurringController,
);

router.post(
  "/:id/pause",
  authMiddleware,
  requireRole("admin", "member"),
  togglePauseRecurringController,
);

router.post(
  "/:id/resume",
  authMiddleware,
  requireRole("admin", "member"),
  togglePauseRecurringController,
);

router.post(
  "/:id/record-now",
  authMiddleware,
  requireRole("admin", "member"),
  recordSingleRecurringNowController,
);

router.post(
  "/process-due",
  authMiddleware,
  requireRole("admin", "member"),
  processDueRecurringController,
);

export default router;
