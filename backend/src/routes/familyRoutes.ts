import { Router } from "express";

import {
  getMyFamilyController,
} from "../controllers/familyController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  getMyFamilyController,
);

export default router;