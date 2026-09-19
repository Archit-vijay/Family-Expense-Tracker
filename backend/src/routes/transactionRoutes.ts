import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

import {
  getTransactionsController,
  createTransactionController,
  updateTransactionController,
  deactivateTransactionController,
} from "../controllers/transactionController.js";

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

export default router;