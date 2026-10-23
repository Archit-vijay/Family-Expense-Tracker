import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  amount: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  variant?: "income" | "expense" | "savings" | "balance" | "subscription" | "amber";
  badge?: ReactNode;
}

function StatCard({
  title,
  amount,
  description,
  icon: Icon,
  variant = "balance",
  badge,
}: StatCardProps) {
  const styles: Record<string, { icon: string; glow: string }> = {
    income: {
      icon: "stat-icon-income",
      glow: "stat-glow-income",
    },
    expense: {
      icon: "stat-icon-expense",
      glow: "stat-glow-expense",
    },
    balance: {
      icon: "stat-icon-balance",
      glow: "stat-glow-balance",
    },
    savings: {
      icon: "stat-icon-balance",
      glow: "stat-glow-balance",
    },
    subscription: {
      icon: "stat-icon-subscription",
      glow: "stat-glow-balance",
    },
    amber: {
      icon: "stat-icon-amber",
      glow: "stat-glow-balance",
    },
  };

  const currentStyle = styles[variant] || styles.balance;

  return (
    <div className={`stat-card ${currentStyle.glow}`}>
      {/* Top accent */}
      <div className="stat-card-accent" />

      {/* Background glow */}
      <div className="stat-card-glow" />

      <div className="stat-card-content">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="stat-card-title truncate">
              {title}
            </p>
            {badge}
          </div>

          <div className="stat-card-amount">
            {amount}
          </div>

          <div className="stat-card-description">
            {description}
          </div>
        </div>

        <div className={`stat-card-icon shrink-0 ml-3 ${currentStyle.icon}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
