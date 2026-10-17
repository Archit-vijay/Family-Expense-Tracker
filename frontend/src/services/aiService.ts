const API_URL = "http://localhost:5000/api";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PeriodRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface MetricComparison {
  current: number;
  previous: number;
  changeAmount: number;
  changePercentage: number;
  trend: "up" | "down" | "neutral";
}

export interface CategoryComparison {
  name: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercentage: number;
  percentageOfTotal: number;
  isSpike: boolean;
}

export interface MemberCategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
}

export interface MemberComparison {
  name: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercentage: number;
  percentageOfTotal: number;
  trend: "up" | "down" | "neutral";
  transactionCount: number;
  topCategory: MemberCategoryBreakdown | null;
}

export interface FamilySpendingDynamics {
  activeMemberCount: number;
  topContributor: {
    name: string;
    percentageOfTotal: number;
    amount: number;
  } | null;
  spendingConcentration: "balanced" | "concentrated" | "single_driver";
  observation: string;
}

export interface FinancialAnomaly {
  id: string;
  type: "outlier_transaction" | "velocity_spike" | "category_surge" | "new_category";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  amount: number;
  category: string;
  date?: string;
  ratio?: number;
  explanation: string;
}

export interface DeterministicFinancialMetrics {
  period: {
    current: PeriodRange;
    previous: PeriodRange;
    selectedPeriod: string;
  };
  expenses: MetricComparison;
  income: MetricComparison;
  netSavings: MetricComparison;
  savingsRate: MetricComparison;
  categories: CategoryComparison[];
  topCategory: CategoryComparison | null;
  categorySpikes: CategoryComparison[];
  members: MemberComparison[];
  topSpender: MemberComparison | null;
  familyDynamics: FamilySpendingDynamics;
  transactionStats: {
    totalCount: number;
    averageExpense: number;
    largestExpense: {
      title: string;
      amount: number;
      category: string;
      date: string;
    } | null;
  };
  anomalies: FinancialAnomaly[];
  hasEnoughData: boolean;
}

export interface AIInsightHighlight {
  type: "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

export interface AIAnomalyExplanation {
  id: string;
  explanation: string;
}

export interface AIInsightsResult {
  summary: string;
  highlights: AIInsightHighlight[];
  recommendations: string[];
  anomalyExplanations?: AIAnomalyExplanation[];
  familyDynamicsNote?: string;
}

export interface FinancialInsightsData {
  metrics: DeterministicFinancialMetrics;
  aiInsights: AIInsightsResult;
  generatedAt: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function sendAIMessage(
  messages: AIChatMessage[],
): Promise<string> {
  const response = await fetch(
    `${API_URL}/ai/chat`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    },
  );

  const result: {
    success: boolean;
    data?: {
      response: string;
    };
    message?: string;
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to get AI response.",
    );
  }

  if (!result.data?.response) {
    throw new Error(
      "Invalid AI response from server.",
    );
  }

  return result.data.response;
}

export async function getFinancialInsights(
  period: string = "this-month",
): Promise<FinancialInsightsData> {
  const response = await fetch(
    `${API_URL}/ai/insights?period=${encodeURIComponent(period)}`,
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );

  const result: {
    success: boolean;
    data?: FinancialInsightsData;
    message?: string;
  } = await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      result.message || "Failed to load financial insights.",
    );
  }

  return result.data;
}