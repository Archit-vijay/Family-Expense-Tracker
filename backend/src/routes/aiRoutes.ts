import { Router } from "express";

import {
  chatWithAIController,
  getFinancialInsightsController,
} from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

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

export default router;