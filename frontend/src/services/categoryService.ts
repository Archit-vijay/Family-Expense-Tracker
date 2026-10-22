import { API_URL, authFetch } from "./apiClient";

export interface Category {
  id: number;
  name: string;
  type: "expense" | "income";
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const response = await authFetch(`${API_URL}/categories`);

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const result: {
    success: boolean;
    data: Category[];
  } = await response.json();

  return result.data;
}

export async function createCategory(
  name: string,
  type: "expense" | "income",
): Promise<Category> {
  const response = await authFetch(`${API_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, type }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create category.");
  }

  return result.data;
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await authFetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to delete category.");
  }
}
