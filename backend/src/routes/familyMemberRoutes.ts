import { Router } from "express";

import {
  getFamilyMembersController,
  createFamilyMemberController,
  updateFamilyMemberController,
  deactivateFamilyMemberController,
  updateFamilyMemberRoleController,
} from "../controllers/familyMemberController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getFamilyMembersController,
);

router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  createFamilyMemberController,
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  updateFamilyMemberController,
);

router.patch(
  "/:id/role",
  authMiddleware,
  requireRole("admin"),
  updateFamilyMemberRoleController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  deactivateFamilyMemberController,
);

export default router;