import type { Transaction } from "../types/Transaction";

const API_URL = "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

interface TransactionApiResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    amount: string;
    type: "income" | "expense";
    transaction_date: string;
    category: string;
    member_name: string;
  }[];
}

export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_URL}/transactions`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const result: TransactionApiResponse = await response.json();

  return result.data.map((transaction) => ({
    id: transaction.id,
    title: transaction.title,
    amount: Number(transaction.amount),
    type: transaction.type,
    date: transaction.transaction_date,
    category: transaction.category,
    member: transaction.member_name,
  }));
}

export interface CreateTransactionInput {
  memberId: number;
  categoryId: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  transactionDate: string;
}

export async function createTransaction(
  transaction: CreateTransactionInput,
): Promise<void> {
  const response = await fetch(`${API_URL}/transactions`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },

    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const result = await response.json();

    throw new Error(
      result.message || "Failed to create transaction",
    );
  }
}