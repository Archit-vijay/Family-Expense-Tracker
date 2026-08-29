import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import { getFamilyMembers, createFamilyMember, updateFamilyMember, deactivateFamilyMember} from "../services/familyMemberService.js";

export async function getFamilyMembersController(
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

    const members = await getFamilyMembers(
      family.family_id,
    );

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error(
      "Failed to fetch family members:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch family members.",
    });
  }
}

export async function createFamilyMemberController(
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

    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim()
        : "";

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Member name is required.",
      });
      return;
    }

    const member = await createFamilyMember(
      family.family_id,
      name,
    );

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error(
      "Failed to create family member:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to create family member.",
    });
  }
}

export async function updateFamilyMemberController(
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

    const memberId = Number(req.params.id);

    if (!Number.isInteger(memberId)) {
      res.status(400).json({
        success: false,
        message: "Invalid member ID.",
      });
      return;
    }

    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim()
        : "";

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Member name is required.",
      });
      return;
    }

    const member = await updateFamilyMember(
      family.family_id,
      memberId,
      name,
    );

    if (!member) {
      res.status(404).json({
        success: false,
        message: "Family member not found.",
      });
      return;
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error(
      "Failed to update family member:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to update family member.",
    });
  }
}

export async function deactivateFamilyMemberController(
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

    const memberId = Number(req.params.id);

    if (!Number.isInteger(memberId)) {
      res.status(400).json({
        success: false,
        message: "Invalid member ID.",
      });
      return;
    }

    const member = await deactivateFamilyMember(
      family.family_id,
      memberId,
    );

    if (!member) {
      res.status(404).json({
        success: false,
        message: "Family member not found.",
      });
      return;
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error(
      "Failed to deactivate family member:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to deactivate family member.",
    });
  }
}