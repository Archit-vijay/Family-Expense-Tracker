import { useEffect, useState } from "react";

import { X } from "lucide-react";

import AnimatedDropdown from "./AnimatedDropdown";

import type { TransactionType } from "../types/Transaction";
import type { Transaction } from "../types/Transaction";

import type { Category } from "../services/categoryService";
import type { FamilyMember } from "../services/familyMemberService";

interface TransactionFormData {
  title: string;
  amount: number;
  categoryId: number;
  type: TransactionType;
  memberId: number;
  date: string;
}

interface AddTransactionModalProps {
  onClose: () => void;

  onAdd: (
    transaction: TransactionFormData,
  ) => void | Promise<void>;

  onEdit?: (
    transactionId: number,
    transaction: TransactionFormData,
  ) => void | Promise<void>;

  transaction?: Transaction | null;

  categories: Category[];
  members: FamilyMember[];

  actionError?: string;
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
  onEdit,
  transaction,
  categories,
  members,
  actionError,
}: AddTransactionModalProps) {
  const isEditMode = Boolean(transaction);

  const [title, setTitle] = useState(
    transaction?.title ?? "",
  );

  const [amount, setAmount] = useState(
    transaction
      ? String(transaction.amount)
      : "",
  );

  const [category, setCategory] = useState(
    transaction
      ? String(transaction.categoryId)
      : "",
  );

  const [type, setType] =
    useState<TransactionType>(
      transaction?.type ?? "expense",
    );

  const [member, setMember] = useState(
    transaction
      ? String(transaction.memberId)
      : "",
  );

  const [date, setDate] = useState(
    transaction?.date ?? getTodayDate(),
  );

  const [error, setError] = useState("");

  const filteredCategories =
    categories.filter(
      (item) => item.type === type,
    );

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(String(transaction.amount));
      setCategory(String(transaction.categoryId));
      setType(transaction.type);
      setMember(String(transaction.memberId));
      setDate(transaction.date);
    } else {
      setTitle("");
      setAmount("");
      setCategory("");
      setType("expense");
      setMember("");
      setDate(getTodayDate());
    }

    setError("");
  }, [transaction]);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!title.trim()) {
      setError(
        "Please enter a transaction title.",
      );
      return;
    }

    if (!amount || numericAmount <= 0) {
      setError(
        "Please enter a valid amount.",
      );
      return;
    }

    if (!category) {
      setError(
        "Please select a category.",
      );
      return;
    }

    if (!member) {
      setError(
        "Please select a family member.",
      );
      return;
    }

    const transactionData = {
      title: title.trim(),
      amount: numericAmount,
      categoryId: Number(category),
      type,
      memberId: Number(member),
      date,
    };

    if (isEditMode && transaction && onEdit) {
      onEdit(
        transaction.id,
        transactionData,
      );
    } else {
      onAdd(transactionData);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-[#2a234f]/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          modal-enter
          w-full max-w-lg
          overflow-visible
          rounded-2xl
          border border-[#e8e5ef]
          bg-white
          shadow-2xl
          shadow-[#2a234f]/20
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e8e5ef] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#2a234f]">
              {isEditMode
                ? "Edit transaction"
                : "Add transaction"}
            </h2>

            <p className="mt-1 text-xs text-[#77738a]">
              {isEditMode
                ? "Update the details of this transaction."
                : "Add an income or expense for your family."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl p-2
              text-[#9a96a8]
              transition-all duration-200
              hover:bg-[#f8f7fb]
              hover:text-[#2a234f]
              active:scale-95
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6"
        >
          {(error || actionError) && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {actionError || error}
            </div>
          )}

          {/* Type */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold text-[#77738a]">
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
                  rounded-xl border px-4 py-3
                  text-sm font-semibold
                  transition-all duration-200

                  ${
                    type === "expense"
                      ? "border-rose-300 bg-rose-50 text-rose-600 shadow-sm"
                      : "border-[#e8e5ef] bg-[#f8f7fb] text-[#77738a] hover:bg-white hover:text-[#2a234f]"
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
                  rounded-xl border px-4 py-3
                  text-sm font-semibold
                  transition-all duration-200

                  ${
                    type === "income"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-sm"
                      : "border-[#e8e5ef] bg-[#f8f7fb] text-[#77738a] hover:bg-white hover:text-[#2a234f]"
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
              className="mb-2 block text-xs font-semibold text-[#77738a]"
            >
              Amount
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#9a96a8]">
                ₹
              </span>

              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value,
                  )
                }
                placeholder="0.00"
                className="
                  h-12 w-full
                  rounded-xl
                  border border-[#e8e5ef]
                  bg-[#f8f7fb]
                  pl-10 pr-4
                  text-lg font-semibold
                  text-[#2a234f]
                  outline-none
                  transition-all duration-200
                  placeholder:text-[#b5b1bf]
                  focus:border-[#ffb3c3]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#ffb3c3]/20
                "
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label
              htmlFor="title"
              className="mb-2 block text-xs font-semibold text-[#77738a]"
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
                h-11 w-full
                rounded-xl
                border border-[#e8e5ef]
                bg-[#f8f7fb]
                px-4
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

          {/* Category + Member */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[#77738a]">
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
                  ...filteredCategories.map(
                    (item) => ({
                      value: String(item.id),
                      label: item.name,
                    }),
                  ),
                ]}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-[#77738a]">
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
                  ...members.map(
                    (item) => ({
                      value: String(item.id),
                      label: item.name,
                    }),
                  ),
                ]}
              />
            </div>
          </div>

          {/* Date */}
          <div className="mb-6">
            <label
              htmlFor="date"
              className="mb-2 block text-xs font-semibold text-[#77738a]"
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
                h-11 w-full
                rounded-xl
                border border-[#e8e5ef]
                bg-[#f8f7fb]
                px-4
                text-sm text-[#77738a]
                outline-none
                transition-all duration-200
                focus:border-[#ffb3c3]
                focus:bg-white
                focus:ring-4
                focus:ring-[#ffb3c3]/20
              "
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                border border-[#e8e5ef]
                px-5 py-3
                text-sm font-semibold
                text-[#77738a]
                transition-all duration-200
                hover:bg-[#f8f7fb]
                hover:text-[#2a234f]
                active:scale-[0.98]
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                rounded-xl
                bg-[#2a234f]
                px-5 py-3
                text-sm font-semibold
                text-white
                shadow-lg
                shadow-[#2a234f]/15
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-[#1f1a3b]
                hover:shadow-xl
                hover:shadow-[#2a234f]/20
                active:translate-y-0
                active:scale-[0.98]
              "
            >
              {isEditMode
                ? "Save changes"
                : "Add transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;