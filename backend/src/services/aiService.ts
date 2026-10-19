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
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth();
  const currentMonthStart = new Date(Date.UTC(curYear, curMonth, 1))
    .toISOString()
    .slice(0, 10);
  const nextMonthStart = new Date(Date.UTC(curYear, curMonth + 1, 1))
    .toISOString()
    .slice(0, 10);
  const lastMonthStart = new Date(Date.UTC(curYear, curMonth - 1, 1))
    .toISOString()
    .slice(0, 10);

  const messages: OllamaMessage[] = [
    {
      role: "system",
      content:
        "You are a financial assistant for a family expense tracking application. " +
        `Today's date is ${today}. ` +
        `For 'this month' (the current month), use startDate: '${currentMonthStart}' and endDate: '${nextMonthStart}'. ` +
        `For 'last month', use startDate: '${lastMonthStart}' and endDate: '${currentMonthStart}'. ` +
        "The family's currency is INR (Indian Rupees). " +
        "When displaying monetary amounts, use the ₹ symbol and do not use $, USD, or other currency symbols. " +
        "CRITICAL RULES:\n" +
        "1. You have NO financial data stored in memory. You must NEVER state, guess, or invent any monetary amount or financial figure without first calling an authoritative financial tool.\n" +
        "2. For ANY question about finances, spending, expenses, income, earnings, or budgets—including short follow-up questions like 'what about income?', 'and expenses?', or 'how much did we earn?'—you MUST call a financial tool first (e.g. get_spending, get_income_summary, get_family_members_income, get_family_members_spending). Do NOT reply with text until you have tool results.\n" +
        "3. For verification questions like 'are you sure?', 'verify that', or 'check again', NEVER repeat previous text; you MUST re-call the appropriate financial tool.\n" +
        "4. Always use aggregation tools (get_spending, get_category_spending, get_family_members_spending, get_family_members_income, get_member_spending, get_member_income, get_income_summary) to answer spending or income questions.\n" +
        "5. When reporting member-wise spending or income, state each member's exact figure from the tool breakdown. Never say a member earned or spent nothing if their amount is greater than 0.\n" +
        "6. Never perform mental arithmetic or calculate totals by summing individual transactions from get_family_transactions. Use get_family_transactions ONLY when the user explicitly asks to view, list, or see recent individual transactions.\n" +
        "7. If a question cannot be answered by the available financial tools, state clearly that you do not have access to that information rather than guessing or attempting to calculate it yourself.\n" +
        "Keep responses concise and easy to read. Plain text only, no Markdown formatting, no emojis, no <think> tags. When answering a simple numerical question, give the answer directly in one or two sentences.",
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

      // Guardrail: If in round 0 the model outputs financial numbers without calling any tool, force a retry with a tool call reminder.
      const mentionsMoney =
        /(?:₹|\brupees?\b|\brs\.?\b|\bincome\b|\bspending\b|\bexpenses?\b)/i.test(
          content,
        ) && /\d+/.test(content);

      if (round === 0 && mentionsMoney && !isLastRound) {
        console.warn(
          "[AI Service] Model attempted to output financial numbers without calling a tool. Forcing tool retry.",
        );
        messages.push({
          role: "system",
          content:
            "CRITICAL: Do not guess numbers or reply with text yet. You MUST call an authoritative financial tool (such as get_income_summary or get_spending) to retrieve the real data.",
        });
        continue;
      }

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

export interface AIAnomalyExplanation {
  id: string;
  explanation: string;
}

export interface AIInsightsResult {
  summary: string;
  highlights: AIInsightHighlight[];
  recommendations: string[];
  anomalyExplanations?: AIAnomalyExplanation[];
  familyDynamicsNote?: string;
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

  const anomalyExplanations: AIAnomalyExplanation[] = (metrics.anomalies || []).map((a) => ({
    id: a.id,
    explanation: a.explanation,
  }));

  const familyDynamicsNote =
    metrics.familyDynamics?.observation ||
    (metrics.topSpender
      ? `${metrics.topSpender.name} accounted for ${metrics.topSpender.percentageOfTotal}% of total family spending this period.`
      : "Household spending is distributed across active members.");

  return {
    summary,
    highlights: highlights.slice(0, 4),
    recommendations: recommendations.slice(0, 2),
    anomalyExplanations,
    familyDynamicsNote,
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
      anomalyExplanations: [],
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
    metrics.members && metrics.members.length > 0
      ? `Family Member Contributions (${metrics.members.length} members):\n` +
        metrics.members
          .map(
            (m) =>
              `- ${m.name}: ₹${m.currentAmount.toLocaleString("en-IN")} (${m.percentageOfTotal}% of total expenses, change vs prev: ${m.changePercentage > 0 ? "+" : ""}${m.changePercentage}%, ${m.transactionCount} transactions${m.topCategory ? `, top area: ${m.topCategory.name} [${m.topCategory.percentage}%]` : ""})`,
          )
          .join("\n") +
        (metrics.familyDynamics ? `\nFamily Dynamics Baseline: ${metrics.familyDynamics.observation}` : "")
      : "No member expense records available.",
    `Transaction Count: ${metrics.transactionStats.totalCount} transactions, Average expense: ₹${metrics.transactionStats.averageExpense.toLocaleString("en-IN")}${metrics.transactionStats.largestExpense ? `, Largest single expense: ₹${metrics.transactionStats.largestExpense.amount.toLocaleString("en-IN")} ('${metrics.transactionStats.largestExpense.title}' in ${metrics.transactionStats.largestExpense.category})` : ""}`,
    metrics.anomalies && metrics.anomalies.length > 0
      ? `Detected Spending Anomalies:\n${metrics.anomalies.map((a) => `- [${a.id}] ${a.title} (${a.severity.toUpperCase()}): ${a.description}`).join("\n")}`
      : "No spending anomalies detected.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    "You are a family financial advisor. You analyze pre-calculated, authoritative financial metrics, member contributions, and detected anomalies, and provide structured, encouraging, and actionable insights.\n" +
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
    "  ],\n" +
    '  "anomalyExplanations": [\n' +
    "    {\n" +
    '      "id": "exact anomaly id string from prompt",\n' +
    '      "explanation": "1 concise sentence explaining this anomaly to the family in plain English and what to verify."\n' +
    "    }\n" +
    "  ],\n" +
    '  "familyDynamicsNote": "1-2 concise sentences analyzing the family\'s spending collaboration, member shifts, and primary expenditure drivers."\n' +
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
          { role: "user", content: `Please interpret these verified family metrics and anomalies:\n\n${metricsPrompt}` },
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

      let sanitizedAnomalyExplanations: AIAnomalyExplanation[] = [];
      if (Array.isArray(parsed.anomalyExplanations)) {
        sanitizedAnomalyExplanations = parsed.anomalyExplanations
          .filter((ae) => ae && typeof ae.id === "string" && typeof ae.explanation === "string")
          .map((ae) => ({
            id: ae.id,
            explanation: ae.explanation.trim(),
          }));
      }

      // If LLM returned explanations, merge them into metrics.anomalies
      if (metrics.anomalies && sanitizedAnomalyExplanations.length > 0) {
        const explanationMap = new Map(sanitizedAnomalyExplanations.map((e) => [e.id, e.explanation]));
        for (const anomaly of metrics.anomalies) {
          const aiExp = explanationMap.get(anomaly.id);
          if (aiExp) {
            anomaly.explanation = aiExp;
          }
        }
      }

      const familyDynamicsNote =
        typeof parsed.familyDynamicsNote === "string" && parsed.familyDynamicsNote.trim().length > 0
          ? parsed.familyDynamicsNote.trim()
          : generateDeterministicFallbackInsights(metrics).familyDynamicsNote;

      return {
        summary: parsed.summary,
        highlights: sanitizedHighlights.length > 0 ? sanitizedHighlights : generateDeterministicFallbackInsights(metrics).highlights,
        recommendations: sanitizedRecommendations.length > 0 ? sanitizedRecommendations : generateDeterministicFallbackInsights(metrics).recommendations,
        anomalyExplanations: sanitizedAnomalyExplanations.length > 0 ? sanitizedAnomalyExplanations : generateDeterministicFallbackInsights(metrics).anomalyExplanations,
        familyDynamicsNote,
      };
    }

    return generateDeterministicFallbackInsights(metrics);
  } catch (error) {
    console.warn("Error calling LLM for insights, using deterministic fallback:", error);
    return generateDeterministicFallbackInsights(metrics);
  }
}