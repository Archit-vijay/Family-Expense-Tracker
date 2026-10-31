export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Checks if a JWT token is expired or about to expire in the next 10 seconds.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    // Buffer by 10 seconds
    return payload.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
}

/**
 * Clears local credentials and redirects to login with session_expired indicator.
 */
export function handleUnauthorized() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("auth:expired"));

  const currentPath = window.location.pathname;
  if (
    !currentPath.startsWith("/login") &&
    !currentPath.startsWith("/signup") &&
    currentPath !== "/"
  ) {
    window.location.href = "/login?session_expired=true";
  }
}

/**
 * Shared authenticated fetch wrapper that injects Authorization header
 * and intercepts 401 responses to automatically trigger logout.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");

  // Proactive check: if token is already expired locally, abort early
  if (token && isTokenExpired(token)) {
    handleUnauthorized();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  return response;
}
