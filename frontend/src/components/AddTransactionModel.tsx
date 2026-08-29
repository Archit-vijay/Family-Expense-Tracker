import { useState } from "react";
import { X } from "lucide-react";

import AnimatedDropdown from "./AnimatedDropdown";
import type { TransactionType } from "../types/Transaction";
import type { Category } from "../services/categoryService";
import type { FamilyMember } from "../services/familyMemberService";

interface AddTransactionFormData {
  title: string;
  amount: number;
  categoryId: number;
  type: TransactionType;
  memberId: number;
  date: string;
}

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: AddTransactionFormData) => void;
  categories: Category[];
  members: FamilyMember[];
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function AddTransactionModal({
  onClose,
  onAdd,
  categories,
  members,
}: AddTransactionModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] =
    useState<TransactionType>("expense");
  const [member, setMember] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [error, setError] = useState("");
  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!title.trim()) {
      setError("Please enter a transaction title.");
      return;
    }

    if (!amount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (!member) {
    setError("Please select a family member.");
    return;
    }

    const newTransaction = {
      title: title.trim(),
      categoryId: Number(category),
      amount: numericAmount,
      type,
      date,
      memberId: Number(member),
    };

    onAdd(newTransaction);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-enter w-full max-w-lg overflow-visible rounded-2xl border border-white/20 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add transaction
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Add an income or expense for your family.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl p-2 text-slate-400
              transition-all duration-200
              hover:bg-slate-100
              hover:text-slate-700
              active:scale-95
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          )}

          {/* Type */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Transaction type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  setCategory("");
                }}
                className={`
                  rounded-xl border px-4 py-3 text-sm font-semibold
                  transition-all duration-200
                  ${
                    type === "expense"
                      ? "border-rose-300 bg-rose-50 text-rose-600 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }
                `}
              >
                Expense
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategory("");
                }}
                className={`
                  rounded-xl border px-4 py-3 text-sm font-semibold
                  transition-all duration-200
                  ${
                    type === "income"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }
                `}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-5">
            <label
              htmlFor="amount"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Amount
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                ₹
              </span>

              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0.00"
                className="
                  h-12 w-full rounded-xl
                  border border-slate-200
                  bg-slate-50
                  pl-10 pr-4
                  text-lg font-semibold text-slate-900
                  outline-none
                  transition-all duration-200
                  placeholder:text-slate-300
                  focus:border-violet-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label
              htmlFor="title"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Description
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Groceries"
              className="
                h-11 w-full rounded-xl
                border border-slate-200
                bg-slate-50
                px-4
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

          {/* Category + Member */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Category
              </label>

              <AnimatedDropdown
  value={category}
  onChange={setCategory}
  options={[
    {
      value: "",
      label: "Select category",
    },
    ...filteredCategories.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ]}
/>
            </div>

            <div>
              <label
                htmlFor="member"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Family member
              </label>

              <AnimatedDropdown
  value={member}
  onChange={setMember}
  options={[
    {
      value: "",
      label: "Select member",
    },
    ...members.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ]}
/>
            </div>
          </div>

          {/* Date */}
          <div className="mb-6">
            <label
              htmlFor="date"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="
                h-11 w-full rounded-xl
                border border-slate-200
                bg-slate-50
                px-4
                text-sm text-slate-600
                outline-none
                transition-all duration-200
                focus:border-violet-400
                focus:bg-white
                focus:ring-4
                focus:ring-violet-500/10
              "
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl border border-slate-200
                px-5 py-3
                text-sm font-semibold text-slate-600
                transition-all duration-200
                hover:bg-slate-50
                active:scale-[0.98]
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                rounded-xl
                bg-slate-900
                px-5 py-3
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
              Add transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;