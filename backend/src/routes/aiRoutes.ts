import { Router } from "express";

import {
  chatWithAIController,
  getFinancialInsightsController,
  getAIBudgetRecommendationsController,
  getAIBudgetRisksController,
} from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = Router();

router.post(
  "/chat",
  authMiddleware,
  chatWithAIController,
);

router.get(
  "/insights",
  authMiddleware,
  getFinancialInsightsController,
);

router.get(
  "/budget-recommendations",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  getAIBudgetRecommendationsController,
);

router.get(
  "/budget-risks",
  authMiddleware,
  requireRole("admin", "member", "viewer"),
  getAIBudgetRisksController,
);

export default router;
