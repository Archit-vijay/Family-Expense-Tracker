import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import type { Transaction } from "../types/Transaction";
function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6"><div className="mb-2 flex items-center justify-between"><div><h3 className="text-base font-bold text-[#2a234f]">Recent Transactions</h3><p className="mt-1 text-xs text-[#77738a] sm:text-sm">Your latest family transactions this period</p></div><Link to="/transactions" className="group flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#2a234f] transition-all duration-200 hover:bg-[#f8f7fb]"><span className="hidden sm:inline">View all</span><ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" /></Link></div>{transactions.length === 0 ? <div className="rounded-xl bg-[#f8f7fb] px-5 py-8 text-center text-sm text-[#77738a]">No transactions in this period yet.</div> : <div className="mt-2">{transactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} />)}</div>}</div>;
}
export default RecentTransactions;
