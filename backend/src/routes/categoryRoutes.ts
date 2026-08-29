import { Router } from "express";

import {
  getCategoriesController,
} from "../controllers/categoryController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getCategoriesController,
);

export default router;