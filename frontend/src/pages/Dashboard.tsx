import {
  CreditCard,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import RecentTransactions from "../components/RecentTransactions";
import StatCard from "../components/Statcard";
import CategorySpending from "../components/CategorySpending";
import SpendingOverview from "../components/SpendingOverview";

function Dashboard() {
  return (
    <div className="page-enter">
      {/* Page heading */}
      <section className="mb-8 fade-up">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
              Financial overview
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
              Good evening 👋
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77738a] sm:text-base">
              Here's what's happening with your family's finances.
            </p>
          </div>

          <div className="cursor-pointer rounded-xl border border-[#e8e5ef] bg-white px-4 py-2.5 text-sm font-medium text-[#77738a] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb3c3] hover:bg-[#f8f7fb] hover:text-[#2a234f] hover:shadow-md active:translate-y-0">
            August 2026
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 fade-up" style={{ animationDelay: "100ms" }}>
        <StatCard
          title="Total Income"
          amount="₹72,400"
          description="This month"
          icon={TrendingUp}
          variant="income"
        />

        <StatCard
          title="Total Expenses"
          amount="₹41,200"
          description="This month"
          icon={TrendingDown}
          variant="expense"
        />

        <StatCard
          title="Current Balance"
          amount="₹31,200"
          description="Available balance"
          icon={CreditCard}
          variant="balance"
        />
      </section>
      {/* Analytics */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] fade-up" style={{ animationDelay: "150ms" }}>
        <SpendingOverview />
        <CategorySpending />
      </section>

      {/* Recent transactions */}
      <section className="mt-6 fade-up" style={{ animationDelay: "200ms" }}>
        <RecentTransactions />
      </section>
    </div>
  );
}

export default Dashboard;
