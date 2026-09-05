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