import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  amount: string;
  description: string;
  icon: LucideIcon;
  variant?: "income" | "expense" | "savings" | "balance";
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
  const styles = {
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
  };

  const currentStyle = styles[variant];

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

          <p className="stat-card-amount">
            {amount}
          </p>

          <p className="stat-card-description">
            {description}
          </p>
        </div>

        <div className={`stat-card-icon shrink-0 ml-3 ${currentStyle.icon}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
