import { API_URL, authFetch } from "./apiClient";

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

export interface LoginResult {
  requires2FA?: boolean;
  tempToken?: string;
  token?: string;
  user?: AuthUser;
  hasFamily?: boolean;
}

export async function login(
  credentials: LoginInput,
): Promise<LoginResult> {
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

  if (result.requires2FA) {
    return {
      requires2FA: true,
      tempToken: result.tempToken,
    };
  }

  return result.data;
}

export async function verify2FALogin(
  tempToken: string,
  code: string,
): Promise<AuthResponse["data"]> {
  const response = await fetch(`${API_URL}/auth/login/2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tempToken, code }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to verify 2FA code.");
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

export async function updateProfile(name: string): Promise<AuthUser> {
  const response = await authFetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to update profile.");
  }

  // Update stored user in localStorage
  const current = localStorage.getItem("user");
  if (current) {
    try {
      const parsed = JSON.parse(current);
      parsed.name = result.data.name;
      localStorage.setItem("user", JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }

  return result.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string; data?: { passwordChangedAt?: string } }> {
  const response = await authFetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to change password.");
  }

  return result;
}

export async function verifyPasswordForEmail(password: string): Promise<string> {
  const response = await authFetch(`${API_URL}/auth/verify-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Incorrect password.");
  }

  return result.data.email;
}

export interface SecurityStatus {
  isTwoFactorEnabled: boolean;
  passwordChangedAt: string | null;
}

export async function getSecurityStatus(): Promise<SecurityStatus> {
  const response = await authFetch(`${API_URL}/auth/2fa/status`);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch security status.");
  }

  return result.data;
}

export async function setupTwoFactor(): Promise<{ secret: string; otpauthUrl: string; qrCode: string }> {
  const response = await authFetch(`${API_URL}/auth/2fa/setup`, {
    method: "POST",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to initiate 2FA setup.");
  }

  return result.data;
}

export async function enableTwoFactor(secret: string, code: string): Promise<string> {
  const response = await authFetch(`${API_URL}/auth/2fa/enable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ secret, code }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to enable two-factor authentication.");
  }

  return result.message;
}

export async function disableTwoFactor(password: string): Promise<string> {
  const response = await authFetch(`${API_URL}/auth/2fa/disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to disable two-factor authentication.");
  }

  return result.message;
}
