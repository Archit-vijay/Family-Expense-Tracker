const API_URL = "http://localhost:5000/api";

export interface BudgetWithSpending {
  id: number;
  familyId: number;
  categoryId: number;
  categoryName: string;
  categoryType: string;
  amount: number;
  month: number;
  year: number;
  actualSpent: number;
  remaining: number;
  percentage: number;
  status: "safe" | "warning" | "overbudget";
  createdAt: string;
  updatedAt: string;
}

export interface UnbudgetedCategorySpending {
  categoryId: number;
  categoryName: string;
  actualSpent: number;
  transactionCount: number;
}

export interface MonthlyBudgetSummary {
  month: number;
  year: number;
  totalBudgeted: number;
  totalSpentBudgeted: number;
  totalRemaining: number;
  totalUnbudgetedSpent: number;
  totalMonthlyExpenses: number;
  overallPercentage: number;
  overallStatus: "safe" | "warning" | "overbudget";
  overbudgetCount: number;
  warningCount: number;
  budgets: BudgetWithSpending[];
  unbudgeted: UnbudgetedCategorySpending[];
}

export interface CreateBudgetPayload {
  categoryId: number;
  amount: number;
  month: number;
  year: number;
}

export interface UpdateBudgetPayload {
  amount: number;
}

export interface CopyBudgetsPayload {
  sourceMonth: number;
  sourceYear: number;
  targetMonth: number;
  targetYear: number;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getBudgets(
  month: number,
  year: number,
): Promise<MonthlyBudgetSummary> {
  const response = await fetch(
    `${API_URL}/budgets?month=${month}&year=${year}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch budgets");
  }

  return result.data;
}

export async function createBudget(
  payload: CreateBudgetPayload,
): Promise<BudgetWithSpending> {
  const response = await fetch(`${API_URL}/budgets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create budget");
  }

  return result.data;
}

export async function updateBudget(
  id: number,
  payload: UpdateBudgetPayload,
): Promise<BudgetWithSpending> {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to update budget");
  }

  return result.data;
}

export async function deleteBudget(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to delete budget");
  }
}

export async function copyPreviousMonthBudgets(
  payload: CopyBudgetsPayload,
): Promise<{ copiedCount: number; message: string }> {
  const response = await fetch(`${API_URL}/budgets/copy-previous`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to copy budgets");
  }

  return result;
}
