import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedDropdown from "../components/AnimatedDropdown";
import CategorySpending from "../components/CategorySpending";
import ContentState from "../components/ContentState";
import FamilySpending from "../components/FamilySpending";
import RecentTransactions from "../components/RecentTransactions";
import SpendingOverview from "../components/SpendingOverview";
import StatCard from "../components/Statcard";
import { getDashboard } from "../services/dashboardService";
import type { DashboardData } from "../types/dashboard";

const periodOptions = [
  {
    value: "this-month",
    label: "This Month",
  },
  {
    value: "previous-month",
    label: "Previous Month",
  },
  {
    value: "last-3-months",
    label: "Last 3 Months",
  },
  {
    value: "last-6-months",
    label: "Last 6 Months",
  },
  {
    value: "this-year",
    label: "This Year",
  },
];

function formatCurrency(value: number) {
  return `₹${Math.abs(value).toLocaleString("en-IN")}`;
}

function Dashboard() {
  const [period, setPeriod] = useState("this-month");
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryId, setRetryId] = useState(0);

  const selectedPeriodLabel = useMemo(
    () =>
      periodOptions.find((option) => option.value === period)
        ?.label ?? "This Month",
    [period],
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getDashboard(period);

        if (isCurrent) {
          setDashboard(data);
        }
      } catch (loadError) {
        console.error("Failed to load dashboard:", loadError);

        if (isCurrent) {
          setError(
            "Unable to load your family’s dashboard right now.",
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isCurrent = false;
    };
  }, [period, retryId]);

  return (
    <div className="page-enter">
      <section className="relative z-50 mb-8 fade-up">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
              Financial overview
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
              Family dashboard
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77738a] sm:text-base">
              A clear view of income, spending, and savings for your
              family.
            </p>
          </div>

          <div className="relative z-[60] w-full shrink-0 sm:w-64 lg:w-72">
            <AnimatedDropdown
              value={period}
              onChange={setPeriod}
              options={periodOptions}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <ContentState
          variant="loading"
          title="Loading your dashboard"
          description="Bringing together this period’s family finances."
        />
      ) : error ? (
        <ContentState
          variant="error"
          title="Unable to load dashboard"
          description={error}
          action={
            <button
              type="button"
              onClick={() =>
                setRetryId((current) => current + 1)
              }
              className="rounded-xl bg-[#2a234f] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          }
        />
      ) : dashboard && dashboard.trend.length === 0 ? (
        <ContentState
          variant="empty"
          title={`No activity for ${selectedPeriodLabel}`}
          description="Add an income or expense to begin building your family’s financial overview."
          action={
            <Link
              to="/transactions"
              className="inline-flex rounded-xl bg-[#2a234f] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add a transaction
            </Link>
          }
        />
      ) : (
        dashboard && (
          <>
            <section
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <StatCard
                title="Net Savings"
                amount={`${
                  dashboard.summary.netSavings < 0
                    ? "-"
                    : ""
                }${formatCurrency(
                  dashboard.summary.netSavings,
                )}`}
                description="Income minus Expenses"
                icon={PiggyBank}
                variant="savings"
              />

              <StatCard
                title="Income"
                amount={formatCurrency(
                  dashboard.summary.income,
                )}
                description={selectedPeriodLabel}
                icon={ArrowDownLeft}
                variant="income"
              />

              <StatCard
                title="Expenses"
                amount={formatCurrency(
                  dashboard.summary.expenses,
                )}
                description={selectedPeriodLabel}
                icon={ArrowUpRight}
                variant="expense"
              />

              <StatCard
                title="Savings Rate"
                amount={`${dashboard.summary.savingsRate.toFixed(
                  1,
                )}%`}
                description="of income retained"
                icon={Wallet}
                variant="balance"
              />
            </section>

            <section
              className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr] fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <SpendingOverview
                trend={dashboard.trend}
              />

              <CategorySpending
                categories={dashboard.categories}
                expenses={dashboard.summary.expenses}
              />
            </section>

            <section
              className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] fade-up"
              style={{ animationDelay: "200ms" }}
            >
              <RecentTransactions
                transactions={
                  dashboard.recentTransactions
                }
              />

              <FamilySpending
                members={dashboard.memberSpending}
                expenses={dashboard.summary.expenses}
              />
            </section>
          </>
        )
      )}
    </div>
  );
}

export default Dashboard;