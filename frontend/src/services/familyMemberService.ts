const API_URL = "http://localhost:5000/api";

export interface FamilyMember {
  id: number;
  name: string;
  user_id: number | null;
  created_at: string;
  role: "admin" | "member" | "viewer" | null;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const response = await fetch(
    `${API_URL}/family-members`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch family members");
  }

  const result: {
    success: boolean;
    data: FamilyMember[];
  } = await response.json();

  return result.data;
}

export async function createFamilyMember(
  name: string,
): Promise<FamilyMember> {
  const response = await fetch(
    `${API_URL}/family-members`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    },
  );

  const result: {
    success: boolean;
    data?: FamilyMember;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to create family member",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response");
  }

  return result.data;
}

export async function updateFamilyMember(
  memberId: number,
  name: string,
): Promise<FamilyMember> {
  const response = await fetch(
    `${API_URL}/family-members/${memberId}`,
    {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    },
  );

  const result: {
    success: boolean;
    data?: FamilyMember;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to update family member",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response");
  }

  return result.data;
}

export async function deactivateFamilyMember(
  memberId: number,
): Promise<FamilyMember> {
  const response = await fetch(
    `${API_URL}/family-members/${memberId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  const result: {
    success: boolean;
    data?: FamilyMember;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to remove family member",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response");
  }

  return result.data;
}

export async function updateFamilyMemberRole(
  memberId: number,
  role: "admin" | "member" | "viewer",
): Promise<{
  user_id: number;
  family_id: number;
  role: "admin" | "member" | "viewer";
}> {
  const response = await fetch(
    `${API_URL}/family-members/${memberId}/role`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    },
  );

  const result: {
    success: boolean;
    data?: {
      user_id: number;
      family_id: number;
      role: "admin" | "member" | "viewer";
    };
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to update family member role",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response");
  }

  return result.data;
}