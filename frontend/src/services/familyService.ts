import { API_URL, authFetch } from "./apiClient";

export interface MyFamily {
  familyId: number;
  familyName?: string;
  familyCode?: string;
  role: "admin" | "member" | "viewer";
}

export async function getMyFamily(): Promise<MyFamily> {
  const response = await authFetch(`${API_URL}/family/me`);

  const result: {
    success: boolean;
    data?: MyFamily;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    const error: any = new Error(
      result.message || "Failed to fetch family information."
    );
    error.status = response.status;
    throw error;
  }

  if (!result.data) {
    throw new Error("Invalid server response.");
  }

  return result.data;
}

export async function createFamily(familyName: string): Promise<MyFamily> {
  const response = await authFetch(`${API_URL}/family/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ familyName }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to create family.");
  }

  return result.data;
}

export async function joinFamily(code: string): Promise<MyFamily> {
  const response = await authFetch(`${API_URL}/family/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to join family.");
  }

  return result.data;
}

export async function getFamilyCode(): Promise<string> {
  const response = await authFetch(`${API_URL}/family/code`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to retrieve family code.");
  }

  return result.data?.code;
}

export async function regenerateFamilyCode(): Promise<string> {
  const response = await authFetch(`${API_URL}/family/code/regenerate`, {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to regenerate family code.");
  }

  return result.data?.code;
}

export async function renameFamily(name: string): Promise<{ id: number; name: string }> {
  const response = await authFetch(`${API_URL}/family/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to rename family.");
  }

  return result.data;
}

export async function downloadTransactionsCSV(): Promise<void> {
  const response = await authFetch(`${API_URL}/family/export`);
  if (!response.ok) {
    let errMsg = "Failed to export family transactions.";
    try {
      const errJson = await response.json();
      if (errJson?.message) errMsg = errJson.message;
    } catch {
      // fallback to default
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `family_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
