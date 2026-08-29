import {
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import type { Transaction } from "../types/Transaction";

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({
  transaction,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";

  return (
    <div
      className="
        transaction-item
        group
        flex items-center gap-3
        border-b border-slate-100
        py-4
        last:border-b-0
        sm:gap-4
      "
    >
      {/* Transaction icon */}
      <div
        className={`
          transaction-icon
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-xl

          ${
            isIncome
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }
        `}
      >
        {isIncome ? (
          <ArrowDownLeft size={18} />
        ) : (
          <ArrowUpRight size={18} />
        )}
      </div>

      {/* Transaction information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {transaction.title}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {transaction.category}
          </span>

          <span className="hidden text-xs text-slate-400 sm:inline">
            {transaction.member} • {transaction.date}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p
          className={`
            text-sm font-bold
            ${
              isIncome
                ? "text-emerald-600"
                : "text-slate-800"
            }
          `}
        >
          {isIncome ? "+" : "-"}₹
          {transaction.amount.toLocaleString("en-IN")}
        </p>

        <p className="mt-1 text-[11px] text-slate-400 sm:hidden">
          {transaction.date}
        </p>
      </div>
    </div>
  );
}

export default TransactionItem;