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

export interface AIBudgetRecommendationItem {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  averageMonthlySpend: number;
  lastMonthSpend: number;
  currentBudget: number | null;
  recommendedAmount: number;
  reasoning: string;
}

export interface AIBudgetRecommendationsResult {
  targetMonth: number;
  targetYear: number;
  strategySummary: string;
  recommendations: AIBudgetRecommendationItem[];
  totalRecommended: number;
  totalHistoricalAverage: number;
}

export async function getAIBudgetRecommendations(
  month: number,
  year: number,
): Promise<AIBudgetRecommendationsResult> {
  const response = await fetch(
    `${API_URL}/ai/budget-recommendations?month=${month}&year=${year}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch budget recommendations");
  }

  return result.data;
}

export async function applyBudgetBatch(
  budgets: Array<{ categoryId: number; amount: number; month: number; year: number }>,
): Promise<{ appliedCount: number }> {
  const response = await fetch(`${API_URL}/budgets/batch`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ budgets }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to apply budgets");
  }

  return result.data;
}

export type RiskLevel = "exceeded" | "high_risk" | "moderate_risk" | "on_track";

export interface CategoryRiskAnalysis {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  budgetAmount: number;
  actualSpent: number;
  burnRatePerDay: number;
  projectedMonthEndSpend: number;
  projectedOverspend: number;
  projectedPercentage: number;
  expectedPaceSpend: number;
  paceRatio: number;
  remainingBuffer: number;
  daysRemaining: number;
  recommendedDailyCap: number;
  riskLevel: RiskLevel;
  largestTransaction?: {
    title: string;
    amount: number;
    date: string;
  };
  explanation?: string;
  actionableTip?: string;
}

export interface BudgetRiskReport {
  month: number;
  year: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDaysInMonth: number;
  isCurrentMonth: boolean;
  totalBudgeted: number;
  totalSpent: number;
  totalProjectedSpend: number;
  totalProjectedOverspend: number;
  overallPacePercentage: number;
  overallRiskLevel: RiskLevel;
  criticalRisksCount: number;
  moderateRisksCount: number;
  onTrackCount: number;
  categories: CategoryRiskAnalysis[];
  hasBudgets: boolean;
}

export interface AIBudgetRiskSynthesisResult {
  month: number;
  year: number;
  executiveSummary: string;
  overallActionPlan: string;
  report: BudgetRiskReport;
}

export async function getAIBudgetRisks(
  month: number,
  year: number,
): Promise<AIBudgetRiskSynthesisResult> {
  const response = await fetch(
    `${API_URL}/ai/budget-risks?month=${month}&year=${year}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch budget risk analysis");
  }

  return result.data;
}
