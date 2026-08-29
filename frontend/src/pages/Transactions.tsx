import { useMemo, useState, useEffect } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import AnimatedDropdown from "../components/AnimatedDropdown";
import TransactionItem from "../components/TransactionItem";
import { getTransactions, createTransaction } from "../services/transactionService";
import type { Transaction, TransactionType } from "../types/Transaction";
import AddTransactionModal from "../components/AddTransactionModel";
import { getFamilyMembers } from "../services/familyMemberService";
import { getCategories } from "../services/categoryService";
import type { FamilyMember } from "../services/familyMemberService";
import type { Category } from "../services/categoryService";

type CategoryFilter = "all" | string;

function Transactions() {
  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] =
    useState<CategoryFilter>("all");
  const [type, setType] =
    useState<TransactionType | "all">("all");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] =
    useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [transactions, members, categories] =
          await Promise.all([
            getTransactions(),
            getFamilyMembers(),
            getCategories(),
          ]);

        setTransactionList(transactions);
        setMembers(members);
        setCategories(categories);
      } catch (error) {
        console.error("Failed to load transaction data:", error);

        setError("Unable to load transaction data.");
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
      await createTransaction({
        memberId: newTransaction.memberId,
        categoryId: newTransaction.categoryId,
        title: newTransaction.title,
        amount: newTransaction.amount,
        type: newTransaction.type,
        transactionDate: newTransaction.date,
      });

      const updatedTransactions = await getTransactions();

      setTransactionList(updatedTransactions);

      setIsModalOpen(false);
    } catch (error) {
      console.error(
        "Failed to create transaction:",
        error,
      );

      setError("Unable to add transaction.");
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactionList.filter((transaction) => {
      const matchesSearch =
        transaction.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.member
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCategory =
        category === "all" ||
        transaction.category === category;

      const matchesType =
        type === "all" ||
        transaction.type === type;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType
      );
    });
  }, [transactionList, searchTerm, category, type]);

  const totalIncome = transactionList
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

  const totalExpenses = transactionList
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-600">
              Money activity
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Transactions
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              View and manage your family's income and expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="
              group
              inline-flex items-center justify-center gap-2
              rounded-xl
              bg-slate-900
              px-4 py-3
              text-sm font-semibold text-white
              shadow-lg shadow-slate-900/10
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-violet-600
              hover:shadow-xl hover:shadow-violet-500/20
              active:translate-y-0
              active:scale-[0.98]
            "
          >
            <span className="text-lg leading-none">+</span>
            Add transaction
          </button>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <SlidersHorizontal size={19} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                All transactions
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {transactionList.length}
              </p>
            </div>
          </div>
        </div>

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
                ₹{totalIncome.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

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
                ₹{totalExpenses.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search transactions..."
              className="
                h-11 w-full
                rounded-xl
                border border-slate-200
                bg-slate-50
                pl-10 pr-4
                text-sm text-slate-900
                outline-none
                transition-all duration-200
                placeholder:text-slate-400
                focus:border-violet-400
                focus:bg-white
                focus:ring-4
                focus:ring-violet-500/10
              "
            />
          </div>

          {/* Category */}
          <AnimatedDropdown
  value={category}
  onChange={(value) =>
    setCategory(value as CategoryFilter)
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
      value as TransactionType | "all",
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
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredTransactions.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
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
                text-violet-600
                transition-colors
                hover:bg-violet-50
              "
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Transaction list */}
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-2">
          <h2 className="text-base font-bold text-slate-900">
            All Transactions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            August 2026
          </p>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
            </div>
          )}

          {!isLoading && !error && filteredTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </section>
      {isModalOpen && (
        <AddTransactionModal
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddTransaction}
          categories={categories}
          members={members}
        />
      )}
    </div>
  );
}

export default Transactions;