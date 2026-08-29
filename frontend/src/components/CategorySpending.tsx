import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { Categoryspending } from "../types/analytics";

const categoryData: Categoryspending[] = [
  {
    category: "Food",
    amount: 13200,
    percentage: 32,
  },
  {
    category: "Home",
    amount: 9900,
    percentage: 24,
  },
  {
    category: "Transport",
    amount: 7400,
    percentage: 18,
  },
  {
    category: "Bills",
    amount: 6200,
    percentage: 15,
  },
  {
    category: "Other",
    amount: 4500,
    percentage: 11,
  },
];

const categoryColors = [
  "#8b5cf6",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#94a3b8",
];

function CategorySpending() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">
          Spending by Category
        </p>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Where your money is going
        </p>
      </div>

      {/* Chart */}
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              stroke="none"
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={
                    categoryColors[
                      index % categoryColors.length
                    ]
                  }
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, _name, item) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                item.payload.category,
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-slate-900">
            ₹41.2k
          </p>

          <p className="text-[11px] text-slate-400">
            Total spent
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-4 space-y-3">
        {categoryData.map((item, index) => (
          <div
            key={item.category}
            className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    categoryColors[
                      index % categoryColors.length
                    ],
                }}
              />

              <span className="text-xs font-medium text-slate-600">
                {item.category}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-800">
                ₹{item.amount.toLocaleString("en-IN")}
              </span>

              <span className="w-8 text-right text-xs text-slate-400">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySpending;