export type ExportFormat = "pdf" | "xlsx" | "csv";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  memberIds?: number[];
  type?: "all" | "income" | "expense";
}

export interface CategoryBreakdownItem {
  name: string;
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MemberBreakdownItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ReportTransaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  category_id: number;
  member_name: string;
  member_id: number;
  transaction_date: string;
  created_at: string;
}

export interface ReportPreviewData {
  transactionCount: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  categoryBreakdown: CategoryBreakdownItem[];
  memberBreakdown: MemberBreakdownItem[];
  sampleTransactions: ReportTransaction[];
}
