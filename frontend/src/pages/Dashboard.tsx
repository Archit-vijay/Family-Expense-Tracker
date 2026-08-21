import {
  CreditCard,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import StatCard from "../components/StatCard";
import RecentTransactions from "../components/RecentTransactions";

function Dashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Good evening 👋
        </h2>

        <p className="mt-1 text-gray-500">
          Here's what's happening with your family finances.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Income"
          amount="₹72,400"
          description="This month"
          icon={TrendingUp}
        />

        <StatCard
          title="Total Expenses"
          amount="₹41,200"
          description="This month"
          icon={TrendingDown}
        />

        <StatCard
          title="Current Balance"
          amount="₹31,200"
          description="Available balance"
          icon={CreditCard}
        />
      </div>

      {/* Recent Transactions */}
      <div className="mt-6">
        <RecentTransactions />
      </div>
    </div>
  );
}

export default Dashboard;