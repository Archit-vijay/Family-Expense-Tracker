import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SpendingData } from "../types/analytics";

const spendingData: SpendingData[] = [
  { date: "Aug 15", amount: 4200 },
  { date: "Aug 16", amount: 5800 },
  { date: "Aug 17", amount: 3900 },
  { date: "Aug 18", amount: 7200 },
  { date: "Aug 19", amount: 5100 },
  { date: "Aug 20", amount: 6800 },
  { date: "Aug 21", amount: 8200 },
];

function SpendingOverview() {
  return (
    <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2a234f]">
            Spending Overview
          </p>

          <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
            Daily spending for this month
          </p>
        </div>

        <button
          type="button"
          className="
            rounded-lg px-3 py-2
            text-xs font-semibold text-[#77738a]
            transition-all duration-200
            hover:bg-[#f8f7fb]
            hover:text-[#2a234f]
          "
        >
          This week
        </button>
      </div>

      {/* Total */}
      <div className="mb-5">
        <p className="text-2xl font-bold tracking-tight text-[#2a234f]">
          ₹41,200
        </p>

        <p className="mt-1 text-xs font-medium text-emerald-600">
          ↓ 8.4% compared to last month
        </p>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={spendingData}
            margin={{
              top: 10,
              right: 5,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="spendingGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#2a234f"
                  stopOpacity={0.3}
                />

                <stop
                  offset="100%"
                  stopColor="#2a234f"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e8e5ef"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9a96a8",
                fontSize: 11,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9a96a8",
                fontSize: 11,
              }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />

            <Tooltip
              cursor={{
                stroke: "#ffb3c3",
                strokeWidth: 1,
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e8e5ef",
                boxShadow:
                  "0 10px 30px rgba(42, 35, 79, 0.1)",
              }}
              formatter={(value) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Spent",
              ]}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#2a234f"
              strokeWidth={3}
              fill="url(#spendingGradient)"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SpendingOverview;
