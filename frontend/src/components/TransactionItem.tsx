import { useEffect, useRef, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  MoreVertical,
  Trash2,
} from "lucide-react";

import type { Transaction } from "../types/Transaction";

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onRemove?: (transaction: Transaction) => void;
}

function TransactionItem({
  transaction,
  onEdit,
  onRemove,
}: TransactionItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isIncome = transaction.type === "income";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [isMenuOpen]);

  function handleEdit() {
    setIsMenuOpen(false);
    onEdit?.(transaction);
  }

  function handleRemove() {
    setIsMenuOpen(false);
    onRemove?.(transaction);
  }

  return (
    <div
      className={`
        transaction-item
        group
        relative
        flex items-center gap-3
        border-b border-[#e8e5ef]
        py-4
        last:border-b-0
        sm:gap-4

        ${
          isMenuOpen
            ? "z-30"
            : "z-0"
        }
      `}
    >
      {/* Transaction icon */}
      <div
        className={`
          transaction-icon
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-xl
          ${
            isIncome
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }
        `}
      >
        {isIncome ? (
          <ArrowDownLeft size={18} />
        ) : (
          <ArrowUpRight size={18} />
        )}
      </div>

      {/* Transaction information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#2a234f]">
          {transaction.title}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-md bg-[#f8f7fb] px-2 py-0.5 text-[11px] font-medium text-[#77738a]">
            {transaction.category}
          </span>

          <span className="hidden text-xs text-[#9a96a8] sm:inline">
            {transaction.member} • {transaction.date}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p
          className={`
            text-sm font-bold
            ${
              isIncome
                ? "text-emerald-600"
                : "text-[#2a234f]"
            }
          `}
        >
          {isIncome ? "+" : "-"}₹
          {transaction.amount.toLocaleString(
            "en-IN",
          )}
        </p>

        <p className="mt-1 text-[11px] text-[#9a96a8] sm:hidden">
          {transaction.date}
        </p>
      </div>

      {/* Actions */}
      {(onEdit || onRemove) && (
        <div
          ref={menuRef}
          className="relative shrink-0"
        >
        <button
          type="button"
          aria-label="Transaction actions"
          aria-expanded={isMenuOpen}
          onClick={() =>
            setIsMenuOpen(
              (current) => !current,
            )
          }
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-lg
            text-[#9a96a8]
            transition-all
            duration-200
            hover:bg-[#f8f7fb]
            hover:text-[#2a234f]
            active:scale-95
          "
        >
          <MoreVertical size={18} />
        </button>

        {isMenuOpen && (
          <div
            className="
              menu-enter
              absolute right-0 top-full z-50 mt-2
              w-36
              rounded-xl
              border border-[#e8e5ef]
              bg-white
              p-1.5
              shadow-xl
              shadow-[#2a234f]/10
            "
          >
            {onEdit && (
              <button
              type="button"
              onClick={handleEdit}
              className="
                flex w-full items-center gap-2
                rounded-lg
                px-3 py-2
                text-left text-xs font-medium
                text-[#77738a]
                transition-colors
                hover:bg-[#f8f7fb]
                hover:text-[#2a234f]
              "
            >
              <Edit3 size={15} />
              Edit
            </button>
            )}

            {onRemove && (
              <button
              type="button"
              onClick={handleRemove}
              className="
                flex w-full items-center gap-2
                rounded-lg
                px-3 py-2
                text-left text-xs font-medium
                text-rose-600
                transition-colors
                hover:bg-rose-50
              "
            >
              <Trash2 size={15} />
              Remove
            </button>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
}

export default TransactionItem;
