import { Router } from "express";

import {
  getFamilyMembersController,
  createFamilyMemberController,
  updateFamilyMemberController,
  deactivateFamilyMemberController,

} from "../controllers/familyMemberController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getFamilyMembersController);

router.post("/", authMiddleware, createFamilyMemberController);

router.put("/:id", authMiddleware, updateFamilyMemberController);

router.delete("/:id", authMiddleware, deactivateFamilyMemberController);

export default router;