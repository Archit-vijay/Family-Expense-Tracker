import TransactionItem from "./TransactionItem";

import type { Transaction } from "../types/Transaction";

const recentTransactions: Transaction[] = [
  {
    id: "1",
    title: "Groceries",
    category: "Food",
    amount: 2450,
    type: "expense",
    date: "Aug 21",
  },
  {
    id: "2",
    title: "Monthly Salary",
    category: "Income",
    amount: 65000,
    type: "income",
    date: "Aug 20",
  },
  {
    id: "3",
    title: "Electricity Bill",
    category: "Bills",
    amount: 2800,
    type: "expense",
    date: "Aug 19",
  },
  {
    id: "4",
    title: "Fuel",
    category: "Transport",
    amount: 1200,
    type: "expense",
    date: "Aug 18",
  },
];

function RecentTransactions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            Recent Transactions
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Your latest family transactions
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View all
        </button>
      </div>

      <div>
        {recentTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </div>
    </div>
  );
}

export default RecentTransactions;