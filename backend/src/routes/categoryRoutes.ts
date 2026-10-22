import { Router } from "express";

import {
  getCategoriesController,
  createCategoryController,
  deleteCategoryController,
} from "../controllers/categoryController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getCategoriesController,
);

router.post(
  "/",
  authMiddleware,
  requireRole("admin", "member"),
  createCategoryController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  deleteCategoryController,
);

export default router;
