const API_URL = "http://localhost:5000/api";

export interface FamilyInvitation {
  id: number;
  familyMemberId: number;
  memberName: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationDetails {
  familyMemberId: number;
  memberName: string;
  email: string;
  expiresAt: string;
}

export interface AcceptedInvitationResult {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function createInvitation(
  memberId: number,
  email: string,
): Promise<FamilyInvitation> {
  const response = await fetch(
    `${API_URL}/invitations`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId,
        email,
      }),
    },
  );

  const result: {
    success: boolean;
    data?: FamilyInvitation;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to create invitation.",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response.");
  }

  return result.data;
}

export async function getInvitation(
  token: string,
): Promise<InvitationDetails> {
  const response = await fetch(
    `${API_URL}/invitations/${encodeURIComponent(token)}`,
  );

  const result: {
    success: boolean;
    data?: InvitationDetails;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "This invitation is invalid or has expired.",
    );
  }

  if (!result.data) {
    throw new Error("Invalid server response.");
  }

  return result.data;
}

export async function acceptInvitation(
  token: string,
  password: string,
): Promise<AcceptedInvitationResult> {
  const response = await fetch(
    `${API_URL}/invitations/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    },
  );

  const result: {
    success: boolean;
    data?: AcceptedInvitationResult;
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to create your family account.",
    );
  }

  if (!result.data?.token || !result.data?.user) {
    throw new Error("Invalid server response.");
  }

  return result.data;
}