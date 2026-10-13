import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { generateAIResponse } from "../services/aiService.js";
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

    res.status(500).json({
      success: false,
      message: "Failed to generate AI response.",
    });
  }
}