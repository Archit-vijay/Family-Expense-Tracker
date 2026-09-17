import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

import { getFamilyForUser } from "../services/familyService.js";

import {
  createFamilyInvitation,
  getInvitationByToken,
  acceptFamilyInvitation,
} from "../services/invitationService.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

const jwtSecret: string = JWT_SECRET;

export async function createInvitationController(
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

    if (family.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only family admins can send invitations.",
      });

      return;
    }

    const memberId = Number(req.body?.memberId);

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!Number.isInteger(memberId)) {
      res.status(400).json({
        success: false,
        message: "A valid family member ID is required.",
      });

      return;
    }

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required.",
      });

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });

      return;
    }

    try {
      const invitation = await createFamilyInvitation(
        family.family_id,
        memberId,
        email,
      );

      res.status(201).json({
        success: true,
        data: {
          id: invitation.id,
          familyMemberId: invitation.family_member_id,
          memberName: invitation.memberName,
          email: invitation.email,
          token: invitation.token,
          expiresAt: invitation.expires_at,
          createdAt: invitation.created_at,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Family member not found." ||
          error.message ===
            "This family member already has an account." ||
          error.message ===
            "An account already exists with this email."
        ) {
          res.status(400).json({
            success: false,
            message: error.message,
          });

          return;
        }
      }

      throw error;
    }
  } catch (error) {
    console.error(
      "Failed to create family invitation:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to create family invitation.",
    });
  }
}

export async function getInvitationController(
  req: Request,
  res: Response,
) {
  try {
    const token =
      typeof req.params.token === "string"
        ? req.params.token.trim()
        : "";

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Invitation token is required.",
      });

      return;
    }

    const invitation =
      await getInvitationByToken(token);

    if (!invitation) {
      res.status(404).json({
        success: false,
        message: "Invitation not found.",
      });

      return;
    }

    if (invitation.accepted_at) {
      res.status(400).json({
        success: false,
        message: "This invitation has already been accepted.",
      });

      return;
    }

    if (
      new Date(invitation.expires_at).getTime() <=
      Date.now()
    ) {
      res.status(400).json({
        success: false,
        message: "This invitation has expired.",
      });

      return;
    }

    res.json({
      success: true,
      data: {
        familyMemberId: invitation.family_member_id,
        memberName: invitation.member_name,
        email: invitation.email,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error(
      "Failed to get invitation:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to get invitation.",
    });
  }
}

export async function acceptInvitationController(
  req: Request,
  res: Response,
) {
  try {
    const token =
      typeof req.body?.token === "string"
        ? req.body.token.trim()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Invitation token is required.",
      });

      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: "Password is required.",
      });

      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });

      return;
    }

    try {
      const result =
        await acceptFamilyInvitation(
          token,
          password,
        );

      const authToken = jwt.sign(
        {
          userId: result.user.id,
        },
        jwtSecret,
        {
          expiresIn: "7d",
        },
      );

      res.status(201).json({
        success: true,
        message:
          "Family account created successfully.",
        data: {
          token: authToken,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        const clientErrors = [
          "Invitation not found.",
          "This invitation has already been accepted.",
          "This invitation has expired.",
          "This family member already has an account.",
          "An account already exists with this email.",
        ];

        if (clientErrors.includes(error.message)) {
          res.status(400).json({
            success: false,
            message: error.message,
          });

          return;
        }
      }

      throw error;
    }
  } catch (error) {
    console.error(
      "Failed to accept family invitation:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create family account.",
    });
  }
}