import { API_URL, authFetch } from "./apiClient";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type RecurringStatus = "active" | "paused" | "completed";
export type RecurringType = "income" | "expense";

export interface RecurringTransaction {
  id: number;
  family_id: number;
  member_id: number;
  category_id: number;
  created_by: number;
  title: string;
  amount: number;
  type: RecurringType;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  last_processed_date: string | null;
  status: RecurringStatus;
  is_subscription: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  member_name?: string;
  creator_name?: string;
  days_until_due?: number;
}

export interface RecurringSummary {
  monthlyCommittedExpense: number;
  monthlyCommittedIncome: number;
  activeSubscriptionsCount: number;
  monthlySubscriptionCost: number;
  upcomingDueCount: number;
  totalActiveCount: number;
  nextUpcomingItem: {
    id: number;
    title: string;
    amount: number;
    nextDueDate: string;
    daysUntilDue: number;
    type: RecurringType;
  } | null;
}

export interface CreateRecurringInput {
  title: string;
  amount: number;
  type: RecurringType;
  frequency: RecurringFrequency;
  categoryId: number;
  memberId: number;
  startDate: string;
  endDate?: string | null;
  isSubscription?: boolean;
}

export interface UpdateRecurringInput {
  title?: string;
  amount?: number;
  type?: RecurringType;
  frequency?: RecurringFrequency;
  categoryId?: number;
  memberId?: number;
  startDate?: string;
  endDate?: string | null;
  nextDueDate?: string;
  status?: RecurringStatus;
  isSubscription?: boolean;
}

export async function getRecurringTransactions(filters?: {
  status?: string;
  type?: string;
  isSubscription?: boolean;
}): Promise<{ items: RecurringTransaction[]; summary: RecurringSummary }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.isSubscription !== undefined) {
    params.append("isSubscription", String(filters.isSubscription));
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await authFetch(`${API_URL}/recurring${queryString}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch recurring transactions.");
  }

  return result.data;
}

export async function createRecurringTransaction(
  input: CreateRecurringInput,
): Promise<RecurringTransaction> {
  const response = await authFetch(`${API_URL}/recurring`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create recurring transaction.");
  }

  return result.data;
}

export async function updateRecurringTransaction(
  id: number,
  input: UpdateRecurringInput,
): Promise<RecurringTransaction> {
  const response = await authFetch(`${API_URL}/recurring/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to update recurring transaction.");
  }

  return result.data;
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  const response = await authFetch(`${API_URL}/recurring/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to delete recurring transaction.");
  }
}

export async function togglePauseRecurring(
  id: number,
  pause: boolean,
): Promise<RecurringTransaction> {
  const action = pause ? "pause" : "resume";
  const response = await authFetch(`${API_URL}/recurring/${id}/${action}`, {
    method: "POST",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || `Failed to ${action} recurring transaction.`);
  }

  return result.data;
}

export async function processDueRecurring(): Promise<{
  processedCount: number;
  createdTransactionIds: number[];
}> {
  const response = await authFetch(`${API_URL}/recurring/process-due`, {
    method: "POST",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to process due recurring transactions.");
  }

  return result.data;
}

export async function recordRecurringNow(
  id: number,
): Promise<{ transactionId: number; nextDueDate: string }> {
  const response = await authFetch(`${API_URL}/recurring/${id}/record-now`, {
    method: "POST",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to record transaction now.");
  }

  return result.data;
}
