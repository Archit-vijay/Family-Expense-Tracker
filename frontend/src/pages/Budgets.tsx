import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  GraduationCap,
  HeartPulse,
  Home,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AnimatedDropdown from "../components/AnimatedDropdown";
import ContentState from "../components/ContentState";
import StatCard from "../components/Statcard";
import { useAuth } from "../context/AuthContext";
import {
  copyPreviousMonthBudgets,
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
  type BudgetWithSpending,
  type MonthlyBudgetSummary,
} from "../services/budgetService";
import { getCategories, type Category } from "../services/categoryService";

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
  if (lower.includes("travel") || lower.includes("transport") || lower.includes("fuel") || lower.includes("car")) {
    return Car;
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

function Budgets() {
  const { familyRole } = useAuth();
  const canManage = familyRole === "admin" || familyRole === "member";

  const now = new Date();
  const currentMonthNum = now.getUTCMonth() + 1;
  const currentYearNum = now.getUTCFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);

  const [summary, setSummary] = useState<MonthlyBudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithSpending | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Form states
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load budgets & categories
  const loadData = async (m: number, y: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const [budgetData, catData] = await Promise.all([
        getBudgets(m, y),
        getCategories(),
      ]);
      setSummary(budgetData);
      setCategories(catData.filter((c) => c.type === "expense"));
    } catch (err: any) {
      console.error("Failed to load budgets:", err);
      setError(err?.message || "Failed to load budget data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthNum);
    setSelectedYear(currentYearNum);
  };

  const isCurrentMonth =
    selectedMonth === currentMonthNum && selectedYear === currentYearNum;

  // Available expense categories for new budget creation (excluding categories that already have a budget in this month)
  const availableCategories = useMemo(() => {
    if (!summary) return categories;
    const budgetedCatIds = new Set(summary.budgets.map((b) => b.categoryId));
    return categories.filter((c) => !budgetedCatIds.has(c.id));
  }, [categories, summary]);

  // Open Add modal
  const handleOpenAddModal = (presetCategoryId?: number) => {
    setEditingBudget(null);
    setFormError("");
    setFormAmount("");
    if (presetCategoryId) {
      setFormCategoryId(String(presetCategoryId));
    } else if (availableCategories.length > 0) {
      setFormCategoryId(String(availableCategories[0].id));
    } else {
      setFormCategoryId("");
    }
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
    setFormCategoryId(String(budget.categoryId));
    setFormAmount(String(budget.amount));
    setFormError("");
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!editingBudget && !formCategoryId) {
      setFormError("Please select a category.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (editingBudget) {
        await updateBudget(editingBudget.id, { amount: amountNum });
      } else {
        await createBudget({
          categoryId: parseInt(formCategoryId, 10),
          amount: amountNum,
          month: selectedMonth,
          year: selectedYear,
        });
      }

      setIsModalOpen(false);
      setEditingBudget(null);
      await loadData(selectedMonth, selectedYear);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save budget.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete budget
  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;
    try {
      setIsSubmitting(true);
      await deleteBudget(deletingBudget.id);
      setDeletingBudget(null);
      await loadData(selectedMonth, selectedYear);
    } catch (err: any) {
      console.error("Failed to delete budget:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy previous month budgets
  const handleConfirmCopy = async () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    try {
      setIsSubmitting(true);
      await copyPreviousMonthBudgets({
        sourceMonth: prevMonth,
        sourceYear: prevYear,
        targetMonth: selectedMonth,
        targetYear: selectedYear,
      });
      setIsCopyModalOpen(false);
      await loadData(selectedMonth, selectedYear);
    } catch (err: any) {
      setFormError(err?.message || "Failed to copy budgets.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#77738a]">
              Financial Planning
            </p>
            <h1 className="text-2xl font-bold text-[#2a234f] sm:text-3xl">
              Budgets
            </h1>
            <p className="mt-1 text-sm text-[#77738a]">
              Set planned category spending limits and monitor family financial progress.
            </p>
          </div>

          {/* Month Navigation & Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Navigator */}
            <div className="flex items-center rounded-xl border border-[#e8e5ef] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f]"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 font-semibold text-[#2a234f]">
                <Calendar size={16} className="text-[#77738a]" />
                <span className="text-sm">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="rounded-xl border border-[#e8e5ef] bg-white px-3 py-2 text-xs font-semibold text-[#2a234f] shadow-sm transition hover:bg-[#f8f7fb]"
              >
                This Month
              </button>
            )}

            {/* Set Budget CTA */}
            {canManage && (
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                disabled={availableCategories.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1a3b] disabled:opacity-50"
              >
                <Plus size={16} />
                <span>Set Budget</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#e8e5ef] bg-white p-12 shadow-sm">
          <ContentState
            variant="loading"
            title="Loading monthly budgets"
            description="Calculating planned limits and actual category spending..."
          />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#e8e5ef] bg-white p-12 shadow-sm">
          <ContentState
            variant="error"
            title="Unable to load budgets"
            description={error}
          />
        </div>
      ) : summary && summary.budgets.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e5ef] bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f7fb] text-[#2a234f]">
            <Wallet size={28} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#2a234f]">
            No budgets for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#77738a]">
            You haven't established any category budgets for this month yet. Setting targets helps your family maintain discipline and prevent surprise expenses.
          </p>

          {canManage && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#2a234f] shadow-sm transition hover:bg-[#f8f7fb]"
              >
                <Copy size={16} />
                <span>Copy from Previous Month</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                disabled={availableCategories.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1a3b]"
              >
                <Plus size={16} />
                <span>Set First Budget</span>
              </button>
            </div>
          )}

          {/* Unbudgeted spending notice if any spending occurred */}
          {summary.unbudgeted.length > 0 && (
            <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900">
                    Unbudgeted spending detected ({formatINR(summary.totalUnbudgetedSpent)})
                  </h4>
                  <p className="mt-1 text-xs text-amber-800">
                    Your family recorded expenses across {summary.unbudgeted.length} category(s) this month that don't have a budget allocated.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {summary.unbudgeted.map((u) => (
                      <button
                        key={u.categoryId}
                        type="button"
                        onClick={() => handleOpenAddModal(u.categoryId)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-xs transition hover:bg-amber-100/50"
                      >
                        <span>{u.categoryName}: {formatINR(u.actualSpent)}</span>
                        <Plus size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Summary KPI Cards with signature statcard animations */}
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 fade-up"
            style={{ animationDelay: "100ms" }}
          >
            <StatCard
              title="Total Planned Budget"
              amount={formatINR(summary.totalBudgeted)}
              description={`Across ${summary.budgets.length} category limit(s)`}
              icon={Wallet}
              variant="balance"
            />

            <StatCard
              title="Budgeted Spending"
              amount={formatINR(summary.totalSpentBudgeted)}
              description={`${summary.overallPercentage}% of planned limits used`}
              icon={Receipt}
              variant="expense"
            />

            <StatCard
              title="Remaining Buffer"
              amount={`${summary.totalRemaining < 0 ? "-" : ""}${formatINR(Math.abs(summary.totalRemaining))}`}
              description={
                summary.totalRemaining >= 0
                  ? "Available to spend safely"
                  : "Overall budget exceeded"
              }
              icon={summary.totalRemaining >= 0 ? CheckCircle2 : AlertTriangle}
              variant={summary.totalRemaining >= 0 ? "income" : "expense"}
            />

            <StatCard
              title="Total Month Expenses"
              amount={formatINR(summary.totalMonthlyExpenses)}
              description={
                summary.totalUnbudgetedSpent > 0
                  ? `Incl. ${formatINR(summary.totalUnbudgetedSpent)} unbudgeted`
                  : "All expenses are budgeted"
              }
              icon={Layers}
              variant="balance"
            />
          </section>

          {/* Overall Family Budget Health Bar */}
          <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2a234f]">
                  Monthly Budget Health
                </h3>
                <p className="text-xs text-[#77738a]">
                  {summary.overbudgetCount > 0 ? (
                    <span className="font-semibold text-rose-600">
                      {summary.overbudgetCount} category limit(s) exceeded
                    </span>
                  ) : summary.warningCount > 0 ? (
                    <span className="font-semibold text-amber-600">
                      {summary.warningCount} category limit(s) near cap (≥80%)
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-600">
                      All categories on track
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#2a234f]">
                  {summary.overallPercentage}%
                </span>
                <span className="text-xs text-[#77738a]">
                  ({formatINR(summary.totalSpentBudgeted)} of {formatINR(summary.totalBudgeted)})
                </span>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#f0eef6]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.overallStatus === "overbudget"
                    ? "bg-rose-500"
                    : summary.overallStatus === "warning"
                    ? "bg-amber-500"
                    : "bg-[#2a234f]"
                }`}
                style={{
                  width: `${Math.min(100, summary.overallPercentage)}%`,
                }}
              />
            </div>
          </div>

          {/* Category Budgets Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2a234f]">
                Category Budgets ({summary.budgets.length})
              </h3>
              {canManage && availableCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="text-xs font-semibold text-[#2a234f] underline hover:text-[#1f1a3b]"
                >
                  + Add another category
                </button>
              )}
            </div>

            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 fade-up"
              style={{ animationDelay: "150ms" }}
            >
              {summary.budgets.map((budget) => {
                const IconComponent = getCategoryIcon(budget.categoryName);
                const isOver = budget.status === "overbudget";
                const isWarn = budget.status === "warning";

                return (
                  <div
                    key={budget.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs transition hover:border-[#cfcbdc]"
                  >
                    <div>
                      {/* Top bar with Icon, Name, and Status Badge */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f7fb] text-[#2a234f]">
                            <IconComponent size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#2a234f]">
                              {budget.categoryName}
                            </h4>
                            <p className="text-xs text-[#77738a]">
                              Budget: {formatINR(budget.amount)}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isOver
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : isWarn
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isOver
                            ? "Over Budget"
                            : isWarn
                            ? `${budget.percentage}% used`
                            : "On Track"}
                        </span>
                      </div>

                      {/* Numbers */}
                      <div className="mt-5 flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-bold text-[#2a234f]">
                            {formatINR(budget.actualSpent)}
                          </span>
                          <span className="text-xs text-[#77738a]"> spent</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-semibold ${
                              isOver ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {isOver
                              ? `${formatINR(Math.abs(budget.remaining))} over`
                              : `${formatINR(budget.remaining)} left`}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f0eef6]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver
                              ? "bg-rose-500"
                              : isWarn
                              ? "bg-amber-500"
                              : "bg-[#2a234f]"
                          }`}
                          style={{
                            width: `${Math.min(100, budget.percentage)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#f0eef6] pt-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(budget)}
                          title="Edit Budget Limit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBudget(budget)}
                          title="Delete Budget"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#77738a] transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unbudgeted Spending Section */}
          {summary.unbudgeted.length > 0 && (
            <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#2a234f]">
                    Unbudgeted Spending ({formatINR(summary.totalUnbudgetedSpent)})
                  </h3>
                  <p className="text-xs text-[#77738a]">
                    These categories had expenses this month but do not have an active budget target.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.unbudgeted.map((u) => {
                  const IconComponent = getCategoryIcon(u.categoryName);
                  return (
                    <div
                      key={u.categoryId}
                      className="flex items-center justify-between rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#2a234f] shadow-xs">
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2a234f]">
                            {u.categoryName}
                          </p>
                          <p className="text-xs text-[#77738a]">
                            {formatINR(u.actualSpent)} ({u.transactionCount} txn
                            {u.transactionCount > 1 ? "s" : ""})
                          </p>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(u.categoryId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#e8e5ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#2a234f] shadow-xs transition hover:bg-[#f0eef6]"
                        >
                          <Plus size={12} />
                          <span>Budget</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a234f]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2a234f]">
                {editingBudget ? "Edit Category Budget" : "Set Category Budget"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-1 text-xs text-[#77738a]">
              Planned limit for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
            </p>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              {/* Category selector */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#2a234f]">
                  Expense Category
                </label>
                {editingBudget ? (
                  <div className="rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] px-3.5 py-2.5 text-sm font-semibold text-[#2a234f]">
                    {editingBudget.categoryName}
                  </div>
                ) : (
                  <AnimatedDropdown
                    value={formCategoryId}
                    options={availableCategories.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    onChange={(val) => setFormCategoryId(val)}
                  />
                )}
              </div>

              {/* Amount input */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#2a234f]">
                  Monthly Limit Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#77738a]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="e.g. 15000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white pl-8 pr-4 text-sm font-semibold text-[#2a234f] focus:border-[#2a234f] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                  {formError}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[#e8e5ef] px-4 py-2 text-sm font-semibold text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2a234f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1f1a3b] disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingBudget ? "Save Changes" : "Set Budget"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a234f]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={20} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-[#2a234f]">
              Remove Budget Limit?
            </h3>
            <p className="mt-1 text-xs text-[#77738a]">
              Are you sure you want to delete the {formatINR(deletingBudget.amount)} budget for{" "}
              <span className="font-bold text-[#2a234f]">
                {deletingBudget.categoryName}
              </span>{" "}
              in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}? Past transactions in this category will remain intact.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-[#e8e5ef] px-4 py-2 text-sm font-semibold text-[#77738a] hover:bg-[#f8f7fb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>Delete Limit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Previous Month Confirmation Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a234f]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f7fb] text-[#2a234f]">
              <Copy size={20} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-[#2a234f]">
              Copy Previous Month's Budgets?
            </h3>
            <p className="mt-1 text-xs text-[#77738a]">
              This will duplicate all category budget limits from the previous month into{" "}
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}. Any categories that already exist will remain unchanged.
            </p>

            {formError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                {formError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCopyModalOpen(false);
                  setFormError("");
                }}
                disabled={isSubmitting}
                className="rounded-xl border border-[#e8e5ef] px-4 py-2 text-sm font-semibold text-[#77738a] hover:bg-[#f8f7fb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCopy}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2a234f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1f1a3b] disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>Copy Budgets</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
