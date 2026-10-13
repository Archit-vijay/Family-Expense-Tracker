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

export interface AIInsightHighlight {
  type: "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

export interface AIInsightsResult {
  summary: string;
  highlights: AIInsightHighlight[];
  recommendations: string[];
}

function generateDeterministicFallbackInsights(
  metrics: import("./insightsService.js").DeterministicFinancialMetrics,
): AIInsightsResult {
  const { current, previous } = metrics.period;
  const expChange = metrics.expenses.changePercentage;
  const isExpDown = metrics.expenses.changeAmount < 0;

  const summary = isExpDown
    ? `Total spending in ${current.label} was ₹${metrics.expenses.current.toLocaleString("en-IN")}, down ${Math.abs(expChange)}% compared to ₹${metrics.expenses.previous.toLocaleString("en-IN")} in ${previous.label}.`
    : `Total spending in ${current.label} was ₹${metrics.expenses.current.toLocaleString("en-IN")}, up ${expChange}% compared to ₹${metrics.expenses.previous.toLocaleString("en-IN")} in ${previous.label}.`;

  const highlights: AIInsightHighlight[] = [];

  // Spending trend highlight
  if (isExpDown) {
    highlights.push({
      type: "positive",
      title: "Reduced Overall Spending",
      description: `Expenses decreased by ₹${Math.abs(metrics.expenses.changeAmount).toLocaleString("en-IN")} (${Math.abs(expChange)}%) compared to ${previous.label}.`,
    });
  } else if (expChange > 10) {
    highlights.push({
      type: "warning",
      title: "Increased Monthly Spending",
      description: `Expenses increased by ₹${metrics.expenses.changeAmount.toLocaleString("en-IN")} (+${expChange}%) compared to ${previous.label}.`,
    });
  }

  // Savings rate highlight
  if (metrics.savingsRate.current >= 20) {
    highlights.push({
      type: "positive",
      title: "Healthy Savings Rate",
      description: `The family retained ${metrics.savingsRate.current}% of total income in savings during ${current.label}.`,
    });
  } else if (metrics.savingsRate.current < 10 && metrics.income.current > 0) {
    highlights.push({
      type: "warning",
      title: "Low Savings Buffer",
      description: `Current savings rate is ${metrics.savingsRate.current}%, leaving a narrower buffer for unexpected expenses.`,
    });
  }

  // Top category highlight
  if (metrics.topCategory) {
    highlights.push({
      type: "neutral",
      title: `Top Category: ${metrics.topCategory.name}`,
      description: `${metrics.topCategory.name} accounted for ₹${metrics.topCategory.currentAmount.toLocaleString("en-IN")} (${metrics.topCategory.percentageOfTotal}% of total spending).`,
    });
  }

  // Category spikes
  for (const spike of metrics.categorySpikes.slice(0, 2)) {
    highlights.push({
      type: "warning",
      title: `${spike.name} Spending Surge`,
      description: `${spike.name} spending jumped by ${spike.changePercentage}% (+₹${spike.changeAmount.toLocaleString("en-IN")}) this period.`,
    });
  }

  const recommendations: string[] = [];
  if (metrics.categorySpikes.length > 0) {
    recommendations.push(
      `Review recent expenses in ${metrics.categorySpikes[0].name} to see if recent spikes were planned or recurring.`,
    );
  }
  if (metrics.savingsRate.current < 20 && metrics.income.current > 0) {
    recommendations.push(
      "Aim to reserve at least 20% of monthly family income for savings and emergencies.",
    );
  } else {
    recommendations.push(
      "Maintain the current spending pace to keep your monthly savings on track.",
    );
  }

  return {
    summary,
    highlights: highlights.slice(0, 4),
    recommendations: recommendations.slice(0, 2),
  };
}

export async function generateFinancialInsights(
  metrics: import("./insightsService.js").DeterministicFinancialMetrics,
): Promise<AIInsightsResult> {
  if (!metrics.hasEnoughData) {
    return {
      summary: "There is not enough transaction data yet for this period to generate AI insights.",
      highlights: [],
      recommendations: [
        "Add family income and expense transactions to start receiving intelligent insights.",
      ],
    };
  }

  const metricsPrompt = [
    `Current Period: ${metrics.period.current.label} (${metrics.period.current.startDate} to ${metrics.period.current.endDate})`,
    `Previous Comparison Period: ${metrics.period.previous.label} (${metrics.period.previous.startDate} to ${metrics.period.previous.endDate})`,
    `Total Expenses: Current ₹${metrics.expenses.current.toLocaleString("en-IN")} vs Previous ₹${metrics.expenses.previous.toLocaleString("en-IN")} (Change: ${metrics.expenses.changePercentage > 0 ? "+" : ""}${metrics.expenses.changePercentage}%, Trend: ${metrics.expenses.trend})`,
    `Total Income: Current ₹${metrics.income.current.toLocaleString("en-IN")} vs Previous ₹${metrics.income.previous.toLocaleString("en-IN")} (Change: ${metrics.income.changePercentage > 0 ? "+" : ""}${metrics.income.changePercentage}%)`,
    `Net Savings: Current ₹${metrics.netSavings.current.toLocaleString("en-IN")} (Savings Rate: ${metrics.savingsRate.current}% vs Previous ${metrics.savingsRate.previous}%)`,
    metrics.topCategory
      ? `Top Expense Category: ${metrics.topCategory.name} at ₹${metrics.topCategory.currentAmount.toLocaleString("en-IN")} (${metrics.topCategory.percentageOfTotal}% of total expenses, change vs prev: ${metrics.topCategory.changePercentage > 0 ? "+" : ""}${metrics.topCategory.changePercentage}%)`
      : null,
    metrics.categorySpikes.length > 0
      ? `Notable Category Spikes: ${metrics.categorySpikes.map((s) => `${s.name} (+${s.changePercentage}%, +₹${s.changeAmount.toLocaleString("en-IN")})`).join("; ")}`
      : "No unusual category spikes detected.",
    metrics.topSpender
      ? `Top Spender: ${metrics.topSpender.name} with ₹${metrics.topSpender.currentAmount.toLocaleString("en-IN")} (${metrics.topSpender.percentageOfTotal}% of family expenses)`
      : null,
    `Transaction Count: ${metrics.transactionStats.totalCount} transactions, Average expense: ₹${metrics.transactionStats.averageExpense.toLocaleString("en-IN")}${metrics.transactionStats.largestExpense ? `, Largest single expense: ₹${metrics.transactionStats.largestExpense.amount.toLocaleString("en-IN")} ('${metrics.transactionStats.largestExpense.title}' in ${metrics.transactionStats.largestExpense.category})` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    "You are a family financial advisor. You analyze pre-calculated, authoritative financial metrics and provide structured, encouraging, and actionable insights.\n" +
    "CRITICAL RULES:\n" +
    "1. Never recalculate or invent financial numbers. Use the exact numbers and percentages from the provided metrics.\n" +
    "2. All currency amounts must use the ₹ symbol.\n" +
    "3. Output ONLY a valid JSON object matching this exact schema:\n" +
    "{\n" +
    '  "summary": "1-2 sentence executive summary of spending and savings health.",\n' +
    '  "highlights": [\n' +
    "    {\n" +
    '      "type": "positive" | "warning" | "neutral",\n' +
    '      "title": "Short title (3-5 words)",\n' +
    '      "description": "1-2 sentence explanation citing the verified figures."\n' +
    "    }\n" +
    "  ],\n" +
    '  "recommendations": [\n' +
    '    "1-2 actionable tips for the family."\n' +
    "  ]\n" +
    "}\n" +
    "Do NOT include any markdown code blocks, explanation text, or <think> tags. Return the raw JSON only.";

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please interpret these verified family metrics:\n\n${metricsPrompt}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.warn("Ollama insights call failed, using deterministic fallback.");
      return generateDeterministicFallbackInsights(metrics);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const rawContent = data.message?.content || "";
    const cleaned = cleanResponseContent(rawContent);

    // Try extracting JSON from output
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in LLM insights response, using deterministic fallback.");
      return generateDeterministicFallbackInsights(metrics);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<AIInsightsResult>;

    if (
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.highlights) &&
      Array.isArray(parsed.recommendations)
    ) {
      const sanitizedHighlights: AIInsightHighlight[] = parsed.highlights
        .filter((h) => h && typeof h.title === "string" && typeof h.description === "string")
        .map((h) => ({
          type: h.type === "positive" || h.type === "warning" ? h.type : "neutral",
          title: h.title,
          description: h.description,
        }));

      const sanitizedRecommendations: string[] = parsed.recommendations
        .filter((r) => typeof r === "string" && r.trim().length > 0)
        .map((r) => r.trim());

      return {
        summary: parsed.summary,
        highlights: sanitizedHighlights.length > 0 ? sanitizedHighlights : generateDeterministicFallbackInsights(metrics).highlights,
        recommendations: sanitizedRecommendations.length > 0 ? sanitizedRecommendations : generateDeterministicFallbackInsights(metrics).recommendations,
      };
    }

    return generateDeterministicFallbackInsights(metrics);
  } catch (error) {
    console.warn("Error calling LLM for insights, using deterministic fallback:", error);
    return generateDeterministicFallbackInsights(metrics);
  }
}