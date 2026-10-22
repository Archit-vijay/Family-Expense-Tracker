import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../services/categoryService.js";

export async function getCategoriesController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const family = await getFamilyForUser(userId);

    if (!family) {
      res.status(404).json({
        success: false,
        message: "Family not found.",
      });
      return;
    }

    const categories = await getCategories(
      family.family_id,
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
}

export async function createCategoryController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { name, type } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ success: false, message: "Category name is required." });
      return;
    }

    if (type !== "income" && type !== "expense") {
      res.status(400).json({ success: false, message: "Valid category type ('income' or 'expense') is required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const newCategory = await createCategory(family.family_id, name, type);
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: newCategory,
    });
  } catch (error: any) {
    console.error("Failed to create category:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create category.",
    });
  }
}

export async function deleteCategoryController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const categoryId = parseInt(idStr, 10);
    if (isNaN(categoryId)) {
      res.status(400).json({ success: false, message: "Invalid category ID." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const result = await deleteCategory(family.family_id, categoryId);
    res.json({
      success: true,
      message: `Category "${result.name}" deleted successfully.`,
      data: result,
    });
  } catch (error: any) {
    console.error("Failed to delete category:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete category.",
    });
  }
}
