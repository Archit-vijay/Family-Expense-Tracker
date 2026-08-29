import type { Request, Response } from "express";

import { getTransactions, createTransaction } from "../services/transactionService.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";

export async function getTransactionsController(
  _req: Request,
  res: Response,
) {
  try {
    const transactions = await getTransactions();

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
}

export async function createTransactionController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const {
      memberId,
      categoryId,
      title,
      amount,
      type,
      transactionDate,
    } = req.body;

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
      res.status(403).json({
        success: false,
        message: "User does not belong to a family.",
      });

      return;
    }

    if (
      !memberId ||
      !categoryId ||
      !title ||
      amount === undefined ||
      !type ||
      !transactionDate
    ) {
      res.status(400).json({
        success: false,
        message: "All transaction fields are required.",
      });

      return;
    }

    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be a positive number.",
      });

      return;
    }

    if (type !== "income" && type !== "expense") {
      res.status(400).json({
        success: false,
        message: "Transaction type must be income or expense.",
      });

      return;
    }

    const transaction = await createTransaction({
      familyId: family.family_id,
      memberId,
      categoryId,
      createdBy: userId,
      title,
      amount,
      type,
      transactionDate,
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to create transaction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create transaction.",
    });
  }
}