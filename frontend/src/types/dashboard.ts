import type { Transaction } from "./Transaction";

export interface DashboardData {
  period: string;

  summary: {
    income: number;
    expenses: number;
    netSavings: number;
    savingsRate: number;
  };

  trend: {
    date: string;
    income: number;
    expenses: number;
  }[];

  categories: {
    category: string;
    amount: number;
  }[];

  recentTransactions: Transaction[];

  memberSpending: {
    member: string;
    amount: number;
  }[];
}