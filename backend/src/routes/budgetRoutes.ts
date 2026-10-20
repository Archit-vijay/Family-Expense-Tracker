import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  getBudgetsController,
  createBudgetController,
  updateBudgetController,
  deleteBudgetController,
  copyPreviousMonthBudgetsController,
} from "../controllers/budgetController.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  getBudgetsController,
);

router.post(
  "/",
  authMiddleware,
  requireRole("admin", "member"),
  createBudgetController,
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("admin", "member"),
  updateBudgetController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin", "member"),
  deleteBudgetController,
);

router.post(
  "/copy-previous",
  authMiddleware,
  requireRole("admin", "member"),
  copyPreviousMonthBudgetsController,
);

export default router;
