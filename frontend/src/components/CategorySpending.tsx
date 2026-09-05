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
  "#2a234f",
  "#ffb3c3",
  "#14b8a6",
  "#f59e0b",
  "#9a96a8",
];

function CategorySpending() {
  return (
    <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#2a234f]">
          Spending by Category
        </p>

        <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
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
                border: "1px solid #e8e5ef",
                boxShadow:
                  "0 10px 30px rgba(42, 35, 79, 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-[#2a234f]">
            ₹41.2k
          </p>

          <p className="text-[11px] text-[#9a96a8]">
            Total spent
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-4 space-y-3">
        {categoryData.map((item, index) => (
          <div
            key={item.category}
            className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-[#f8f7fb]"
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

              <span className="text-xs font-medium text-[#77738a]">
                {item.category}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#2a234f]">
                ₹{item.amount.toLocaleString("en-IN")}
              </span>

              <span className="w-8 text-right text-xs text-[#9a96a8]">
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
