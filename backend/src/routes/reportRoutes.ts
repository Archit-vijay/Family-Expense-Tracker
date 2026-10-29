import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  getReportPreviewController,
  exportReportController,
} from "../controllers/reportController.js";

const router = Router();

router.get(
  "/preview",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  getReportPreviewController,
);

router.get(
  "/export",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  exportReportController,
);

export default router;
