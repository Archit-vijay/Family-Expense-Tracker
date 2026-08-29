import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import { getCategories } from "../services/categoryService.js";

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