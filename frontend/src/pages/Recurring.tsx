import {
  AlertCircle,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Tv,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import ContentState from "../components/ContentState";
import StatCard from "../components/Statcard";
import { useAuth } from "../context/AuthContext";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactions,
  processDueRecurring,
  recordRecurringNow,
  togglePauseRecurring,
  updateRecurringTransaction,
  type CreateRecurringInput,
  type RecurringFrequency,
  type RecurringSummary,
  type RecurringTransaction,
  type RecurringType,
  type UpdateRecurringInput,
} from "../services/recurringService";
import { getCategories, type Category } from "../services/categoryService";
import { getFamilyMembers, type FamilyMember } from "../services/familyMemberService";

type FilterTab = "all" | "subscriptions" | "bills" | "income" | "paused";

export function Recurring() {
  const { familyRole } = useAuth();
  const canEdit = familyRole === "admin" || familyRole === "member";

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [summary, setSummary] = useState<RecurringSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Notifications / feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingDue, setIsProcessingDue] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<RecurringType>("expense");
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>("monthly");
  const [formCategoryId, setFormCategoryId] = useState<number | "">("");
  const [formMemberId, setFormMemberId] = useState<number | "">("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsSubscription, setFormIsSubscription] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        const [recData, cats, mems] = await Promise.all([
          getRecurringTransactions(),
          getCategories().catch(() => []),
          getFamilyMembers().catch(() => []),
        ]);

        if (isCurrent) {
          setItems(recData.items);
          setSummary(recData.summary);
          setCategories(cats);
          setMembers(mems);
        }
      } catch (err: any) {
        if (isCurrent) {
          setErrorMessage(err?.message || "Failed to load recurring commitments.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCurrent = false;
    };
  }, []);

  async function reloadRecurringData() {
    try {
      const recData = await getRecurringTransactions();
      setItems(recData.items);
      setSummary(recData.summary);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to refresh data.");
    }
  }

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  function showError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  }

  // Open Create Modal
  function handleOpenCreateModal() {
    setEditingItem(null);
    setFormTitle("");
    setFormAmount("");
    setFormType("expense");
    setFormFrequency("monthly");
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate("");
    setFormIsSubscription(false);
    setFormError(null);

    // Pick first matching category and member
    const firstExpenseCat = categories.find((c) => c.type === "expense");
    setFormCategoryId(firstExpenseCat ? firstExpenseCat.id : "");
    setFormMemberId(members[0] ? members[0].id : "");

    setIsModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEditModal(item: RecurringTransaction) {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormAmount(String(item.amount));
    setFormType(item.type);
    setFormFrequency(item.frequency);
    setFormCategoryId(item.category_id);
    setFormMemberId(item.member_id);
    setFormStartDate(item.start_date);
    setFormEndDate(item.end_date || "");
    setFormIsSubscription(item.is_subscription);
    setFormError(null);
    setIsModalOpen(true);
  }

  // Handle Form Submit (Create or Update)
  async function handleSubmitModal(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Please enter a title.");
      return;
    }
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid positive amount.");
      return;
    }
    if (!formCategoryId) {
      setFormError("Please select a category.");
      return;
    }
    if (!formMemberId) {
      setFormError("Please select a family member.");
      return;
    }
    if (!formStartDate) {
      setFormError("Please select a start date.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingItem) {
        const updatePayload: UpdateRecurringInput = {
          title: formTitle.trim(),
          amount: numAmount,
          type: formType,
          frequency: formFrequency,
          categoryId: Number(formCategoryId),
          memberId: Number(formMemberId),
          startDate: formStartDate,
          endDate: formEndDate || null,
          isSubscription: formIsSubscription,
        };
        await updateRecurringTransaction(editingItem.id, updatePayload);
        showSuccess(`Updated "${formTitle.trim()}".`);
      } else {
        const createPayload: CreateRecurringInput = {
          title: formTitle.trim(),
          amount: numAmount,
          type: formType,
          frequency: formFrequency,
          categoryId: Number(formCategoryId),
          memberId: Number(formMemberId),
          startDate: formStartDate,
          endDate: formEndDate || null,
          isSubscription: formIsSubscription,
        };
        await createRecurringTransaction(createPayload);
        showSuccess(`Created recurring schedule for "${formTitle.trim()}".`);
      }

      setIsModalOpen(false);
      await reloadRecurringData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save recurring commitment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete
  async function handleDelete(item: RecurringTransaction) {
    if (!canEdit) return;
    const confirmed = window.confirm(
      `Are you sure you want to stop tracking "${item.title}"? Historical transactions already logged will be safely preserved.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(item.id);
      await deleteRecurringTransaction(item.id);
      showSuccess(`Deleted recurring commitment "${item.title}".`);
      await reloadRecurringData();
    } catch (err: any) {
      showError(err?.message || "Failed to delete recurring item.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle Pause / Resume
  async function handleTogglePause(item: RecurringTransaction) {
    if (!canEdit) return;
    const isCurrentlyActive = item.status === "active";
    try {
      setActionLoadingId(item.id);
      await togglePauseRecurring(item.id, isCurrentlyActive);
      showSuccess(
        isCurrentlyActive
          ? `Paused "${item.title}".`
          : `Resumed "${item.title}".`
      );
      await reloadRecurringData();
    } catch (err: any) {
      showError(err?.message || "Failed to update status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle 1-Click "Record Now"
  async function handleRecordNow(item: RecurringTransaction) {
    if (!canEdit) return;
    try {
      setActionLoadingId(item.id);
      const res = await recordRecurringNow(item.id);
      showSuccess(
        `Recorded transaction for "${item.title}"! Next due date advanced to ${res.nextDueDate}.`
      );
      await reloadRecurringData();
    } catch (err: any) {
      showError(err?.message || "Failed to record transaction.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle Process Due Bills
  async function handleProcessDue() {
    if (!canEdit) return;
    try {
      setIsProcessingDue(true);
      const res = await processDueRecurring();
      if (res.processedCount > 0) {
        showSuccess(`Successfully logged ${res.processedCount} due transaction(s)!`);
      } else {
        showSuccess("All recurring commitments are up to date. No due bills found today.");
      }
      await reloadRecurringData();
    } catch (err: any) {
      showError(err?.message || "Failed to process due bills.");
    } finally {
      setIsProcessingDue(false);
    }
  }

  // Filtered Items based on Tab & Search Query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "subscriptions" && (!item.is_subscription || item.type !== "expense")) {
        return false;
      }
      if (activeTab === "bills" && (item.is_subscription || item.type !== "expense" || item.status === "paused")) {
        return false;
      }
      if (activeTab === "income" && item.type !== "income") {
        return false;
      }
      if (activeTab === "paused" && item.status !== "paused") {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCat = item.category_name?.toLowerCase().includes(q);
        const matchesMember = item.member_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesMember) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeTab, searchQuery]);

  // Urgent / Due Soon Items (due in <= 7 days)
  const urgentDueItems = useMemo(() => {
    return items.filter(
      (item) => item.status === "active" && item.days_until_due !== undefined && item.days_until_due <= 7
    );
  }, [items]);

  // Categories filtered by active modal formType
  const availableModalCategories = useMemo(() => {
    return categories.filter((c) => c.type === formType);
  }, [categories, formType]);

  return (
    <div className="page-enter pb-16">
      {/* Header */}
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-up">
        <div>
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
            Cash Flow Automation
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
            Recurring & Subscriptions
          </h1>
          <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
            Automate household bills, manage streaming subscriptions, and track upcoming payment dates.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleProcessDue}
              disabled={isProcessingDue}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e8e5ef] bg-white px-4 text-xs font-bold text-[#2a234f] shadow-xs transition hover:bg-[#f8f7fb] active:scale-95 disabled:opacity-50"
              title="Check and automatically record any commitments due today"
            >
              <RotateCcw size={15} className={isProcessingDue ? "animate-spin text-[#2a234f]" : "text-[#77738a]"} />
              <span>Process Due Bills</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2a234f] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-95"
            >
              <Plus size={16} className="text-[#ffb3c3]" />
              <span>Add Recurring Commitment</span>
            </button>
          </div>
        )}
      </section>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-fade-in shadow-xs">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 animate-fade-in shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <ContentState
          variant="loading"
          title="Loading recurring commitments"
          description="Calculating upcoming due dates and active subscription costs..."
        />
      ) : (
        <div className="space-y-6 fade-up">
          {/* Top 4 KPI Summary Cards with signature animations */}
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 fade-up"
            style={{ animationDelay: "100ms" }}
          >
            {/* Card 1: Monthly Committed Expenses */}
            <StatCard
              title="Committed Expenses"
              amount={
                <>
                  ₹{summary?.monthlyCommittedExpense.toLocaleString("en-IN") || 0}
                  <span className="text-xs font-normal text-[#77738a] dark:text-[#a5a0ba]"> / mo</span>
                </>
              }
              description="Normalized monthly fixed costs"
              icon={TrendingDown}
              variant="expense"
            />

            {/* Card 2: Active Subscriptions */}
            <StatCard
              title="Subscriptions"
              amount={
                <>
                  {summary?.activeSubscriptionsCount || 0}
                  <span className="text-xs font-normal text-[#77738a] dark:text-[#a5a0ba]"> active</span>
                </>
              }
              description={`₹${summary?.monthlySubscriptionCost.toLocaleString("en-IN") || 0} / mo streaming & subs`}
              icon={Tv}
              variant="subscription"
            />

            {/* Card 3: Next Due Date Radar */}
            <StatCard
              title="Next Due Bill"
              amount={
                summary?.nextUpcomingItem ? (
                  <span className="truncate text-xl sm:text-2xl" title={summary.nextUpcomingItem.title}>
                    {summary.nextUpcomingItem.title}
                  </span>
                ) : (
                  <span className="text-xl text-[#77738a] dark:text-[#a5a0ba]">
                    None pending
                  </span>
                )
              }
              description={
                summary?.nextUpcomingItem ? (
                  <span className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                    <Clock size={13} className="shrink-0" />
                    <span className="truncate">
                      {summary.nextUpcomingItem.daysUntilDue === 0
                        ? "Due today"
                        : summary.nextUpcomingItem.daysUntilDue === 1
                          ? "Due tomorrow"
                          : `Due in ${summary.nextUpcomingItem.daysUntilDue}d`}
                      {" · "}₹{summary.nextUpcomingItem.amount.toLocaleString("en-IN")}
                    </span>
                  </span>
                ) : (
                  "No active commitments due"
                )
              }
              icon={CalendarClock}
              variant={summary?.nextUpcomingItem ? "amber" : "balance"}
            />

            {/* Card 4: Recurring Income */}
            <StatCard
              title="Recurring Income"
              amount={
                <>
                  ₹{summary?.monthlyCommittedIncome.toLocaleString("en-IN") || 0}
                  <span className="text-xs font-normal text-[#77738a] dark:text-[#a5a0ba]"> / mo</span>
                </>
              }
              description="Expected monthly salary & retainers"
              icon={TrendingUp}
              variant="income"
            />
          </section>

          {/* Upcoming Due Radar Banner (if any bills are due in <= 7 days) */}
          {urgentDueItems.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <CalendarClock size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    Upcoming Bill Radar (Next 7 Days)
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    {urgentDueItems.length} payment commitment(s) require attention this week.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {urgentDueItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white p-3.5 shadow-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-[#2a234f]">
                          {item.title}
                        </span>
                        {item.is_subscription && (
                          <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700">
                            Sub
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#77738a] mt-0.5">
                        ₹{item.amount.toLocaleString("en-IN")} ·{" "}
                        <span className="font-bold text-amber-700">
                          {item.days_until_due === 0
                            ? "Due today"
                            : item.days_until_due! < 0
                              ? `Overdue by ${Math.abs(item.days_until_due!)}d`
                              : `Due in ${item.days_until_due}d`}
                        </span>
                      </p>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRecordNow(item)}
                        disabled={actionLoadingId === item.id}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#2a234f] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#1f1a3b] active:scale-95 disabled:opacity-50"
                        title="Record this payment to transactions now"
                      >
                        {actionLoadingId === item.id ? (
                          <Loader2 size={12} className="animate-spin text-[#ffb3c3]" />
                        ) : (
                          <Check size={12} />
                        )}
                        <span>Record</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls: Search & Tabs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e8e5ef] pb-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-[#2a234f] text-white shadow-xs"
                    : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                }`}
              >
                All Commitments ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("subscriptions")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "subscriptions"
                    ? "bg-[#2a234f] text-white shadow-xs"
                    : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                }`}
              >
                <Tv size={13} />
                <span>Subscriptions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bills")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "bills"
                    ? "bg-[#2a234f] text-white shadow-xs"
                    : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                }`}
              >
                <CreditCard size={13} />
                <span>Household Bills</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("income")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "income"
                    ? "bg-[#2a234f] text-white shadow-xs"
                    : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                }`}
              >
                <TrendingUp size={13} />
                <span>Recurring Income</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("paused")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "paused"
                    ? "bg-[#2a234f] text-white shadow-xs"
                    : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                }`}
              >
                Paused
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77738a]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commitments..."
                className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white pl-9 pr-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {filteredItems.length === 0 ? (
            <ContentState
              variant="empty"
              title="No recurring commitments found"
              description={
                searchQuery
                  ? "No items match your search filter."
                  : "Add your rent, Netflix subscription, gym membership, or monthly salary to get started."
              }
              action={
                canEdit && !searchQuery ? (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1f1a3b]"
                  >
                    <Plus size={15} />
                    Add First Recurring Commitment
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const isExpense = item.type === "expense";
                const isPaused = item.status === "paused";
                const isCompleted = item.status === "completed";
                const daysUntil = item.days_until_due ?? 0;

                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                      isPaused
                        ? "border-[#e8e5ef] opacity-75"
                        : isExpense
                          ? "border-[#e8e5ef] hover:border-[#ffb3c3]"
                          : "border-emerald-100 hover:border-emerald-300"
                    }`}
                  >
                    {/* Top Row: Title, Badges, Status */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-base font-bold text-[#2a234f]" title={item.title}>
                              {item.title}
                            </h3>
                            {item.is_subscription && (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                Sub
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#77738a] flex items-center gap-1.5">
                            <Tag size={12} />
                            <span>{item.category_name}</span>
                            <span>•</span>
                            <User size={12} />
                            <span>{item.member_name}</span>
                          </p>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isPaused
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isCompleted
                                ? "bg-slate-100 text-slate-700"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isPaused ? "Paused" : isCompleted ? "Completed" : "Active"}
                        </span>
                      </div>

                      {/* Amount and Frequency */}
                      <div className="mt-4 flex items-baseline justify-between border-b border-[#e8e5ef] pb-3.5">
                        <span className={`text-2xl font-black ${isExpense ? "text-[#2a234f]" : "text-emerald-600"}`}>
                          {isExpense ? "₹" : "+₹"}
                          {item.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="rounded-lg bg-[#f8f7fb] px-2 py-1 text-xs font-bold capitalize text-[#77738a]">
                          {item.frequency}
                        </span>
                      </div>

                      {/* Next Due Info */}
                      <div className="mt-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#77738a]">
                          <Calendar size={13} />
                          <span>Next: {item.next_due_date}</span>
                        </div>

                        {!isPaused && !isCompleted && (
                          <span
                            className={`font-bold ${
                              daysUntil <= 0
                                ? "text-rose-600 font-extrabold"
                                : daysUntil <= 7
                                  ? "text-amber-600 font-bold"
                                  : "text-[#77738a]"
                            }`}
                          >
                            {daysUntil === 0
                              ? "Due Today"
                              : daysUntil < 0
                                ? `Overdue by ${Math.abs(daysUntil)}d`
                                : `In ${daysUntil} days`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    {canEdit && (
                      <div className="mt-5 flex items-center justify-between border-t border-[#e8e5ef] pt-3.5">
                        <button
                          type="button"
                          onClick={() => handleRecordNow(item)}
                          disabled={actionLoadingId === item.id || isPaused}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#2a234f] hover:text-[#1f1a3b] transition disabled:opacity-40"
                          title="Record transaction right now"
                        >
                          {actionLoadingId === item.id ? (
                            <Loader2 size={13} className="animate-spin text-[#2a234f]" />
                          ) : (
                            <Check size={13} className="text-emerald-600" />
                          )}
                          <span>Record Now</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePause(item)}
                            disabled={actionLoadingId === item.id}
                            title={isPaused ? "Resume schedule" : "Pause schedule"}
                            className="p-1.5 text-[#77738a] hover:text-[#2a234f] rounded-lg hover:bg-[#f8f7fb] transition"
                          >
                            {isPaused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit commitment"
                            className="p-1.5 text-[#77738a] hover:text-[#2a234f] rounded-lg hover:bg-[#f8f7fb] transition"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Delete commitment"
                            className="p-1.5 text-[#77738a] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT RECURRING TRANSACTION */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17132f]/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative my-8 w-full max-w-lg rounded-3xl border border-[#e8e5ef] bg-white p-6 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-[#77738a] hover:text-[#2a234f]"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffb3c3]/30 text-[#2a234f]">
                <Repeat size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2a234f]">
                  {editingItem ? "Edit Recurring Commitment" : "Add Recurring Commitment"}
                </h3>
                <p className="text-xs text-[#77738a]">
                  Set schedule, cadence, and automated transaction logging.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="mt-5 space-y-4 text-xs">
              {/* Type Switcher: Expense vs Income */}
              <div>
                <label className="mb-1 block font-semibold text-[#77738a]">
                  Commitment Type
                </label>
                <div className="flex h-10 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("expense");
                      const firstExp = categories.find((c) => c.type === "expense");
                      if (firstExp) setFormCategoryId(firstExp.id);
                    }}
                    className={`flex-1 rounded-lg font-bold transition ${
                      formType === "expense"
                        ? "bg-[#2a234f] text-white shadow-xs"
                        : "text-[#77738a] hover:text-[#2a234f]"
                    }`}
                  >
                    Expense / Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("income");
                      const firstInc = categories.find((c) => c.type === "income");
                      if (firstInc) setFormCategoryId(firstInc.id);
                    }}
                    className={`flex-1 rounded-lg font-bold transition ${
                      formType === "income"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-[#77738a] hover:text-[#2a234f]"
                    }`}
                  >
                    Recurring Income
                  </button>
                </div>
              </div>

              {/* Title & Amount Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-[#77738a]">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Netflix, Rent, Salary"
                    className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[#77738a]">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 1499"
                    className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                </div>
              </div>

              {/* Category & Member Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-[#77738a]">
                    Category
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3]"
                  >
                    <option value="" disabled>Select category</option>
                    {availableModalCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[#77738a]">
                    Family Member
                  </label>
                  <select
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3]"
                  >
                    <option value="" disabled>Select member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cadence Frequency & Start Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-[#77738a]">
                    Cadence / Frequency
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                    className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (Every 3 months)</option>
                    <option value="yearly">Yearly (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[#77738a]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3]"
                  />
                </div>
              </div>

              {/* End Date (Optional) */}
              <div>
                <label className="mb-1 block font-semibold text-[#77738a]">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  placeholder="Leave empty for continuous schedule"
                  className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3]"
                />
                <p className="mt-1 text-[11px] text-[#9a96a8]">
                  Schedule completes automatically once the end date passes.
                </p>
              </div>

              {/* Is Subscription Checkbox */}
              {formType === "expense" && (
                <div className="flex items-center gap-2.5 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3">
                  <input
                    type="checkbox"
                    id="isSubscriptionCheck"
                    checked={formIsSubscription}
                    onChange={(e) => setFormIsSubscription(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#2a234f]"
                  />
                  <label htmlFor="isSubscriptionCheck" className="text-xs font-semibold text-[#2a234f] cursor-pointer">
                    Mark as Digital/Service Subscription (e.g. Netflix, Spotify, Gym, iCloud)
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8e5ef]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#e8e5ef] px-4 py-2.5 text-xs font-bold text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? "Save Changes" : "Create Schedule"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recurring;
