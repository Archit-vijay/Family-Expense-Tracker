import { Router } from "express";

import {
  acceptInvitationController,
  createInvitationController,
  getInvitationController,
} from "../controllers/invitationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
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