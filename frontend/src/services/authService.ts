import { API_URL } from "./apiClient";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: {
    token: string;
    user: AuthUser;
    hasFamily?: boolean;
  };
}

export async function login(
  credentials: LoginInput,
): Promise<AuthResponse["data"]> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to log in.");
  }

  return result.data;
}

export async function signup(
  input: SignupInput,
): Promise<AuthResponse["data"]> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    const error: any = new Error(result.message || "Failed to create account.");
    error.status = response.status;
    error.code = result.code;
    throw error;
  }

  return result.data;
}

export async function googleAuth(input: {
  email?: string;
  name?: string;
  credential?: string;
}): Promise<AuthResponse["data"]> {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to sign in with Google.");
  }

  return result.data;
}
