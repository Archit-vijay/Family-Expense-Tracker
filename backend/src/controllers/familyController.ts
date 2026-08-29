import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";

export async function getMyFamilyController(
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

    res.json({
      success: true,
      data: {
        familyId: family.family_id,
        role: family.role,
      },
    });
  } catch (error) {
    console.error("Failed to fetch family:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch family.",
    });
  }
}