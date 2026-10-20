import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getBudgets,
  type MonthlyBudgetSummary,
} from "../services/budgetService";

interface DashboardBudgetWidgetProps {
  month: number;
  year: number;
  periodLabel: string;
}

function formatINR(val: number): string {
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function DashboardBudgetWidget({
  month,
  year,
  periodLabel,
}: DashboardBudgetWidgetProps) {
  const [summary, setSummary] = useState<MonthlyBudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await getBudgets(month, year);
        if (!isCancelled) {
          setSummary(data);
        }
      } catch (err) {
        console.error("Dashboard budget widget failed to load:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, [month, year]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#77738a]">
          <Loader2 size={14} className="animate-spin" />
          <span>Loading budget status...</span>
        </div>
      </div>
    );
  }

  // No budgets configured for this month
  if (!summary || summary.budgets.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f7fb] text-[#2a234f]">
              <Wallet size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[#2a234f]">
                Monthly Budget for {periodLabel}
              </h4>
              <p className="text-xs text-[#77738a]">
                No spending limits set for this month yet.
              </p>
            </div>
          </div>

          <Link
            to="/budgets"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] px-3.5 py-2 text-xs font-bold text-[#2a234f] transition hover:bg-[#e8e5ef] sm:self-auto"
          >
            <Plus size={14} />
            <span>Set Monthly Budget</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOver = summary.overallStatus === "overbudget";
  const isWarn = summary.overallStatus === "warning";

  // Identify top categories needing attention (over budget or near limit)
  const alertCategories = summary.budgets
    .filter((b) => b.status === "overbudget" || b.status === "warning")
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isOver
                ? "bg-rose-50 text-rose-600"
                : isWarn
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isOver ? (
              <AlertTriangle size={20} />
            ) : isWarn ? (
              <AlertTriangle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[#2a234f]">
                Budget Health ({periodLabel})
              </h4>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isOver
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : isWarn
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {isOver
                  ? "Over Budget"
                  : isWarn
                  ? `${summary.overallPercentage}% used`
                  : "On Track"}
              </span>
            </div>
            <p className="text-xs text-[#77738a]">
              {formatINR(summary.totalSpentBudgeted)} of {formatINR(summary.totalBudgeted)} allocated
              {" · "}
              <span
                className={
                  summary.totalRemaining >= 0
                    ? "font-semibold text-emerald-600"
                    : "font-semibold text-rose-600"
                }
              >
                {summary.totalRemaining >= 0
                  ? `${formatINR(summary.totalRemaining)} remaining`
                  : `${formatINR(Math.abs(summary.totalRemaining))} over`}
              </span>
            </p>
          </div>
        </div>

        <Link
          to="/budgets"
          className="inline-flex items-center gap-1 self-start text-xs font-bold text-[#2a234f] hover:underline sm:self-auto"
        >
          <span>Manage Budgets</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#f0eef6]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver
              ? "bg-rose-500"
              : isWarn
              ? "bg-amber-500"
              : "bg-[#2a234f]"
          }`}
          style={{
            width: `${Math.min(100, summary.overallPercentage)}%`,
          }}
        />
      </div>

      {/* Quick alert chips if any category is over or warning */}
      {alertCategories.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#f0eef6] pt-3">
          <span className="text-xs font-semibold text-[#77738a]">Attention:</span>
          {alertCategories.map((c) => (
            <span
              key={c.id}
              className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                c.status === "overbudget"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {c.categoryName}: {formatINR(c.actualSpent)} / {formatINR(c.amount)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
