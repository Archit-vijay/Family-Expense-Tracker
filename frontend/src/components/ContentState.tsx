import type { ReactNode } from "react";

import {
  CircleAlert,
  Inbox,
  Loader2,
} from "lucide-react";

type ContentStateVariant = "loading" | "empty" | "error";

interface ContentStateProps {
  variant: ContentStateVariant;
  title: string;
  description?: string;
  action?: ReactNode;
}

const stateIcons = {
  loading: Loader2,
  empty: Inbox,
  error: CircleAlert,
};

const stateIconClasses = {
  loading: "bg-[#ffb3c3]/20 text-[#2a234f] dark:bg-[#ffb3c3]/15 dark:text-[#ffb3c3]",
  empty: "bg-[#ffb3c3]/20 text-[#2a234f] dark:bg-[#ffb3c3]/15 dark:text-[#ffb3c3]",
  error: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
};

function ContentState({
  variant,
  title,
  description,
  action,
}: ContentStateProps) {
  const Icon = stateIcons[variant];

  return (
    <div
      className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e5ef] bg-[#f8f7fb] px-6 py-10 text-center transition-colors dark:border-[#2e265c] dark:bg-[#161130]"
      role={variant === "error" ? "alert" : undefined}
      aria-live={variant === "loading" ? "polite" : undefined}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${stateIconClasses[variant]}`}
      >
        <Icon
          size={22}
          className={variant === "loading" ? "animate-spin" : undefined}
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#2a234f] dark:text-[#f5f3fa]">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm leading-6 text-[#77738a] dark:text-[#a09cb4]">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default ContentState;
