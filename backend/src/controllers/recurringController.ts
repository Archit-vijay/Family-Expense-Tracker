import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactions,
  processDueRecurringTransactions,
  recordSingleRecurringNow,
  togglePauseRecurring,
  updateRecurringTransaction,
} from "../services/recurringService.js";

export async function getRecurringController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const { status, type, isSubscription } = req.query;

    const data = await getRecurringTransactions(family.family_id, {
      status: status ? String(status) : undefined,
      type: type ? String(type) : undefined,
      isSubscription:
        isSubscription !== undefined
          ? isSubscription === "true" || isSubscription === "1"
          : undefined,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Failed to retrieve recurring transactions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve recurring transactions.",
    });
  }
}

export async function createRecurringController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const {
      title,
      amount,
      type,
      frequency,
      categoryId,
      memberId,
      startDate,
      endDate,
      isSubscription,
    } = req.body;

    const result = await createRecurringTransaction(family.family_id, userId, {
      title,
      amount: Number(amount),
      type,
      frequency,
      categoryId: Number(categoryId),
      memberId: Number(memberId),
      startDate,
      endDate: endDate || null,
      isSubscription: Boolean(isSubscription),
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "Recurring schedule created successfully.",
    });
  } catch (error: any) {
    console.error("Failed to create recurring transaction:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create recurring transaction.",
    });
  }
}

export async function updateRecurringController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const rawId = req.params.id;
    const id = parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid recurring ID." });
      return;
    }

    const result = await updateRecurringTransaction(id, family.family_id, req.body);

    res.json({
      success: true,
      data: result,
      message: "Recurring schedule updated successfully.",
    });
  } catch (error: any) {
    console.error("Failed to update recurring transaction:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update recurring transaction.",
    });
  }
}

export async function deleteRecurringController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const rawId = req.params.id;
    const id = parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid recurring ID." });
      return;
    }

    await deleteRecurringTransaction(id, family.family_id);

    res.json({
      success: true,
      message: "Recurring schedule removed.",
    });
  } catch (error: any) {
    console.error("Failed to delete recurring transaction:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete recurring schedule.",
    });
  }
}

export async function togglePauseRecurringController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const rawId = req.params.id;
    const id = parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid recurring ID." });
      return;
    }

    const pause = req.path.endsWith("/pause");
    const result = await togglePauseRecurring(id, family.family_id, pause);

    res.json({
      success: true,
      data: result,
      message: pause ? "Recurring schedule paused." : "Recurring schedule resumed.",
    });
  } catch (error: any) {
    console.error("Failed to toggle pause status:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update status.",
    });
  }
}

export async function processDueRecurringController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const result = await processDueRecurringTransactions(family.family_id);

    res.json({
      success: true,
      data: result,
      message: `Processed ${result.processedCount} due recurring transactions.`,
    });
  } catch (error: any) {
    console.error("Failed to process due recurring transactions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process due recurring transactions.",
    });
  }
}

export async function recordSingleRecurringNowController(
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
      res.status(404).json({ success: false, message: "Family not found." });
      return;
    }

    const rawId = req.params.id;
    const id = parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid recurring ID." });
      return;
    }

    const result = await recordSingleRecurringNow(id, family.family_id, userId);

    res.json({
      success: true,
      data: result,
      message: "Transaction logged successfully and next due date updated.",
    });
  } catch (error: any) {
    console.error("Failed to record recurring transaction now:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to record transaction now.",
    });
  }
}
