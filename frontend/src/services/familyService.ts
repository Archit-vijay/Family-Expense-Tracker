const API_URL = "http://localhost:5000/api";

export interface MyFamily {
  familyId: number;
  role: "admin" | "member" | "viewer";
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyFamily(): Promise<MyFamily> {
  const response = await fetch(
    `${API_URL}/family/me`,
    {
      headers: getAuthHeaders(),
    },
  );

  const result: {
    success: boolean;
    data?: MyFamily;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to fetch family information.",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response.");
  }

  return result.data;
}