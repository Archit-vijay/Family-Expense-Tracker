import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import { transactions } from "../data/transactions";

function RecentTransactions() {
  return (
    <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#2a234f]">
            Recent Transactions
          </h3>

          <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
            Your latest family transactions
          </p>
        </div>

        <Link
          to="/transactions"
          className="
            group
            flex items-center gap-1
            rounded-lg
            px-2.5 py-2
            text-xs font-semibold
            text-[#2a234f]

            transition-all duration-200

            hover:bg-[#f8f7fb]
            hover:text-[#1f1a3b]
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
        </Link>
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
