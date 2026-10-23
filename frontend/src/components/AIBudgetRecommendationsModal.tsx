import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Film,
  GraduationCap,
  HeartPulse,
  Home,
  Layers,
  Loader2,
  Receipt,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  applyBudgetBatch,
  getAIBudgetRecommendations,
  type AIBudgetRecommendationsResult,
} from "../services/budgetService";

interface AIBudgetRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: number;
  targetYear: number;
  onApplied: () => Promise<void>;
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AIBudgetRecommendationsModal({
  isOpen,
  onClose,
  targetMonth,
  targetYear,
  onApplied,
}: AIBudgetRecommendationsModalProps) {
  const [data, setData] = useState<AIBudgetRecommendationsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map of categoryId -> selected boolean
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // Map of categoryId -> amount input
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    async function fetchRecommendations() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await getAIBudgetRecommendations(targetMonth, targetYear);
        if (isCancelled) return;

        setData(res);
        const allIds = new Set<number>();
        const initialAmounts: Record<number, string> = {};

        for (const item of res.recommendations) {
          allIds.add(item.categoryId);
          initialAmounts[item.categoryId] = String(item.recommendedAmount);
        }

        setSelectedIds(allIds);
        setAmounts(initialAmounts);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to load budget recommendations:", err);
          setError(err?.message || "Failed to generate AI recommendations.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRecommendations();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, targetMonth, targetYear]);

  // Toggle selection
  const handleToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (!data) return;
    if (selectedIds.size === data.recommendations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.recommendations.map((r) => r.categoryId)));
    }
  };

  const handleAmountChange = (id: number, val: string) => {
    setAmounts((prev) => ({ ...prev, [id]: val }));
  };

  // Compute live total selected budget
  const totalSelectedBudget = useMemo(() => {
    let sum = 0;
    for (const id of selectedIds) {
      const num = parseFloat(amounts[id] || "0");
      if (!isNaN(num) && num > 0) {
        sum += num;
      }
    }
    return sum;
  }, [selectedIds, amounts]);

  const handleApply = async () => {
    if (selectedIds.size === 0) return;

    const payload = Array.from(selectedIds)
      .map((id) => {
        const amt = parseFloat(amounts[id]);
        return {
          categoryId: id,
          amount: isNaN(amt) ? 0 : amt,
          month: targetMonth,
          year: targetYear,
        };
      })
      .filter((b) => b.amount > 0);

    if (payload.length === 0) {
      setError("Please ensure selected categories have a positive budget amount.");
      return;
    }

    try {
      setIsApplying(true);
      setError(null);
      await applyBudgetBatch(payload);
      await onApplied();
      onClose();
    } catch (err: any) {
      console.error("Failed to apply budgets:", err);
      setError(err?.message || "Failed to apply recommended budgets.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a234f]/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#e8e5ef] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-[#2e265c] dark:bg-[#161130]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#e8e5ef] p-6 pb-4 dark:border-[#2e265c]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2a234f] text-[#ffb3c3] shadow-xs dark:bg-[#352a6a]">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                  AI Budget Recommendations
                </h3>
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-300">
                  {MONTH_NAMES[targetMonth - 1]} {targetYear}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#77738a] dark:text-[#a5a0ba]">
                Prudent category limits tailored from your family's recent spending baselines.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:bg-[#1f1642] dark:hover:text-[#f5f3fa]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 size={32} className="mx-auto animate-spin text-[#2a234f] dark:text-[#ffb3c3]" />
              <h4 className="mt-4 text-base font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                Analyzing historical spending patterns...
              </h4>
              <p className="mt-1 text-xs text-[#77738a] dark:text-[#a5a0ba]">
                Calculating 3-month averages and synthesizing customized safety buffers.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-400">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Strategy Summary Card */}
              <div className="rounded-xl border border-[#e8e5ef] bg-gradient-to-r from-[#f8f7fb] to-[#faf8fc] p-4 dark:border-[#2e265c] dark:from-[#171135] dark:to-[#120d28]">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 text-[#2a234f] shrink-0 dark:text-[#ffb3c3]" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#2a234f] dark:text-[#ffb3c3]">
                      AI Financial Strategy
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-[#504c66] dark:text-[#cfcbdc]">
                      {data.strategySummary}
                    </p>
                    <div className="mt-2.5 flex items-center gap-4 text-xs text-[#77738a] dark:text-[#a5a0ba]">
                      <span>
                        Historical Average:{" "}
                        <strong className="text-[#2a234f] dark:text-[#f5f3fa]">
                          {formatINR(data.totalHistoricalAverage)}/mo
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Recommended Cap:{" "}
                        <strong className="text-[#2a234f] dark:text-[#f5f3fa]">
                          {formatINR(data.totalRecommended)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category List Header with Select All */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="flex h-5 w-5 items-center justify-center rounded-md border border-[#cfcbdc] bg-white transition hover:border-[#2a234f] dark:border-[#3d3378] dark:bg-[#120d28]"
                  >
                    {selectedIds.size === data.recommendations.length && (
                      <Check size={14} className="text-[#2a234f] dark:text-[#ffb3c3]" />
                    )}
                  </button>
                  <span className="text-xs font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                    Select Categories ({selectedIds.size} of {data.recommendations.length} selected)
                  </span>
                </div>
                <span className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                  You can tweak any recommended amount directly.
                </span>
              </div>

              {/* Recommendations Items */}
              <div className="space-y-3">
                {data.recommendations.map((item) => {
                  const Icon = getCategoryIcon(item.categoryName);
                  const isSelected = selectedIds.has(item.categoryId);

                  return (
                    <div
                      key={item.categoryId}
                      className={`rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-[#cfcbdc] bg-white shadow-xs dark:border-[#3d3378] dark:bg-[#120d28]"
                          : "border-[#e8e5ef] bg-[#f8f7fb]/60 opacity-60 dark:border-[#2e265c] dark:bg-[#120d28]/40"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Checkbox + Category Info */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(item.categoryId)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                              isSelected
                                ? "border-[#2a234f] bg-[#2a234f] text-white dark:border-[#ffb3c3] dark:bg-[#ffb3c3] dark:text-[#2a234f]"
                                : "border-[#cfcbdc] bg-white hover:border-[#2a234f] dark:border-[#3d3378] dark:bg-[#161130]"
                            }`}
                          >
                            {isSelected && <Check size={13} />}
                          </button>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8f7fb] text-[#2a234f] dark:bg-[#1c1540] dark:text-[#f5f3fa]">
                            <Icon size={18} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                                {item.categoryName}
                              </h4>
                              {item.currentBudget && (
                                <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  Current: {formatINR(item.currentBudget)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                              3-mo avg:{" "}
                              <strong className="text-[#2a234f] dark:text-[#f5f3fa]">
                                {formatINR(item.averageMonthlySpend)}
                              </strong>
                              {item.lastMonthSpend > 0 && (
                                <span> • Last mo: {formatINR(item.lastMonthSpend)}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Amount Input */}
                        <div className="flex items-center gap-2 sm:self-center">
                          <span className="text-xs font-semibold text-[#77738a] dark:text-[#a5a0ba]">Target:</span>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#77738a] dark:text-[#a5a0ba]">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              disabled={!isSelected}
                              value={amounts[item.categoryId] ?? ""}
                              onChange={(e) =>
                                handleAmountChange(item.categoryId, e.target.value)
                              }
                              className="h-9 w-full rounded-lg border border-[#e8e5ef] bg-white pl-7 pr-2.5 text-sm font-bold text-[#2a234f] focus:border-[#2a234f] focus:outline-hidden disabled:bg-gray-100 dark:border-[#2e265c] dark:bg-[#161130] dark:text-[#f5f3fa] dark:focus:border-[#ffb3c3] dark:disabled:bg-[#100c24]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reasoning Banner */}
                      {item.reasoning && (
                        <div className="mt-3 rounded-lg border border-[#e8e5ef] bg-[#f8f7fb] px-3 py-1.5 text-xs text-[#504c66] dark:border-[#2e265c] dark:bg-[#161130] dark:text-[#cfcbdc]">
                          💡 {item.reasoning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col gap-3 border-t border-[#e8e5ef] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-[#2e265c]">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[#2a234f] dark:text-[#ffb3c3]" />
            <span className="text-xs text-[#77738a] dark:text-[#a5a0ba]">Total Selected Budget:</span>
            <span className="text-base font-bold text-[#2a234f] dark:text-[#f5f3fa]">
              {formatINR(totalSelectedBudget)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="rounded-xl border border-[#e8e5ef] px-4 py-2 text-sm font-semibold text-[#77738a] hover:bg-[#f8f7fb] dark:border-[#2e265c] dark:text-[#a5a0ba] dark:hover:bg-[#1f1642]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || isLoading || selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2a234f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1f1a3b] disabled:opacity-50"
            >
              {isApplying ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>Apply {selectedIds.size} Budget{selectedIds.size > 1 ? "s" : ""}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
