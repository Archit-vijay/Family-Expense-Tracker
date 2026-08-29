import { ArrowRight } from "lucide-react";
import TransactionItem from "./TransactionItem";
import { transactions } from "../data/transactions";



function RecentTransactions() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Recent Transactions
          </h3>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Your latest family transactions
          </p>
        </div>

        <button
          type="button"
          className="
            group
            flex items-center gap-1
            rounded-lg
            px-2.5 py-2
            text-xs font-semibold
            text-violet-600

            transition-all duration-200

            hover:bg-violet-50
            hover:text-violet-700
          "
        >
          View all

          <ArrowRight
            size={14}
            className="
              transition-transform duration-200
              group-hover:translate-x-1
            "
          />
        </button>
      </div>

      {/* Transactions */}
      <div className="mt-2">
        {transactions.slice(0, 4).map((transaction) => (
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