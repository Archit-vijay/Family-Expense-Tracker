const API_URL = "http://localhost:5000/api";

export interface Category {
  id: number;
  name: string;
  type: "expense" | "income";
  created_at: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(
    `${API_URL}/categories`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const result: {
    success: boolean;
    data: Category[];
  } = await response.json();

  return result.data;
}