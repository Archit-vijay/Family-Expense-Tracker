import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  getFamilyForUser,
  createFamilyForUser,
  joinFamilyByCode,
  getFamilyCode,
  regenerateFamilyCode,
} from "../services/familyService.js";

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
        familyName: family.family_name,
        familyCode: family.family_code,
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

export async function createFamilyController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    const { familyName } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!familyName?.trim()) {
      res.status(400).json({
        success: false,
        message: "Family name is required.",
      });
      return;
    }

    const newFamily = await createFamilyForUser(userId, familyName.trim());

    res.status(201).json({
      success: true,
      message: "Family created successfully.",
      data: newFamily,
    });
  } catch (error: any) {
    console.error("Failed to create family:", error);

    res.status(400).json({
      success: false,
      message: error?.message || "Failed to create family.",
    });
  }
}

export async function joinFamilyController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    const { code } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!code?.trim()) {
      res.status(400).json({
        success: false,
        message: "Family code is required.",
      });
      return;
    }

    const result = await joinFamilyByCode(userId, code.trim());

    res.json({
      success: true,
      message: "Successfully joined family.",
      data: result,
    });
  } catch (error: any) {
    console.error("Failed to join family:", error);

    res.status(400).json({
      success: false,
      message: error?.message || "Failed to join family.",
    });
  }
}

export async function getFamilyCodeController(
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

    const code = await getFamilyCode(family.family_id);

    res.json({
      success: true,
      data: {
        code,
      },
    });
  } catch (error) {
    console.error("Failed to get family code:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get family code.",
    });
  }
}

export async function regenerateFamilyCodeController(
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

    const newCode = await regenerateFamilyCode(family.family_id);

    res.json({
      success: true,
      message: "Family code regenerated successfully.",
      data: {
        code: newCode,
      },
    });
  } catch (error) {
    console.error("Failed to regenerate family code:", error);

    res.status(500).json({
      success: false,
      message: "Failed to regenerate family code.",
    });
  }
}
