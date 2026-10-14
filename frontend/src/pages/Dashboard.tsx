import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  PiggyBank,
  RefreshCw,
  Sparkles,
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
import { getFinancialInsights } from "../services/aiService";
import type { DashboardData } from "../types/dashboard";

// Build the last 6 calendar months as selectable options (current month first)
function buildMonthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    options.push({ value: `${year}-${month}`, label });
  }
  return options;
}

const monthOptions = buildMonthOptions();

const aggregateOptions = [
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "last-6-months", label: "Last 6 Months" },
  { value: "this-year",     label: "This Year" },
];

const periodOptions = [...monthOptions, ...aggregateOptions];

function formatCurrency(value: number) {
  return `₹${Math.abs(value).toLocaleString("en-IN")}`;
}

function Dashboard() {
  const [period, setPeriod] = useState(() => monthOptions[0].value);
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryId, setRetryId] = useState(0);

  // AI narrative — lazy loaded after dashboard data arrives
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const narrativePeriodRef = useRef<string | null>(null);

  const selectedPeriodLabel = useMemo(
    () =>
      periodOptions.find((option) => option.value === period)
        ?.label ?? period,
    [period],
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);
        setNarrative(null);

        const data = await getDashboard(period);

        if (isCurrent) {
          setDashboard(data);
        }
      } catch (loadError) {
        console.error("Failed to load dashboard:", loadError);

        if (isCurrent) {
          setError(
            "Unable to load your family's dashboard right now.",
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

  // Lazy-load AI narrative after dashboard data is ready
  useEffect(() => {
    if (!dashboard || isLoading) return;
    if (dashboard.trend.length === 0) return; // no data, skip

    let isCurrent = true;
    narrativePeriodRef.current = period;

    async function loadNarrative() {
      setNarrativeLoading(true);
      setNarrative(null);
      try {
        const insights = await getFinancialInsights(period);
        if (isCurrent && narrativePeriodRef.current === period) {
          setNarrative(insights.aiInsights.summary);
        }
      } catch {
        // Narrative is non-critical — silently skip on error
      } finally {
        if (isCurrent) setNarrativeLoading(false);
      }
    }

    loadNarrative();

    return () => {
      isCurrent = false;
    };
  }, [dashboard, isLoading, period]);

  return (
    <div className="page-enter">
      <section className="relative z-10 mb-8 fade-up">
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

          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <Link
              to="/insights"
              className="ai-btn h-11 shrink-0 whitespace-nowrap"
            >
              <span className="relative flex items-center">
                <Sparkles size={16} className="ai-btn-icon" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb3c3] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff859d]" />
                </span>
              </span>
              <span>AI Insights</span>
              <ArrowRight size={14} className="ai-btn-arrow" />
            </Link>

            <div className="relative z-20 w-full shrink-0 sm:w-64 lg:w-72">
              <AnimatedDropdown
                value={period}
                onChange={setPeriod}
                options={periodOptions}
                className="w-full"
              />
            </div>
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

            {/* AI narrative — lazy loaded, non-blocking */}
            {(narrativeLoading || narrative) && (
              <section
                className="mt-4 fade-up"
                style={{ animationDelay: "130ms" }}
              >
                <div className="flex items-start gap-3 rounded-2xl border border-[#e8e5ef] bg-white px-5 py-4 shadow-sm">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2a234f]">
                    {narrativeLoading ? (
                      <RefreshCw size={14} className="animate-spin text-white" />
                    ) : (
                      <Bot size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#77738a]">
                      AI summary · {selectedPeriodLabel}
                    </p>
                    {narrativeLoading ? (
                      <div className="space-y-2">
                        <div className="h-3.5 w-full animate-pulse rounded-full bg-[#e8e5ef]" />
                        <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[#e8e5ef]" />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-[#2a234f]">
                        {narrative}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

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