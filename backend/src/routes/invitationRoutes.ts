import { Router } from "express";

import {
  acceptInvitationController,
  createInvitationController,
  getInvitationController,
} from "../controllers/invitationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  createInvitationController,
);

router.get(
  "/:token",
  getInvitationController,
);

router.post(
  "/accept",
  acceptInvitationController,
);

export default router;