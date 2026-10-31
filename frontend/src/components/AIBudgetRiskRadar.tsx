import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Film,
  GraduationCap,
  HeartPulse,
  Home,
  Layers,
  Loader2,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  getAIBudgetRisks,
  type AIBudgetRiskSynthesisResult,
  type CategoryRiskAnalysis,
} from "../services/budgetService";

interface AIBudgetRiskRadarProps {
  month: number;
  year: number;
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("food") || lower.includes("grocer") || lower.includes("dining")) {
    return Utensils;
  }
  if (lower.includes("shop")) {
    return ShoppingBag;
  }
  if (lower.includes("bill") || lower.includes("util") || lower.includes("electric")) {
    return Receipt;
  }
  if (lower.includes("entertain") || lower.includes("movie") || lower.includes("fun")) {
    return Film;
  }
  if (lower.includes("health") || lower.includes("med") || lower.includes("doctor")) {
    return HeartPulse;
  }
  if (lower.includes("educat") || lower.includes("school") || lower.includes("course")) {
    return GraduationCap;
  }
  if (lower.includes("home") || lower.includes("rent") || lower.includes("house")) {
    return Home;
  }
  return Layers;
}

function formatINR(val: number): string {
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function AIBudgetRiskRadar({ month, year }: AIBudgetRiskRadarProps) {
  const [data, setData] = useState<AIBudgetRiskSynthesisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadRiskAnalysis() {
      try {
        setIsLoading(true);
        const res = await getAIBudgetRisks(month, year);
        if (!isCancelled) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load budget risk analysis:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRiskAnalysis();
    return () => {
      isCancelled = true;
    };
  }, [month, year]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs dark:border-[#2e265c] dark:bg-[#161130]">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[#77738a] dark:text-[#a5a0ba]">
          <Loader2 size={16} className="animate-spin text-[#2a234f] dark:text-[#ffb3c3]" />
          <span>Scanning spending velocity & budget risks...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.report?.hasBudgets) {
    return null;
  }

  const { report, executiveSummary, overallActionPlan } = data;
  const isCritical = report.overallRiskLevel === "exceeded" || report.overallRiskLevel === "high_risk";
  const isModerate = report.overallRiskLevel === "moderate_risk";
  const atRiskCategories = report.categories.filter((c) => c.riskLevel !== "on_track");

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xs transition-all ${
        isCritical
          ? "border-rose-200 bg-gradient-to-r from-rose-50/50 to-white dark:border-rose-500/30 dark:from-rose-950/20 dark:to-[#161130]"
          : isModerate
          ? "border-amber-200 bg-gradient-to-r from-amber-50/40 to-white dark:border-amber-500/30 dark:from-amber-950/20 dark:to-[#161130]"
          : "border-[#e8e5ef] bg-gradient-to-r from-[#f8f7fb]/70 to-white dark:border-[#2e265c] dark:from-[#130e2c] dark:to-[#161130]"
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isCritical
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                : isModerate
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-[#2a234f] text-[#ffb3c3] dark:bg-[#352a6a] dark:text-[#ffb3c3]"
            }`}
          >
            {isCritical ? (
              <ShieldAlert size={20} />
            ) : isModerate ? (
              <AlertTriangle size={20} />
            ) : (
              <ShieldCheck size={20} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                AI Budget Risk Radar
              </h4>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isCritical
                    ? "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-400"
                    : isModerate
                    ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-400"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                }`}
              >
                {isCritical
                  ? `Overspending Risk (${atRiskCategories.length} category limit${atRiskCategories.length > 1 ? "s" : ""})`
                  : isModerate
                  ? "Moderate Velocity"
                  : "All Budgets On Track"}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-[#77738a] dark:text-[#a5a0ba]">
              Day {report.daysElapsed} of {report.totalDaysInMonth}
              {report.daysRemaining > 0 && ` · ${report.daysRemaining} days remaining in month`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {atRiskCategories.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#2a234f] shadow-xs transition hover:bg-[#f8f7fb] dark:border-[#2e265c] dark:bg-[#1c1540] dark:text-[#f5f3fa] dark:hover:bg-[#251d54]"
            >
              <span>{isExpanded ? "Hide Details" : `View ${atRiskCategories.length} Alert${atRiskCategories.length > 1 ? "s" : ""}`}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* AI Risk Summary & Action Plan */}
      <div className="mt-3.5 space-y-2 border-t border-[#f0eef6] pt-3.5 dark:border-[#2e265c]">
        <p className="text-xs leading-relaxed text-[#504c66] dark:text-[#cfcbdc]">
          {executiveSummary}
        </p>
        <div className="flex items-start gap-2 rounded-xl bg-white/80 p-2.5 border border-[#e8e5ef] text-xs font-medium text-[#2a234f] dark:border-[#2e265c] dark:bg-[#120d28] dark:text-[#f5f3fa]">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-[#2a234f] dark:text-[#ffb3c3]" />
          <span>
            <strong>AI Recommended Action:</strong> {overallActionPlan}
          </span>
        </div>
      </div>

      {/* Expandable Details for At-Risk Categories */}
      {isExpanded && atRiskCategories.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-[#f0eef6] pt-4 animate-in fade-in duration-150 dark:border-[#2e265c]">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#77738a] dark:text-[#a5a0ba]">
            Pacing & Burn Rate Analysis
          </h5>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {atRiskCategories.map((c: CategoryRiskAnalysis) => {
              const Icon = getCategoryIcon(c.categoryName);
              const isOver = c.riskLevel === "exceeded";

              return (
                <div
                  key={c.categoryId}
                  className="rounded-xl border border-[#e8e5ef] bg-white p-3.5 shadow-xs space-y-2.5 dark:border-[#2e265c] dark:bg-[#120d28]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8f7fb] text-[#2a234f] dark:bg-[#1c1540] dark:text-[#f5f3fa]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                          {c.categoryName}
                        </h6>
                        <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                          Burn Rate: {formatINR(c.burnRatePerDay)}/day
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isOver
                          ? "bg-rose-50 text-rose-700 border border-rose-200 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-400"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-400"
                      }`}
                    >
                      {isOver
                        ? "Exceeded"
                        : `${c.paceRatio}x pace`}
                    </span>
                  </div>

                  {/* Metrics bar */}
                  <div className="flex items-center justify-between text-xs text-[#77738a] border-t border-[#f0eef6] pt-2 dark:border-[#2e265c] dark:text-[#a5a0ba]">
                    <span>
                      Spent: <strong className="text-[#2a234f] dark:text-[#f5f3fa]">{formatINR(c.actualSpent)}</strong> / {formatINR(c.budgetAmount)}
                    </span>
                    <span>
                      Projected:{" "}
                      <strong className={c.projectedOverspend > 0 ? "text-rose-600 dark:text-rose-400" : "text-[#2a234f] dark:text-[#f5f3fa]"}>
                        {formatINR(c.projectedMonthEndSpend)}
                      </strong>
                    </span>
                  </div>

                  {/* AI Advice & Daily Cap */}
                  {c.actionableTip && (
                    <div className="rounded-lg bg-[#f8f7fb] px-2.5 py-1.5 text-xs text-[#504c66] dark:bg-[#1a133d] dark:text-[#cfcbdc]">
                      🎯 {c.actionableTip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
