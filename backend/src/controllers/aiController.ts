import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  generateAIResponse,
  generateFinancialInsights,
} from "../services/aiService.js";
import { calculateDeterministicMetrics } from "../services/insightsService.js";
import { getFamilyForUser } from "../services/familyService.js";

export async function chatWithAIController(
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

    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Messages are required.",
      });

      return;
    }

    for (const message of messages) {
      if (
        !message ||
        (message.role !== "user" &&
          message.role !== "assistant") ||
        typeof message.content !== "string" ||
        message.content.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid message format.",
        });

        return;
      }
    }

    const response = await generateAIResponse(
      messages,
      family.family_id,
    );  

    res.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error(
      "Failed to generate AI response:",
      error,
    );

    const errCause = (error as { cause?: { code?: string; message?: string } })?.cause;
    const isConnectionError =
      error instanceof Error &&
      (error.message.includes("fetch failed") ||
        errCause?.code === "ECONNREFUSED" ||
        errCause?.message?.includes("ECONNREFUSED") ||
        String(errCause).includes("ECONNREFUSED"));

    const message = isConnectionError
      ? "Local AI service (Ollama) is offline or unreachable. Please make sure Ollama is running."
      : "Failed to generate AI response.";

    res.status(500).json({
      success: false,
      message,
    });
  }
}

export async function getFinancialInsightsController(
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

    const period = typeof req.query.period === "string" ? req.query.period : "this-month";

    const metrics = await calculateDeterministicMetrics(family.family_id, period);
    const aiInsights = await generateFinancialInsights(metrics);

    res.json({
      success: true,
      data: {
        metrics,
        aiInsights,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate financial insights:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate financial insights.",
    });
  }
}