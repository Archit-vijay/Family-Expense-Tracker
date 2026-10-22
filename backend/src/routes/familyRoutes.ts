import { Router } from "express";

import {
  getMyFamilyController,
  createFamilyController,
  joinFamilyController,
  getFamilyCodeController,
  regenerateFamilyCodeController,
  renameFamilyController,
  exportTransactionsCSVController,
} from "../controllers/familyController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = Router();

// Base family endpoints
router.get(
  "/me",
  authMiddleware,
  getMyFamilyController,
);

router.post(
  "/create",
  authMiddleware,
  createFamilyController,
);

router.post(
  "/join",
  authMiddleware,
  joinFamilyController,
);

// Admin-only family rename
router.patch(
  "/name",
  authMiddleware,
  requireRole("admin"),
  renameFamilyController,
);

// Export transactions CSV
router.get(
  "/export",
  authMiddleware,
  exportTransactionsCSVController,
);

// Admin-only code management
router.get(
  "/code",
  authMiddleware,
  requireRole("admin"),
  getFamilyCodeController,
);

router.post(
  "/code/regenerate",
  authMiddleware,
  requireRole("admin"),
  regenerateFamilyCodeController,
);

export default router;
