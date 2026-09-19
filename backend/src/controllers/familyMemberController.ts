import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import { 
  getFamilyMembers,
  createFamilyMember, 
  updateFamilyMember, 
  deactivateFamilyMember, 
  updateFamilyMemberRole
} from "../services/familyMemberService.js";

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

export async function updateFamilyMemberRoleController(
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
        message: "Invalid family member ID.",
      });

      return;
    }

    const { role } = req.body;

    if (
      role !== "admin" &&
      role !== "member" &&
      role !== "viewer"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Role must be admin, member, or viewer.",
      });

      return;
    }

    const updatedMembership =
      await updateFamilyMemberRole(
        family.family_id,
        memberId,
        userId,
        role,
      );

    res.json({
      success: true,
      data: updatedMembership,
    });
  } catch (error) {
    console.error(
      "Failed to update family member role:",
      error,
    );

    if (
      error instanceof Error &&
      (
        error.message ===
          "You cannot change your own role." ||
        error.message ===
          "You cannot change the role of another admin."
      )
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });

      return;
    }

    if (
      error instanceof Error &&
      (
        error.message ===
          "Family member not found." ||
        error.message ===
          "This family member does not have a connected account." ||
        error.message ===
          "Family membership not found."
      )
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update family member role.",
    });
  }
}