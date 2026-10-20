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
      <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[#77738a]">
          <Loader2 size={16} className="animate-spin text-[#2a234f]" />
          <span>Scanning spending velocity & budget risks...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.report.hasBudgets) {
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
          ? "border-rose-200 bg-gradient-to-r from-rose-50/50 to-white"
          : isModerate
          ? "border-amber-200 bg-gradient-to-r from-amber-50/40 to-white"
          : "border-[#e8e5ef] bg-gradient-to-r from-[#f8f7fb]/70 to-white"
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isCritical
                ? "bg-rose-100 text-rose-700"
                : isModerate
                ? "bg-amber-100 text-amber-700"
                : "bg-[#2a234f] text-[#ffb3c3]"
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
              <h4 className="text-base font-bold text-[#2a234f]">
                AI Budget Risk Radar
              </h4>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isCritical
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : isModerate
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {isCritical
                  ? `Overspending Risk (${atRiskCategories.length} category limit${atRiskCategories.length > 1 ? "s" : ""})`
                  : isModerate
                  ? "Moderate Velocity"
                  : "All Budgets On Track"}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-[#77738a]">
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#2a234f] shadow-xs transition hover:bg-[#f8f7fb]"
            >
              <span>{isExpanded ? "Hide Details" : `View ${atRiskCategories.length} Alert${atRiskCategories.length > 1 ? "s" : ""}`}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* AI Risk Summary & Action Plan */}
      <div className="mt-3.5 space-y-2 border-t border-[#f0eef6] pt-3.5">
        <p className="text-xs leading-relaxed text-[#504c66]">
          {executiveSummary}
        </p>
        <div className="flex items-start gap-2 rounded-xl bg-white/80 p-2.5 border border-[#e8e5ef] text-xs font-medium text-[#2a234f]">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-[#2a234f]" />
          <span>
            <strong>AI Recommended Action:</strong> {overallActionPlan}
          </span>
        </div>
      </div>

      {/* Expandable Details for At-Risk Categories */}
      {isExpanded && atRiskCategories.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-[#f0eef6] pt-4 animate-in fade-in duration-150">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#77738a]">
            Pacing & Burn Rate Analysis
          </h5>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {atRiskCategories.map((c: CategoryRiskAnalysis) => {
              const Icon = getCategoryIcon(c.categoryName);
              const isOver = c.riskLevel === "exceeded";

              return (
                <div
                  key={c.categoryId}
                  className="rounded-xl border border-[#e8e5ef] bg-white p-3.5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8f7fb] text-[#2a234f]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-[#2a234f]">
                          {c.categoryName}
                        </h6>
                        <p className="text-xs text-[#77738a]">
                          Burn Rate: {formatINR(c.burnRatePerDay)}/day
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isOver
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isOver
                        ? "Exceeded"
                        : `${c.paceRatio}x pace`}
                    </span>
                  </div>

                  {/* Metrics bar */}
                  <div className="flex items-center justify-between text-xs text-[#77738a] border-t border-[#f0eef6] pt-2">
                    <span>
                      Spent: <strong className="text-[#2a234f]">{formatINR(c.actualSpent)}</strong> / {formatINR(c.budgetAmount)}
                    </span>
                    <span>
                      Projected:{" "}
                      <strong className={c.projectedOverspend > 0 ? "text-rose-600" : "text-[#2a234f]"}>
                        {formatINR(c.projectedMonthEndSpend)}
                      </strong>
                    </span>
                  </div>

                  {/* AI Advice & Daily Cap */}
                  {c.actionableTip && (
                    <div className="rounded-lg bg-[#f8f7fb] px-2.5 py-1.5 text-xs text-[#504c66]">
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
