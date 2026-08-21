import {ArrowDownLeft, ArrowUpRight} from "lucide-react";
import type {Transaction} from "../types/Transaction";

interface TransactionItemProps {
    transaction: Transaction;
}

function TransactionItem({transaction}: TransactionItemProps) {
    const isIncome = transaction.type === "income";
    return (
        <div className="flex items-center gap-4 border-b border-gray-100 py-4 last:border-b-0">
            {/* Icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-green-100" : "bg-red-100"}`}>
                {isIncome ? (
                    <ArrowDownLeft className="text-green-600" size={18} />
                ) : (
                    <ArrowUpRight className="text-red-600" size={18} />
                )}
            </div>
            {/* Transaction information */}
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                    {transaction.title}
                </p>
                <p className="text-sm text-gray-500">
                    {transaction.category}
                </p>
            </div>
            {/* Amount and date */}
            <div className="text-right">
                <p className={`font-semibold ${isIncome ? "text-green-600" : "text-gray-900"}`}>
                    {isIncome ? "+" : "-"}₹{transaction.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-500">
                    {transaction.date}
                </p>
            </div>
        </div>
    );
}

export default TransactionItem;