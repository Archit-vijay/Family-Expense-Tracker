import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";

type FamilyRole = "admin" | "member" | "viewer";

export function requireRole(...allowedRoles: FamilyRole[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
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

      if (!allowedRoles.includes(family.role as FamilyRole)) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
        });

        return;
      }

      next();
    } catch (error) {
      console.error(
        "Failed to verify family role:",
        error,
      );

      res.status(500).json({
        success: false,
        message: "Failed to verify permissions.",
      });
    }
  };
}