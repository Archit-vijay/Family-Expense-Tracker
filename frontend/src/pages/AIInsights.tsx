import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Flame,
  Info,
  Layers,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import AnimatedDropdown from "../components/AnimatedDropdown";
import ContentState from "../components/ContentState";
import StatCard from "../components/Statcard";
import {
  getFinancialInsights,
  type FinancialInsightsData,
} from "../services/aiService";

const periodOptions = [
  {
    value: "this-month",
    label: "This Month vs Last Month",
  },
  {
    value: "previous-month",
    label: "Previous Month vs Prior Month",
  },
  {
    value: "last-3-months",
    label: "Last 3 Months vs Prior 3 Months",
  },
];

function formatCurrency(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

export default function AIInsights() {
  const [period, setPeriod] = useState("this-month");
  const [data, setData] = useState<FinancialInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPeriodLabel = useMemo(
    () =>
      periodOptions.find((option) => option.value === period)?.label ??
      "This Month vs Last Month",
    [period],
  );

  async function loadInsights(isManualRefresh = false) {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const result = await getFinancialInsights(period);
      setData(result);
    } catch (err) {
      console.error("Failed to load AI financial insights:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load financial insights.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, [period]);

  const metrics = data?.metrics;
  const aiInsights = data?.aiInsights;

  return (
    <div className="page-enter pb-12">
      {/* Page Header */}
      <section className="relative z-10 mb-8 fade-up">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb3c3]/25 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#2a234f]">
                <Sparkles size={12} className="text-[#2a234f]" />
                AI Intelligence
              </span>
              <span className="text-xs text-[#77738a]">•</span>
              <span className="text-xs font-medium text-[#77738a]">
                Authoritative Analytics
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
              Financial Insights
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77738a] sm:text-base">
              Verified financial metrics interpreted by AI to surface spending
              patterns, monthly trends, and actionable takeaways for your family.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            {/* Quick link to Chat Assistant */}
            <Link
              to="/ai-assistant"
              className="ai-btn h-11 shrink-0 whitespace-nowrap"
            >
              <Bot size={17} className="ai-btn-icon" />
              <span>Ask Assistant</span>
              <ArrowRight size={14} className="ai-btn-arrow" />
            </Link>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadInsights(true)}
              disabled={isLoading || isRefreshing}
              title="Refresh Insights"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#e8e5ef] bg-white px-4 text-sm font-semibold text-[#2a234f] shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2a234f]/20 hover:bg-[#f8f7fb] hover:shadow-sm disabled:opacity-50 active:scale-95"
            >
              <RefreshCw
                size={16}
                className={
                  isRefreshing ? "animate-spin text-[#2a234f]" : "text-[#77738a]"
                }
              />
              <span>Refresh</span>
            </button>

            {/* Period Selector */}
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

      {/* Main Content Area */}
      {isLoading ? (
        <ContentState
          variant="loading"
          title="Analyzing family finances"
          description="Calculating deterministic trends and gathering AI insights..."
        />
      ) : error ? (
        <ContentState
          variant="error"
          title="Unable to load insights"
          description={error}
          action={
            <button
              type="button"
              onClick={() => loadInsights()}
              className="rounded-xl bg-[#2a234f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2a234f]/20 transition-all hover:bg-[#1f1a3b]"
            >
              Try again
            </button>
          }
        />
      ) : !metrics?.hasEnoughData ? (
        <ContentState
          variant="empty"
          title={`No activity for ${selectedPeriodLabel}`}
          description="Add income or expense transactions for this period to generate comparative AI insights."
          action={
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2a234f]/20 transition-all hover:bg-[#1f1a3b]"
            >
              <span>Add Transactions</span>
              <ArrowRight size={16} />
            </Link>
          }
        />
      ) : (
        metrics &&
        aiInsights && (
          <div className="space-y-6">
            {/* Executive AI Summary Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#e8e5ef] bg-gradient-to-br from-white via-[#fcfbff] to-[#fff7f9] p-6 shadow-sm transition-all duration-300 hover:border-[#ffb3c3]/70 hover:shadow-md fade-up">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2a234f] text-[#ffb3c3] shadow-lg shadow-[#2a234f]/20 transition-transform duration-300 hover:scale-105 hover:rotate-3">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-bold text-[#2a234f]">
                        Executive Financial Summary
                      </h2>
                      <span className="rounded-full bg-[#2a234f]/5 px-2.5 py-0.5 text-xs font-semibold text-[#77738a]">
                        {metrics.period.current.label} vs {metrics.period.previous.label}
                      </span>
                    </div>

                    <p className="mt-2.5 text-base leading-relaxed text-[#2a234f]">
                      {aiInsights.summary}
                    </p>
                  </div>
                </div>

                {data?.generatedAt && (
                  <span className="shrink-0 self-start rounded-lg bg-white/80 px-2.5 py-1 text-xs font-medium text-[#77738a] shadow-xs">
                    Updated{" "}
                    {new Date(data.generatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Row 1: Key Stat Cards (Exact Dashboard Component & Animation System) */}
            <section
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 fade-up"
              style={{ animationDelay: "100ms" }}
            >
              {/* Card 1: Total Expenses */}
              <StatCard
                title="Total Expenses"
                amount={formatCurrency(metrics.expenses.current)}
                description={`vs ${formatCurrency(metrics.expenses.previous)} in ${metrics.period.previous.label}`}
                icon={ArrowUpRight}
                variant="expense"
                badge={
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      metrics.expenses.changeAmount < 0
                        ? "bg-emerald-50 text-emerald-700"
                        : metrics.expenses.changeAmount > 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {metrics.expenses.changeAmount < 0 ? (
                      <TrendingDown size={12} />
                    ) : metrics.expenses.changeAmount > 0 ? (
                      <TrendingUp size={12} />
                    ) : null}
                    <span>
                      {metrics.expenses.changePercentage > 0 ? "+" : ""}
                      {metrics.expenses.changePercentage}%
                    </span>
                  </span>
                }
              />

              {/* Card 2: Net Savings */}
              <StatCard
                title="Net Savings"
                amount={`${metrics.netSavings.current < 0 ? "-" : ""}${formatCurrency(metrics.netSavings.current)}`}
                description="Income minus Expenses"
                icon={PiggyBank}
                variant="savings"
                badge={
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      metrics.netSavings.current >= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {metrics.netSavings.current >= 0 ? "+" : "-"}
                    {formatCurrency(metrics.netSavings.current)}
                  </span>
                }
              />

              {/* Card 3: Savings Rate */}
              <StatCard
                title="Savings Rate"
                amount={`${metrics.savingsRate.current.toFixed(1)}%`}
                description="of total income retained"
                icon={Wallet}
                variant="balance"
                badge={
                  <span className="text-xs font-medium text-[#77738a]">
                    prev {metrics.savingsRate.previous.toFixed(1)}%
                  </span>
                }
              />

              {/* Card 4: Top Category */}
              <StatCard
                title={metrics.topCategory?.name ?? "Top Category"}
                amount={
                  metrics.topCategory
                    ? formatCurrency(metrics.topCategory.currentAmount)
                    : "₹0"
                }
                description={
                  metrics.topCategory
                    ? `${metrics.topCategory.percentageOfTotal}% of total expenses`
                    : "No expenses recorded"
                }
                icon={Layers}
                variant="balance"
                badge={
                  metrics.topCategory ? (
                    <span className="rounded-full bg-[#ffb3c3]/30 px-2 py-0.5 text-xs font-semibold text-[#2a234f]">
                      {metrics.topCategory.percentageOfTotal}%
                    </span>
                  ) : undefined
                }
              />
            </section>

            {/* Row 2: AI Key Highlights & Observations */}
            <section
              className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#2a234f]">
                  Key Financial Highlights
                </p>
                <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
                  Critical patterns and shifts detected across your finances
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {aiInsights.highlights.map((highlight, index) => {
                  const isPositive = highlight.type === "positive";
                  const isWarning = highlight.type === "warning";

                  return (
                    <div
                      key={index}
                      className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                        isPositive
                          ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300"
                          : isWarning
                          ? "border-amber-200 bg-amber-50/30 hover:border-amber-300"
                          : "border-[#e8e5ef] bg-[#f8f7fb]/60 hover:border-[#2a234f]/30"
                      }`}
                    >
                      <div>
                        <div className="mb-2.5 flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                              isPositive
                                ? "bg-emerald-100 text-emerald-700"
                                : isWarning
                                ? "bg-amber-100 text-amber-700"
                                : "bg-[#2a234f]/10 text-[#2a234f]"
                            }`}
                          >
                            {isPositive ? (
                              <CheckCircle2 size={16} />
                            ) : isWarning ? (
                              <AlertTriangle size={16} />
                            ) : (
                              <Info size={16} />
                            )}
                          </div>

                          <h4
                            className={`text-sm font-bold ${
                              isPositive
                                ? "text-emerald-950"
                                : isWarning
                                ? "text-amber-950"
                                : "text-[#2a234f]"
                            }`}
                          >
                            {highlight.title}
                          </h4>
                        </div>

                        <p className="text-xs leading-relaxed text-[#77738a]">
                          {highlight.description}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-2 text-[11px] font-semibold uppercase tracking-wider">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-700"
                              : isWarning
                              ? "text-amber-700"
                              : "text-[#77738a]"
                          }
                        >
                          {isPositive
                            ? "Favorable Trend"
                            : isWarning
                            ? "Action Required"
                            : "General Observation"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Row 3: Anomaly Radar / Unusual Activity */}
            <section
              className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 fade-up"
              style={{ animationDelay: "175ms" }}
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#2a234f]">
                      Anomaly Radar & Unusual Activity
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        metrics.anomalies && metrics.anomalies.length > 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {metrics.anomalies && metrics.anomalies.length > 0
                        ? `${metrics.anomalies.length} Flagged`
                        : "All Normal"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
                    Statistical analysis flagging variance outliers, velocity spikes, and unexpected shifts
                  </p>
                </div>
              </div>

              {!metrics.anomalies || metrics.anomalies.length === 0 ? (
                <div className="flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      No Spending Anomalies Detected
                    </h4>
                    <p className="mt-0.5 text-xs text-[#77738a]">
                      All family expenses are pacing within expected historical category baselines and normal variance ranges for this period.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {metrics.anomalies.map((anomaly) => {
                    const isHigh = anomaly.severity === "high";
                    const isMedium = anomaly.severity === "medium";

                    return (
                      <div
                        key={anomaly.id}
                        className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                          isHigh
                            ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
                            : isMedium
                            ? "border-amber-200 bg-amber-50/30 hover:border-amber-300"
                            : "border-[#e8e5ef] bg-[#f8f7fb]/60 hover:border-[#2a234f]/30"
                        }`}
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                  anomaly.type === "outlier_transaction"
                                    ? "bg-rose-100 text-rose-700"
                                    : anomaly.type === "velocity_spike"
                                    ? "bg-amber-100 text-amber-800"
                                    : anomaly.type === "category_surge"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {anomaly.type === "outlier_transaction" && <AlertCircle size={12} />}
                                {anomaly.type === "velocity_spike" && <Activity size={12} />}
                                {anomaly.type === "category_surge" && <Flame size={12} />}
                                {anomaly.type === "new_category" && <Sparkles size={12} />}
                                <span>
                                  {anomaly.type === "outlier_transaction"
                                    ? "Outlier Expense"
                                    : anomaly.type === "velocity_spike"
                                    ? "Velocity Spike"
                                    : anomaly.type === "category_surge"
                                    ? "Category Surge"
                                    : "New Category"}
                                </span>
                              </span>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  isHigh
                                    ? "bg-rose-200/80 text-rose-900"
                                    : isMedium
                                    ? "bg-amber-200/80 text-amber-900"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {anomaly.severity}
                              </span>
                            </div>

                            <span className="text-sm font-bold text-[#2a234f]">
                              {formatCurrency(anomaly.amount)}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-sm font-bold text-[#2a234f]">
                            {anomaly.title}
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-[#77738a]">
                            {anomaly.description}
                          </p>
                        </div>

                        {/* AI Explanation Callout */}
                        <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-[#e8e5ef] bg-white/90 p-2.5 text-xs text-[#2a234f]">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#2a234f] text-[#ffb3c3]">
                            <Bot size={12} />
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-[#2a234f]">AI Note: </span>
                            <span className="text-[#555268]">{anomaly.explanation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Row 4: Category Shifts & Member Distribution (Two-column layout matching Dashboard) */}
            <section
              className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] fade-up"
              style={{ animationDelay: "200ms" }}
            >
              {/* Category Shifts & Spikes */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-[#2a234f]">
                    Category Shifts & Spikes
                  </p>
                  <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
                    Expense shifts compared to {metrics.period.previous.label}
                  </p>
                </div>

                {metrics.categories.length === 0 ? (
                  <div className="rounded-xl bg-[#f8f7fb] px-5 py-8 text-center text-sm text-[#77738a]">
                    No category expenses recorded for this period.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics.categories.slice(0, 6).map((cat) => (
                      <div
                        key={cat.name}
                        className="group flex flex-col gap-1.5 rounded-xl border border-[#e8e5ef]/70 bg-[#f8f7fb]/40 p-3 transition-all duration-200 hover:translate-x-1.5 hover:bg-[#f8f7fb] hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cat.isSpike && (
                              <span
                                title="Spike detected: >20% increase"
                                className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 animate-pulse"
                              >
                                <Flame size={12} />
                                <span>Spike</span>
                              </span>
                            )}
                            <span className="text-sm font-semibold text-[#2a234f]">
                              {cat.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#2a234f]">
                              {formatCurrency(cat.currentAmount)}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                cat.changeAmount > 0
                                  ? "text-rose-600"
                                  : cat.changeAmount < 0
                                  ? "text-emerald-600"
                                  : "text-[#77738a]"
                              }`}
                            >
                              {cat.changeAmount > 0 ? "+" : ""}
                              {cat.changePercentage}%
                            </span>
                          </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8e5ef]">
                          <div
                            className="h-full rounded-full bg-[#2a234f] transition-all duration-700"
                            style={{
                              width: `${Math.min(cat.percentageOfTotal, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Family Spending Distribution */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2a234f]">
                      Member Distribution
                    </p>
                    <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
                      Expenses by family member
                    </p>
                  </div>

                  {metrics.topSpender && (
                    <span className="rounded-full bg-[#2a234f]/5 px-2.5 py-1 text-xs font-semibold text-[#2a234f]">
                      Top: {metrics.topSpender.name}
                    </span>
                  )}
                </div>

                {metrics.members.length === 0 ? (
                  <div className="rounded-xl bg-[#f8f7fb] px-5 py-8 text-center text-sm text-[#77738a]">
                    No member expense records available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics.members.map((member) => (
                      <div key={member.name} className="group">
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a234f] text-[10px] font-bold text-[#ffb3c3] transition-transform duration-200 group-hover:scale-110">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-[#2a234f]">
                              {member.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2a234f]">
                              {formatCurrency(member.currentAmount)}
                            </span>
                            <span className="text-[#77738a]">
                              ({member.percentageOfTotal}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar (Matching FamilySpending.tsx blush pink styling) */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f8f7fb]">
                          <div
                            className="h-full rounded-full bg-[#ffb3c3] transition-all duration-700"
                            style={{
                              width: `${Math.min(member.percentageOfTotal, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {metrics.transactionStats.largestExpense && (
                  <div className="mt-6 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3.5 transition-all duration-200 hover:bg-[#f3f1f7]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77738a]">
                      Largest Single Expense
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#2a234f]">
                        {metrics.transactionStats.largestExpense.title} (
                        {metrics.transactionStats.largestExpense.category})
                      </p>
                      <p className="text-sm font-bold text-[#2a234f]">
                        {formatCurrency(metrics.transactionStats.largestExpense.amount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Row 4: AI Actionable Recommendations */}
            {aiInsights.recommendations.length > 0 && (
              <section
                className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 fade-up"
                style={{ animationDelay: "250ms" }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2a234f] text-[#ffb3c3] shadow-sm">
                    <Lightbulb size={19} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2a234f]">
                      AI Actionable Recommendations
                    </h3>
                    <p className="text-xs text-[#77738a]">
                      Practical steps tailored to your family's recent financial behavior
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {aiInsights.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-3.5 rounded-xl border border-[#e8e5ef]/70 bg-[#f8f7fb]/60 p-4 transition-all duration-200 hover:translate-x-1.5 hover:border-[#ffb3c3] hover:bg-white hover:shadow-xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#2a234f] text-xs font-bold text-[#ffb3c3] shadow-xs transition-transform duration-200 group-hover:scale-110">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-[#2a234f]">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      )}
    </div>
  );
}
