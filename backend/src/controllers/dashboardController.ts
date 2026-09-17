import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import { getDashboardData } from "../services/dashboardService.js";

const VALID_PERIODS = new Set([
  "this-month",
  "previous-month",
  "last-3-months",
  "last-6-months",
  "this-year",
]);

export async function getDashboardController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;

    const period =
      typeof req.query.period === "string"
        ? req.query.period
        : "this-month";

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!VALID_PERIODS.has(period)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid period. Use this-month, previous-month, last-3-months, last-6-months, or this-year.",
      });
      return;
    }

    const family = await getFamilyForUser(userId);

    if (!family) {
      res.status(403).json({
        success: false,
        message: "User does not belong to a family.",
      });
      return;
    }

    const data = await getDashboardData(
      family.family_id,
      period,
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch dashboard data:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data.",
    });
  }
}