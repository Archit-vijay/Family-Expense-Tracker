import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import {
  getBudgetsWithSpending,
  createBudget,
  updateBudget,
  deleteBudget,
  copyPreviousMonthBudgets,
  applyBudgetBatch,
} from "../services/budgetService.js";

export async function getBudgetsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const now = new Date();
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : now.getUTCMonth() + 1;
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : now.getUTCFullYear();

    if (isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, message: "Invalid month parameter." });
      return;
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ success: false, message: "Invalid year parameter." });
      return;
    }

    const summary = await getBudgetsWithSpending(family.family_id, month, year);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("Failed to fetch budgets:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch budgets.",
    });
  }
}

export async function createBudgetController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const { categoryId, amount, month, year } = req.body;

    if (!categoryId || typeof categoryId !== "number") {
      res.status(400).json({ success: false, message: "Valid categoryId is required." });
      return;
    }

    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ success: false, message: "Amount must be a positive number." });
      return;
    }

    if (!month || typeof month !== "number" || month < 1 || month > 12) {
      res.status(400).json({ success: false, message: "Month must be between 1 and 12." });
      return;
    }

    if (!year || typeof year !== "number" || year < 2000) {
      res.status(400).json({ success: false, message: "Year must be 2000 or later." });
      return;
    }

    const newBudget = await createBudget({
      familyId: family.family_id,
      categoryId,
      amount,
      month,
      year,
    });

    res.status(201).json({
      success: true,
      data: newBudget,
      message: "Budget limit created successfully.",
    });
  } catch (error: any) {
    console.error("Failed to create budget:", error);
    const statusCode = error?.message?.includes("already exists") ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: error?.message || "Failed to create budget.",
    });
  }
}

export async function updateBudgetController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ success: false, message: "Valid budget ID is required." });
      return;
    }

    const { amount } = req.body;
    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ success: false, message: "Amount must be a positive number." });
      return;
    }

    const updated = await updateBudget({
      id,
      familyId: family.family_id,
      amount,
    });

    res.json({
      success: true,
      data: updated,
      message: "Budget limit updated successfully.",
    });
  } catch (error: any) {
    console.error("Failed to update budget:", error);
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to update budget.",
    });
  }
}

export async function deleteBudgetController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ success: false, message: "Valid budget ID is required." });
      return;
    }

    const deleted = await deleteBudget(id, family.family_id);

    res.json({
      success: true,
      data: deleted,
      message: "Budget limit deleted successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete budget:", error);
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to delete budget.",
    });
  }
}

export async function copyPreviousMonthBudgetsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const { sourceMonth, sourceYear, targetMonth, targetYear } = req.body;

    if (!sourceMonth || !sourceYear || !targetMonth || !targetYear) {
      res.status(400).json({
        success: false,
        message: "sourceMonth, sourceYear, targetMonth, and targetYear are required.",
      });
      return;
    }

    const result = await copyPreviousMonthBudgets(
      family.family_id,
      Number(sourceMonth),
      Number(sourceYear),
      Number(targetMonth),
      Number(targetYear),
    );

    res.json({
      success: true,
      data: result,
      message: `Copied ${result.copiedCount} category budget(s) from ${sourceMonth}/${sourceYear}.`,
    });
  } catch (error: any) {
    console.error("Failed to copy budgets:", error);
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to copy budgets.",
    });
  }
}

export async function applyBudgetBatchController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const { budgets } = req.body;
    if (!Array.isArray(budgets) || budgets.length === 0) {
      res.status(400).json({
        success: false,
        message: "An array of budgets is required.",
      });
      return;
    }

    const result = await applyBudgetBatch(family.family_id, budgets);

    res.json({
      success: true,
      data: result,
      message: `Applied ${result.appliedCount} category budget(s) successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to apply budget batch:", error);
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to apply budgets.",
    });
  }
}

