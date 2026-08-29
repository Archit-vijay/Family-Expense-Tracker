const API_URL = "http://localhost:5000/api";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
  };
}

export async function login(
  credentials: LoginInput,
): Promise<LoginResponse["data"]> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to log in.",
    );
  }

  return result.data;
}