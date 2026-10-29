import { useMemo, useState, useEffect } from "react"; 

import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import AnimatedDropdown from "../components/AnimatedDropdown";
import ContentState from "../components/ContentState";
import TransactionItem from "../components/TransactionItem";
import StatementImportModal from "../components/StatementImportModal";
import ExportModal from "../components/ExportModal";
import { useAuth } from "../context/AuthContext";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deactivateTransaction,
  bulkDeactivateTransactions,
} from "../services/transactionService";

import type {
  Transaction,
  TransactionType,
} from "../types/Transaction";

import AddTransactionModal from "../components/AddTransactionModel";

import {
  getFamilyMembers,
} from "../services/familyMemberService";

import {
  getCategories,
} from "../services/categoryService";

import type {
  FamilyMember,
} from "../services/familyMemberService";

import type {
  Category,
} from "../services/categoryService";

type CategoryFilter = "all" | string;

function Transactions() {
  const { familyRole } = useAuth();
  const canEdit = familyRole === "admin" || familyRole === "member";

  const [transactionList, setTransactionList] =
    useState<Transaction[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [category, setCategory] =
    useState<CategoryFilter>("all");

  const [type, setType] =
    useState<TransactionType | "all">("all");

  const [members, setMembers] =
    useState<FamilyMember[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isImportModalOpen, setIsImportModalOpen] =
    useState(false);

  const [isExportModalOpen, setIsExportModalOpen] =
    useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [removingTransaction, setRemovingTransaction] =
    useState<Transaction | null>(null);

  const [transactionActionError, setTransactionActionError] =
    useState("");

  const [removeTransactionError, setRemoveTransactionError] =
    useState("");

  const [isRemoving, setIsRemoving] =
    useState(false);

  // Pagination state (10 items per page)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Multi-select / Bulk deletion state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [
          transactions,
          members,
          categories,
        ] = await Promise.all([
          getTransactions(),
          getFamilyMembers(),
          getCategories(),
        ]);

        setTransactionList(transactions);
        setMembers(members);
        setCategories(categories);
      } catch (error) {
        console.error(
          "Failed to load transaction data:",
          error,
        );

        setError(
          "Unable to load transaction data.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Reset page and selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, category, type]);

  async function handleAddTransaction(
    newTransaction: {
      title: string;
      amount: number;
      categoryId: number;
      type: TransactionType;
      memberId: number;
      date: string;
    },
  ) {
    try {
      setTransactionActionError("");

      await createTransaction({
        memberId: newTransaction.memberId,
        categoryId: newTransaction.categoryId,
        title: newTransaction.title,
        amount: newTransaction.amount,
        type: newTransaction.type,
        transactionDate: newTransaction.date,
      });

      const updatedTransactions =
        await getTransactions();

      setTransactionList(updatedTransactions);

      setIsModalOpen(false);
    } catch (error) {
      console.error(
        "Failed to create transaction:",
        error,
      );

      setTransactionActionError(
        error instanceof Error
          ? error.message
          : "Unable to add transaction.",
      );
    }
  }

  async function handleUpdateTransaction(
    transactionId: number,
    updatedTransaction: {
      title: string;
      amount: number;
      categoryId: number;
      type: TransactionType;
      memberId: number;
      date: string;
    },
  ) {
    try {
      setTransactionActionError("");

      await updateTransaction(
        transactionId,
        {
          memberId:
            updatedTransaction.memberId,
          categoryId:
            updatedTransaction.categoryId,
          title: updatedTransaction.title,
          amount: updatedTransaction.amount,
          type: updatedTransaction.type,
          transactionDate:
            updatedTransaction.date,
        },
      );

      const updatedTransactions =
        await getTransactions();

      setTransactionList(updatedTransactions);

      setIsModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error(
        "Failed to update transaction:",
        error,
      );

      setTransactionActionError(
        error instanceof Error
          ? error.message
          : "Unable to update transaction.",
      );
    }
  }

  function handleEditTransaction(
    transaction: Transaction,
  ) {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }

  function handleRemoveTransaction(
    transaction: Transaction,
  ) {
    setRemoveTransactionError("");
    setRemovingTransaction(transaction);
  }

  async function handleConfirmRemove() {
    if (!removingTransaction) {
      return;
    }

    try {
      setIsRemoving(true);
      setRemoveTransactionError("");

      await deactivateTransaction(
        removingTransaction.id,
      );

      setTransactionList((current) =>
        current.filter(
          (transaction) =>
            transaction.id !==
            removingTransaction.id,
        ),
      );

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(removingTransaction.id);
        return next;
      });

      setRemovingTransaction(null);
    } catch (error) {
      console.error(
        "Failed to remove transaction:",
        error,
      );

      setRemoveTransactionError(
        error instanceof Error
          ? error.message
          : "Unable to remove transaction.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactionList.filter(
      (transaction) => {
        const search =
          searchTerm.toLowerCase();

        const matchesSearch =
          transaction.title
            .toLowerCase()
            .includes(search) ||
          transaction.category
            .toLowerCase()
            .includes(search) ||
          transaction.member
            .toLowerCase()
            .includes(search);

        const matchesCategory =
          category === "all" ||
          transaction.category ===
            category;

        const matchesType =
          type === "all" ||
          transaction.type === type;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesType
        );
      },
    );
  }, [
    transactionList,
    searchTerm,
    category,
    type,
  ]);

  const totalIncome =
    transactionList
      .filter(
        (transaction) =>
          transaction.type === "income",
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0,
      );

  const totalExpenses =
    transactionList
      .filter(
        (transaction) =>
          transaction.type === "expense",
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0,
      );

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const startIndex = filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, filteredTransactions.length);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // Multi-selection logic
  const currentPageIds = useMemo(
    () => paginatedTransactions.map((t) => t.id),
    [paginatedTransactions]
  );

  const isAllCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));

  function handleToggleSelect(transaction: Transaction) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(transaction.id)) {
        next.delete(transaction.id);
      } else {
        next.add(transaction.id);
      }
      return next;
    });
  }

  function handleToggleSelectAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllCurrentPageSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleSelectAllFiltered() {
    setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
  }

  function handleDeselectAll() {
    setSelectedIds(new Set());
  }

  async function handleConfirmBulkDelete() {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      setBulkDeleteError("");
      const idsToDelete = Array.from(selectedIds);
      await bulkDeactivateTransactions(idsToDelete);

      setTransactionList((current) =>
        current.filter((transaction) => !selectedIds.has(transaction.id))
      );
      setSelectedIds(new Set());
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      setBulkDeleteError(err?.message || "Failed to delete selected transactions.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#2a234f]">
              Money activity
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
              Transactions
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77738a] sm:text-base">
              View and manage your family's
              income and expenses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Export Reports Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="
                group
                inline-flex items-center justify-center gap-2
                rounded-xl
                border border-[#e8e5ef]
                bg-white
                px-4 py-3
                text-sm font-semibold text-[#2a234f]
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:border-[#ffb3c3]
                hover:bg-[#fff7f9]
                hover:shadow-md
                active:translate-y-0
                active:scale-[0.98]
                dark:border-[#2e265c]
                dark:bg-[#161130]
                dark:text-[#f5f3fa]
                dark:hover:border-[#ffb3c3]/40
                dark:hover:bg-[#201744]
              "
            >
              <Download size={16} className="text-[#2a234f] dark:text-[#ffb3c3]" />
              <span>Export Reports</span>
            </button>

            {canEdit && (
              <>
                {/* Import Statement Button */}
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="
                    group
                    inline-flex items-center justify-center gap-2
                    rounded-xl
                    border border-[#e8e5ef]
                    bg-white
                    px-4 py-3
                    text-sm font-semibold text-[#2a234f]
                    shadow-sm
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:border-[#ffb3c3]
                    hover:bg-[#fff7f9]
                    hover:shadow-md
                    active:translate-y-0
                    active:scale-[0.98]
                    dark:border-[#2e265c]
                    dark:bg-[#161130]
                    dark:text-[#f5f3fa]
                    dark:hover:border-[#ffb3c3]/40
                    dark:hover:bg-[#201744]
                  "
                >
                  <FileSpreadsheet size={16} className="text-[#2a234f] dark:text-[#ffb3c3]" />
                  <span>Import Statement</span>
                </button>

                {/* Add transaction button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsModalOpen(true);
                  }}
                  className="
                    group
                    inline-flex items-center justify-center gap-2
                    rounded-xl
                    bg-[#2a234f]
                    px-4 py-3
                    text-sm font-semibold text-white
                    shadow-lg shadow-[#2a234f]/15
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:bg-[#1f1a3b]
                    hover:shadow-xl hover:shadow-[#2a234f]/20
                    active:translate-y-0
                    active:scale-[0.98]
                    dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e]
                    dark:border dark:border-[#4d4090]/80
                    dark:text-[#f5f3fa]
                  "
                >
                  <span className="text-lg leading-none text-[#ffb3c3]">
                    +
                  </span>

                  Add transaction
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Summary cards with signature animations */}
      <section className="grid gap-4 sm:grid-cols-3 mb-6">
        {/* All transactions */}
        <div
          className="stat-card fade-up cursor-default"
          style={{ animationDelay: "60ms" }}
        >
          <div className="stat-card-accent" />
          <div className="stat-card-glow" />
          <div className="stat-card-content">
            <div className="min-w-0 flex-1">
              <p className="stat-card-title truncate">
                All transactions
              </p>
              <p className="stat-card-amount">
                {transactionList.length}
              </p>
              <p className="stat-card-description">
                Total logged records
              </p>
            </div>
            <div className="stat-card-icon shrink-0 ml-3 stat-icon-balance">
              <SlidersHorizontal size={21} />
            </div>
          </div>
        </div>

        {/* Income */}
        <div
          className="stat-card fade-up cursor-default"
          style={{ animationDelay: "120ms" }}
        >
          <div className="stat-card-accent" />
          <div className="stat-card-glow" />
          <div className="stat-card-content">
            <div className="min-w-0 flex-1">
              <p className="stat-card-title truncate">
                Income
              </p>
              <p className="stat-card-amount text-emerald-700">
                ₹{totalIncome.toLocaleString("en-IN")}
              </p>
              <p className="stat-card-description">
                Total cash inflow
              </p>
            </div>
            <div className="stat-card-icon shrink-0 ml-3 stat-icon-income">
              <ArrowDownLeft size={21} />
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div
          className="stat-card fade-up cursor-default"
          style={{ animationDelay: "180ms" }}
        >
          <div className="stat-card-accent" />
          <div className="stat-card-glow" />
          <div className="stat-card-content">
            <div className="min-w-0 flex-1">
              <p className="stat-card-title truncate">
                Expenses
              </p>
              <p className="stat-card-amount text-rose-700">
                ₹{totalExpenses.toLocaleString("en-IN")}
              </p>
              <p className="stat-card-description">
                Total cash outflow
              </p>
            </div>
            <div className="stat-card-icon shrink-0 ml-3 stat-icon-expense">
              <ArrowUpRight size={21} />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mt-6 rounded-2xl border border-[#e8e5ef] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2
                text-[#9a96a8]
              "
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search transactions..."
              className="
                h-11 w-full
                rounded-xl
                border border-[#e8e5ef]
                bg-[#f8f7fb]
                pl-10 pr-4
                text-sm text-[#2a234f]
                outline-none
                transition-all duration-200
                placeholder:text-[#9a96a8]
                focus:border-[#ffb3c3]
                focus:bg-white
                focus:ring-4
                focus:ring-[#ffb3c3]/20
              "
            />
          </div>

          {/* Category */}
          <AnimatedDropdown
            value={category}
            onChange={(value) =>
              setCategory(
                value as CategoryFilter,
              )
            }
            options={[
              {
                value: "all",
                label: "All categories",
              },
              ...categories.map((item) => ({
                value: item.name,
                label: item.name,
              })),
            ]}
            className="w-full lg:w-48"
          />

          {/* Type */}
          <AnimatedDropdown
            value={type}
            onChange={(value) =>
              setType(
                value as
                  | TransactionType
                  | "all",
              )
            }
            options={[
              {
                value: "all",
                label: "All types",
              },
              {
                value: "income",
                label: "Income",
              },
              {
                value: "expense",
                label: "Expenses",
              },
            ]}
            className="w-full lg:w-44"
          />
        </div>

        {/* Active filter information */}
        {(searchTerm ||
          category !== "all" ||
          type !== "all") && (
          <div className="mt-3 flex items-center justify-between border-t border-[#e8e5ef] pt-3">
            <p className="text-xs text-[#77738a]">
              Showing{" "}
              <span className="font-semibold text-[#2a234f]">
                {filteredTransactions.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#2a234f]">
                {transactionList.length}
              </span>{" "}
              transactions
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategory("all");
                setType("all");
              }}
              className="
                rounded-lg px-2.5 py-1.5
                text-xs font-semibold
                text-[#2a234f]
                transition-colors
                hover:bg-[#ffb3c3]/20
              "
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Transaction list */}
      <section className="mt-6 rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6">
        {/* List Header with Select All Action */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#2a234f]">
              All Transactions
            </h2>

            <p className="mt-0.5 text-xs text-[#9a96a8]">
              {filteredTransactions.length === 0
                ? "No transactions"
                : `Showing ${startIndex}–${endIndex} of ${filteredTransactions.length} records`}
            </p>
          </div>

          {canEdit && paginatedTransactions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAllPage}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] px-3 py-1.5 text-xs font-semibold text-[#2a234f] transition hover:bg-[#ffb3c3]/20 active:scale-95"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-md border transition ${
                    isAllCurrentPageSelected
                      ? "border-[#2a234f] bg-[#2a234f] text-white"
                      : "border-[#d9d5e3] bg-white"
                  }`}
                >
                  {isAllCurrentPageSelected && <Check size={11} strokeWidth={3} />}
                </span>
                <span>
                  {isAllCurrentPageSelected ? "Deselect Page" : "Select Page (10)"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Floating / Sticky Bulk Action Bar */}
        {selectedIds.size > 0 && canEdit && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2a234f]/20 bg-[#2a234f] p-3 text-white shadow-lg animate-fade-in">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex h-7 px-2.5 items-center justify-center rounded-xl bg-[#ffb3c3] text-xs font-black text-[#2a234f]">
                {selectedIds.size}
              </span>
              <span className="text-xs font-semibold text-white/90 sm:text-sm">
                {selectedIds.size === 1
                  ? "1 transaction selected"
                  : `${selectedIds.size} transactions selected`}
              </span>

              {filteredTransactions.length > currentPageIds.length &&
                selectedIds.size < filteredTransactions.length && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-xs text-[#ffb3c3] underline underline-offset-2 hover:text-white transition"
                  >
                    Select all {filteredTransactions.length} matching
                  </button>
                )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeselectAll}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkDeleteError("");
                  setIsBulkDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
              >
                <Trash2 size={13} />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <ContentState
            variant="loading"
            title="Loading transactions"
            description="Getting your family’s latest money activity."
          />
        ) : error ? (
          <ContentState
            variant="error"
            title="Unable to load transactions"
            description={error}
          />
        ) : (
          <div className="space-y-3">
            {paginatedTransactions.map(
              (transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                  onRemove={handleRemoveTransaction}
                  selectable={canEdit}
                  isSelected={selectedIds.has(transaction.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ),
            )}

            {filteredTransactions.length === 0 && (
              <ContentState
                variant="empty"
                title={
                  transactionList.length === 0
                    ? "No transactions yet"
                    : "No transactions found"
                }
                description={
                  transactionList.length === 0
                    ? "Add an income or expense to start tracking your family’s finances."
                    : "Try changing your search or filters."
                }
              />
            )}
          </div>
        )}

        {/* Pagination Bar (at bottom) */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[#e8e5ef] pt-4 sm:flex-row">
            <p className="text-xs text-[#77738a]">
              Showing <span className="font-semibold text-[#2a234f]">{startIndex}</span> to{" "}
              <span className="font-semibold text-[#2a234f]">{endIndex}</span> of{" "}
              <span className="font-semibold text-[#2a234f]">{filteredTransactions.length}</span> transactions
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs font-semibold text-[#2a234f] shadow-2xs transition hover:bg-[#f8f7fb] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${
                        currentPage === p
                          ? "bg-[#2a234f] text-white shadow-xs"
                          : "border border-transparent text-[#77738a] hover:border-[#e8e5ef] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-[#9a96a8]">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs font-semibold text-[#2a234f] shadow-2xs transition hover:bg-[#f8f7fb] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Add / Edit transaction modal */}
      {isModalOpen && (
        <AddTransactionModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          onAdd={handleAddTransaction}
          onEdit={handleUpdateTransaction}
          transaction={editingTransaction}
          categories={categories}
          members={members}
          actionError={transactionActionError}
        />
      )}

      {/* Bank Statement Import Modal */}
      {isImportModalOpen && (
        <StatementImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          categories={categories}
          members={members}
          onImportComplete={async () => {
            const updated = await getTransactions();
            setTransactionList(updated);
          }}
        />
      )}

      {/* Remove confirmation (single) */}
      {removingTransaction && (
        <div
          className="
            fixed inset-0 z-60
            flex items-center justify-center
            bg-[#2a234f]/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !isRemoving
            ) {
              setRemovingTransaction(null);
              setRemoveTransactionError("");
            }
          }}
        >
          <div
            className="
              modal-enter
              w-full max-w-sm
              rounded-2xl
              border border-[#e8e5ef]
              bg-white
              p-6
              shadow-2xl
              shadow-[#2a234f]/20
            "
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
              <Trash2
                size={20}
                className="text-rose-600"
              />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[#2a234f]">
              Remove transaction?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#77738a]">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#2a234f]">
                {removingTransaction.title}
              </span>
              ? This transaction will no longer
              appear in your transaction list.
            </p>

            {removeTransactionError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {removeTransactionError}
              </div>
            )}        

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() =>
                  {
                    setRemovingTransaction(null);
                    setRemoveTransactionError("");
                  }
                }
                className="
                  rounded-xl
                  border border-[#e8e5ef]
                  px-4 py-2.5
                  text-sm font-semibold
                  text-[#77738a]
                  transition-colors
                  hover:bg-[#f8f7fb]
                  hover:text-[#2a234f]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRemoving}
                onClick={
                  handleConfirmRemove
                }
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  bg-rose-600
                  px-4 py-2.5
                  text-sm font-semibold
                  text-white
                  shadow-lg shadow-rose-600/10
                  transition-all duration-200
                  hover:bg-rose-700
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isRemoving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {isRemoving
                  ? "Removing..."
                  : "Remove transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-[#2a234f]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isBulkDeleting) {
              setIsBulkDeleteModalOpen(false);
              setBulkDeleteError("");
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-2xl shadow-[#2a234f]/20 animate-scale-in">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[#2a234f]">
              Remove {selectedIds.size} transaction{selectedIds.size > 1 ? "s" : ""}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#77738a]">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#2a234f]">
                {selectedIds.size} selected transaction{selectedIds.size > 1 ? "s" : ""}
              </span>
              ? They will no longer appear in your active transaction list.
            </p>

            {bulkDeleteError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {bulkDeleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => {
                  setIsBulkDeleteModalOpen(false);
                  setBulkDeleteError("");
                }}
                className="rounded-xl border border-[#e8e5ef] px-4 py-2.5 text-sm font-semibold text-[#77738a] transition-colors hover:bg-[#f8f7fb] hover:text-[#2a234f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleConfirmBulkDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/10 transition-all duration-200 hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBulkDeleting && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {isBulkDeleting
                  ? "Removing..."
                  : `Remove ${selectedIds.size} Transaction${selectedIds.size > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Export Reports Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        categories={categories}
        members={members}
      />
    </div>
  );
}

export default Transactions;
