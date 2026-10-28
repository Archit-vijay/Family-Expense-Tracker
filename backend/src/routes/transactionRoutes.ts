import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

import {
  getTransactionsController,
  createTransactionController,
  updateTransactionController,
  deactivateTransactionController,
  bulkDeactivateTransactionsController,
  parseStatementController,
  commitImportController,
} from "../controllers/transactionController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max statement size
});

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  getTransactionsController,
);

router.post(
  "/",
  authMiddleware,
  requireRole("admin", "member"),
  createTransactionController,
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("admin", "member"),
  updateTransactionController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin", "member"),
  deactivateTransactionController,
);

router.post(
  "/bulk-delete",
  authMiddleware,
  requireRole("admin", "member"),
  bulkDeactivateTransactionsController,
);

router.post(
  "/import/parse",
  authMiddleware,
  requireRole("admin", "member"),
  upload.single("file"),
  parseStatementController,
);

router.post(
  "/import/commit",
  authMiddleware,
  requireRole("admin", "member"),
  commitImportController,
);

export default router;
