import { financialTools } from "./tools.js";
import { executeFinancialTool } from "./toolExecutor.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

// Recursively strip schema fields unsupported by Gemini (like additionalProperties)
function cleanGeminiSchema(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanGeminiSchema);
  }
  if (obj && typeof obj === "object") {
    const { additionalProperties, ...rest } = obj;
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(rest)) {
      cleaned[key] = cleanGeminiSchema(value);
    }
    return cleaned;
  }
  return obj;
}

// Convert OpenAI/Ollama role to Gemini role
function toGeminiRole(role: string): "user" | "model" {
  if (role === "assistant" || role === "model") {
    return "model";
  }
  return "user";
}

/**
 * Executes an AI chat completion using Google Gemini with function/tool calling.
 */
export async function generateGeminiChatResponse(
  conversationMessages: Array<{ role?: string; content?: string }>,
  familyId: number,
): Promise<string> {
  const apiKey = getApiKey();
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

  const systemInstruction =
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
    "Keep responses concise and easy to read. Plain text only, no Markdown formatting, no emojis, no <think> tags. When answering a simple numerical question, give the answer directly in one or two sentences.";

  // Transform recent conversation history into Gemini contents
  const contents: any[] = [];
  const recentMessages = conversationMessages.slice(-20);

  for (const m of recentMessages) {
    if (m.role === "system") continue;
    contents.push({
      role: toGeminiRole(m.role || "user"),
      parts: [{ text: m.content || "" }],
    });
  }

  // Ensure at least one user message exists
  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Hello" }],
    });
  }

  // Declare financial tools in Gemini schema format
  const geminiTools = [
    {
      function_declarations: financialTools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: cleanGeminiSchema(t.function.parameters),
      })),
    },
  ];

  const MAX_ROUNDS = 4;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const isLastRound = round === MAX_ROUNDS - 1;

    const requestBody: any = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
    };

    if (!isLastRound) {
      requestBody.tools = geminiTools;
    }

    const endpoint = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error?.message || `Gemini API returned status ${response.status}`,
      );
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content) {
      throw new Error("Gemini returned an empty response.");
    }

    const parts = candidate.content.parts || [];
    const functionCallPart = parts.find((p: any) => p.functionCall);

    if (functionCallPart && !isLastRound) {
      const funcName = functionCallPart.functionCall.name;
      const funcArgs = functionCallPart.functionCall.args || {};

      // Execute authoritative backend financial tool
      const toolResult = await executeFinancialTool(funcName, familyId, funcArgs);

      // Add model's functionCall turn to history
      contents.push(candidate.content);

      // Add functionResponse turn
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: funcName,
              response: { output: toolResult },
            },
          },
        ],
      });
    } else {
      // Model responded with final text
      const textPart = parts.find((p: any) => p.text);
      return (textPart?.text || "").trim();
    }
  }

  return "I was unable to complete the analysis within the allowed steps.";
}

/**
 * Executes structured JSON generation using Google Gemini with native response_mime_type.
 */
export async function generateGeminiJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const apiKey = getApiKey();
  const endpoint = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Gemini API returned status ${response.status}`,
    );
  }

  const data: any = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty JSON content.");
  }

  return JSON.parse(text) as T;
}
