import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
} from "../config/ollama.js";

import { financialTools } from "./ai/tools.js";
import { executeFinancialTool } from "./ai/toolExecutor.js";

interface OllamaToolCall {
  function?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

interface OllamaMessage {
  role?: string;
  content?: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChatResponse {
  message?: OllamaMessage;
  error?: string;
}

function cleanResponseContent(content: string): string {
  if (!content) {
    return "";
  }

  if (content.includes("</think>")) {
    const afterThink = content.split("</think>").pop() || "";
    if (afterThink.trim().length > 0) {
      return afterThink.trim();
    }
  }

  const withoutThinking = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .trim();

  const cleaned = withoutThinking.replace(/<\/?think>/gi, "").trim();

  return cleaned.length > 0
    ? cleaned
    : content.replace(/<\/?think>/gi, "").trim();
}

export async function generateAIResponse(
  conversationMessages: OllamaMessage[],
  familyId: number,
): Promise<string> {
  const today = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
    },
  ).format(new Date());

  const messages: OllamaMessage[] = [
    {
      role: "system",
      content:
        "You are a financial assistant for a family expense tracking application. " +
        `Today's date is ${today}. ` +
        "The family's currency is INR (Indian Rupees). " +
        "When displaying monetary amounts, use the ₹ symbol and do not use $, USD, or other currency symbols. " +
        "You can answer questions about the user's family finances using the available financial tools. " +
        "Never invent financial numbers. " +
        "When financial information is needed, use the appropriate tool. " +
        "When a user refers to a time period such as today, yesterday, this week, last week, this month, last month, the last few months, the last two months, or a specific month, determine the appropriate date range using today's date and provide exact dates to the tool when available. " +
        "Keep responses concise and easy to read. " +
        "Do not use Markdown bold, headings, bullet symbols, or other Markdown formatting. " +
        "Use plain text only. " +
        "Do not use emojis unless the user explicitly asks for them. " +
        "Do not output any internal reasoning or <think> tags. Provide only the direct answer. " +
        "When answering a simple numerical question, give the answer directly in one or two sentences.",
    },
    ...conversationMessages.slice(-20),
  ];

  const MAX_ROUNDS = 4;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const isLastRound = round === MAX_ROUNDS - 1;

    const requestBody: Record<string, unknown> = {
      model: OLLAMA_MODEL,
      messages,
      stream: false,
    };

    if (!isLastRound) {
      requestBody.tools = financialTools;
    }

    const response = await fetch(
      `${OLLAMA_BASE_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data =
      (await response.json()) as OllamaChatResponse;

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to generate AI response.",
      );
    }

    if (!data.message) {
      throw new Error(
        "Ollama returned an invalid response.",
      );
    }

    const toolCalls = data.message.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const content = cleanResponseContent(
        data.message.content || "",
      );
      return content || "I was unable to generate a response.";
    }

    messages.push({
      role: "assistant",
      content: cleanResponseContent(data.message.content || ""),
      tool_calls: data.message.tool_calls,
    });

    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const toolName = toolCall.function?.name;

        if (!toolName) {
          return {
            role: "tool",
            content: JSON.stringify({
              error: "Missing tool name in tool call.",
            }),
          };
        }

        const toolArguments =
          toolCall.function?.arguments ?? {};

        console.log(`[AI Tool Call] ${toolName}:`, toolArguments);

        try {
          const toolResult = await executeFinancialTool(
            toolName,
            familyId,
            toolArguments,
          );

          console.log(`[AI Tool Result] ${toolName}:`, toolResult);

          return {
            role: "tool",
            content: JSON.stringify(toolResult),
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Tool execution failed.";

          console.warn(`[AI Tool Error] ${toolName}:`, errorMessage);

          return {
            role: "tool",
            content: JSON.stringify({
              error: errorMessage,
            }),
          };
        }
      }),
    );

    messages.push(...toolResults);
  }

  return "I was unable to complete the request within the allowed tool rounds.";
}