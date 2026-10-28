import type { Response } from "express";

import { getTransactions, createTransaction, updateTransaction, deactivateTransaction, deactivateTransactions } from "../services/transactionService.js";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";

export async function getTransactionsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;

    if(!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const family = await getFamilyForUser(userId);

    if(!family) {
      res.status(403).json({
        success: false,
        message: "User does not belong to a family.",
      });
      return;
    }

    const transactions = await getTransactions(family.family_id);

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

export async function updateTransactionController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId)) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });

      return;
    }

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

    const transaction = await updateTransaction(
      transactionId,
      {
        familyId: family.family_id,
        memberId,
        categoryId,
        title,
        amount,
        type,
        transactionDate,
      },
    );

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });

      return;
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to update transaction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update transaction.",
    });
  }
}

export async function deactivateTransactionController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId)) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });

      return;
    }

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

    const transaction = await deactivateTransaction(
      family.family_id,
      transactionId,
    );

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });

      return;
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to remove transaction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove transaction.",
    });
  }
}

export async function bulkDeactivateTransactionsController(
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
      res.status(403).json({
        success: false,
        message: "User does not belong to a family.",
      });
      return;
    }

    const { transactionIds } = req.body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "transactionIds must be a non-empty array of transaction IDs.",
      });
      return;
    }

    const validIds = transactionIds.map(Number).filter(id => Number.isInteger(id) && id > 0);

    if (validIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid transaction IDs provided.",
      });
      return;
    }

    const deactivated = await deactivateTransactions(
      family.family_id,
      validIds,
    );

    res.json({
      success: true,
      count: deactivated.length,
      data: deactivated,
      message: `Successfully removed ${deactivated.length} transaction(s).`,
    });
  } catch (error) {
    console.error("Failed to bulk remove transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove transactions.",
    });
  }
}


import { parseStatementFile } from "../services/statementParserService.js";
import {
  categorizeAndDeduplicateTransactions,
  saveLearnedMerchantMappings,
} from "../services/statementCategorizerService.js";
import { createTransactionsBatch } from "../services/transactionService.js";
import pool from "../config/database.js";

export async function parseStatementController(
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

    const file = (req as any).file;
    if (!file || !file.buffer) {
      res.status(400).json({
        success: false,
        message: "No statement file provided. Please upload a .csv, .xlsx, .xls, or .pdf file.",
      });
      return;
    }

    const password = req.body?.password ? String(req.body.password).trim() : undefined;

    // 1. Parse statement buffer (handles password detection & decrypt)
    const parseResult = await parseStatementFile(file.buffer, file.originalname, password);

    if (!parseResult.success && parseResult.requiresPassword) {
      res.json({
        success: false,
        requiresPassword: true,
        invalidPassword: parseResult.invalidPassword,
        fileType: parseResult.fileType,
        fileName: parseResult.fileName,
        message: parseResult.error || "This statement is encrypted with a password.",
      });
      return;
    }

    if (parseResult.transactions.length === 0) {
      res.json({
        success: true,
        fileType: parseResult.fileType,
        fileName: parseResult.fileName,
        transactions: [],
        summary: {
          totalCount: 0,
          newCount: 0,
          duplicatesCount: 0,
          totalExpenseAmount: 0,
          totalIncomeAmount: 0,
        },
        message: "No transactions could be detected in this file. Please verify the format.",
      });
      return;
    }

    // 2. Auto-categorize and deduplicate against existing family records
    const categorized = await categorizeAndDeduplicateTransactions(
      family.family_id,
      parseResult.transactions,
    );

    res.json({
      success: true,
      fileType: parseResult.fileType,
      fileName: parseResult.fileName,
      transactions: categorized.transactions,
      summary: categorized.summary,
    });
  } catch (error: any) {
    console.error("Statement parsing error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to parse bank statement file.",
    });
  }
}

export async function commitImportController(
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

    const { memberId, transactions, rememberMappings } = req.body;

    if (!memberId || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        message: "A valid family member and a non-empty array of transactions are required.",
      });
      return;
    }

    // Verify member belongs to family
    const memberCheck = await pool.query(
      `SELECT id FROM family_members WHERE id = $1 AND family_id = $2 AND is_active = TRUE`,
      [memberId, family.family_id],
    );

    if (memberCheck.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected family member is invalid or not in your family.",
      });
      return;
    }

    // Insert batch
    const insertedIds = await createTransactionsBatch(
      family.family_id,
      Number(memberId),
      userId,
      transactions.map((t: any) => ({
        title: String(t.title || "Transaction"),
        amount: Number(t.amount),
        type: t.type === "income" ? "income" : "expense",
        transactionDate: String(t.transactionDate),
        categoryId: Number(t.categoryId),
      })),
    );

    // Save learned merchant mappings if requested (defaults to true)
    if (rememberMappings !== false) {
      const mappingsToLearn = transactions
        .filter((t: any) => t.title && t.categoryId)
        .map((t: any) => ({
          merchantPattern: String(t.title),
          categoryId: Number(t.categoryId),
        }));

      await saveLearnedMerchantMappings(family.family_id, mappingsToLearn).catch((err) =>
        console.error("Failed to save learned merchant mappings:", err),
      );
    }

    res.json({
      success: true,
      count: insertedIds.length,
      message: `Successfully imported ${insertedIds.length} transaction(s).`,
    });
  } catch (error: any) {
    console.error("Failed to commit imported transactions:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to commit imported transactions.",
    });
  }
}
