export interface StoredChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface StoredChatPayload {
  lastActiveAt: number;
  messages: StoredChatMessage[];
}

export const CHAT_INACTIVITY_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export const DEFAULT_WELCOME_MESSAGE: StoredChatMessage = {
  id: 1,
  role: "assistant",
  content:
    "Hi! I'm your Family Finance AI assistant. Ask me about your family's spending, income, transactions, or spending trends.",
};

function getStorageKey(userId?: number | string | null): string {
  return `family_finance_ai_chat_${userId ?? "default"}`;
}

// Clean up any adjacent duplicate pairs if they exist
function deduplicateMessages(messages: StoredChatMessage[]): StoredChatMessage[] {
  const cleaned: StoredChatMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const curr = messages[i];
    const next = messages[i + 1];

    if (
      curr.role === "user" &&
      next &&
      next.role === "assistant" &&
      cleaned.length >= 2 &&
      cleaned[cleaned.length - 2].role === "user" &&
      cleaned[cleaned.length - 2].content.trim() === curr.content.trim() &&
      cleaned[cleaned.length - 1].role === "assistant" &&
      cleaned[cleaned.length - 1].content.trim() === next.content.trim()
    ) {
      // Skip this redundant pair
      i++;
      continue;
    }
    cleaned.push(curr);
  }
  return cleaned;
}

export function loadChatSession(
  userId?: number | string | null,
): StoredChatMessage[] {
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [DEFAULT_WELCOME_MESSAGE];
    }

    const data = JSON.parse(raw) as StoredChatPayload;
    if (
      !data ||
      typeof data.lastActiveAt !== "number" ||
      !Array.isArray(data.messages) ||
      data.messages.length === 0
    ) {
      return [DEFAULT_WELCOME_MESSAGE];
    }

    const elapsed = Date.now() - data.lastActiveAt;
    if (elapsed > CHAT_INACTIVITY_TTL_MS) {
      // Expired — reset session
      localStorage.removeItem(key);
      return [DEFAULT_WELCOME_MESSAGE];
    }

    const deduplicated = deduplicateMessages(data.messages);
    if (deduplicated.length !== data.messages.length) {
      saveChatSession(deduplicated, userId);
      return deduplicated;
    }

    // Refresh active timestamp
    saveChatSession(data.messages, userId);
    return data.messages;
  } catch {
    return [DEFAULT_WELCOME_MESSAGE];
  }
}

export function saveChatSession(
  messages: StoredChatMessage[],
  userId?: number | string | null,
): void {
  const key = getStorageKey(userId);
  try {
    const payload: StoredChatPayload = {
      lastActiveAt: Date.now(),
      messages,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to persist AI chat session:", err);
  }
}

export function clearChatSession(
  userId?: number | string | null,
): StoredChatMessage[] {
  const key = getStorageKey(userId);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  return [DEFAULT_WELCOME_MESSAGE];
}

export function appendDashboardExchange(
  question: string,
  answer: string,
  userId?: number | string | null,
): void {
  const currentMessages = loadChatSession(userId);
  const len = currentMessages.length;

  // Deduplicate: If the last exchange is already this exact question and answer, do not re-append
  if (
    len >= 2 &&
    currentMessages[len - 2].role === "user" &&
    currentMessages[len - 2].content.trim() === question.trim() &&
    currentMessages[len - 1].role === "assistant" &&
    currentMessages[len - 1].content.trim() === answer.trim()
  ) {
    return;
  }

  const maxId = currentMessages.reduce((max, m) => Math.max(max, m.id), 0);

  const userMsg: StoredChatMessage = {
    id: maxId + 1,
    role: "user",
    content: question,
  };
  const assistantMsg: StoredChatMessage = {
    id: maxId + 2,
    role: "assistant",
    content: answer,
  };

  const updated = [...currentMessages, userMsg, assistantMsg];
  saveChatSession(updated, userId);
}
