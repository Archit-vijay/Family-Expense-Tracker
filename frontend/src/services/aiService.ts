const API_URL = "http://localhost:5000/api";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function sendAIMessage(
  messages: AIChatMessage[],
): Promise<string> {
  const response = await fetch(
    `${API_URL}/ai/chat`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    },
  );

  const result: {
    success: boolean;
    data?: {
      response: string;
    };
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to get AI response.",
    );
  }

  if (!result.data?.response) {
    throw new Error(
      "Invalid AI response from server.",
    );
  }

  return result.data.response;
}