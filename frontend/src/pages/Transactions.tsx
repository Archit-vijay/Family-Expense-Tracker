import { useMemo, useState, useEffect } from "react"; 

import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import AnimatedDropdown from "../components/AnimatedDropdown";
import ContentState from "../components/ContentState";
import TransactionItem from "../components/TransactionItem";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deactivateTransaction,
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
            "
          >
            <span className="text-lg leading-none text-[#ffb3c3]">
              +
            </span>

            Add transaction
          </button>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {/* All transactions */}
        <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#ffb3c3]/20 p-3 text-[#2a234f]">
              <SlidersHorizontal size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-[#77738a]">
                All transactions
              </p>

              <p className="mt-1 text-xl font-bold text-[#2a234f]">
                {transactionList.length}
              </p>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <ArrowDownLeft size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-emerald-700">
                Income
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-700">
                ₹
                {totalIncome.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
              <ArrowUpRight size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-rose-700">
                Expenses
              </p>

              <p className="mt-1 text-xl font-bold text-rose-700">
                ₹
                {totalExpenses.toLocaleString(
                  "en-IN",
                )}
              </p>
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
        <div className="mb-2">
          <h2 className="text-base font-bold text-[#2a234f]">
            All Transactions
          </h2>

          <p className="mt-1 text-xs text-[#9a96a8]">
            August 2026
          </p>
        </div>

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
            {filteredTransactions.map(
              (transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                  onRemove={handleRemoveTransaction}
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

      {/* Remove confirmation */}
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
    </div>
  );
}

export default Transactions;
