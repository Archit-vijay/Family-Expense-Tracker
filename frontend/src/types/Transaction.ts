export type TransactionType = "income" | "expense";

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
  categoryId: number;
  member: string;
  memberId: number;
}

export interface StagedImportTransaction {
  id: string;
  date: string;
  rawDescription: string;
  cleanTitle: string;
  amount: number;
  type: TransactionType;
  balance?: number;
  referenceNumber?: string;
  suggestedCategoryId: number;
  suggestedCategoryName: string;
  confidence: "learned" | "rule" | "default";
  isDuplicate: boolean;
  duplicateReason?: string;
  selected: boolean;
}

export interface StatementParseSummary {
  totalCount: number;
  newCount: number;
  duplicatesCount: number;
  totalExpenseAmount: number;
  totalIncomeAmount: number;
}

export interface StatementParseResponse {
  success: boolean;
  requiresPassword?: boolean;
  invalidPassword?: boolean;
  fileType?: "csv" | "excel" | "pdf" | "unknown";
  fileName?: string;
  transactions?: StagedImportTransaction[];
  summary?: StatementParseSummary;
  message?: string;
}

export interface StatementCommitPayload {
  memberId: number;
  transactions: {
    title: string;
    amount: number;
    type: TransactionType;
    transactionDate: string;
    categoryId: number;
  }[];
  rememberMappings?: boolean;
}
