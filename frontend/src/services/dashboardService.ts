import type { DashboardData } from "../types/dashboard";

const API_URL = "http://localhost:5000/api";

export async function getDashboard(
  period: string,
): Promise<DashboardData> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/dashboard?period=${encodeURIComponent(period)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  const result = await response.json();

  return {
    ...result.data,
    recentTransactions:
      result.data.recentTransactions.map(
        (transaction: {
          id: number;
          title: string;
          amount: number;
          type: "income" | "expense";
          transaction_date: string;
          category_id: number;
          category: string;
          member_id: number;
          member_name: string;
        }) => ({
          id: transaction.id,
          title: transaction.title,
          amount: Number(transaction.amount),
          type: transaction.type,
          date: transaction.transaction_date,
          categoryId: transaction.category_id,
          category: transaction.category,
          memberId: transaction.member_id,
          member: transaction.member_name,
        }),
      ),
  };
}