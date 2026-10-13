import { Router } from "express";

import { chatWithAIController } from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/chat",
  authMiddleware,
  chatWithAIController,
);

export default router;