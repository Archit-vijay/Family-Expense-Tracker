import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData } from "../types/dashboard";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function SpendingOverview({ trend }: Pick<DashboardData, "trend">) {
  const shouldGroupByMonth = trend.length > 31;

  const chartData = shouldGroupByMonth
    ? Object.values(
        trend.reduce(
          (acc, point) => {
            const date = new Date(`${point.date}T00:00:00`);
            const key = `${date.getFullYear()}-${date.getMonth()}`;

            if (!acc[key]) {
              acc[key] = {
                label: date.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                }),
                income: 0,
                expenses: 0,
              };
            }

            acc[key].income += point.income;
            acc[key].expenses += point.expenses;

            return acc;
          },
          {} as Record<
            string,
            {
              label: string;
              income: number;
              expenses: number;
            }
          >
        )
      )
    : trend.map((point) => ({
        ...point,
        label: new Date(`${point.date}T00:00:00`).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
          }
        ),
      }));

  return (
    <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#2a234f]">
          Income vs Expenses
        </p>

        <p className="mt-1 text-xs text-[#77738a] sm:text-sm">
          {shouldGroupByMonth
            ? "Monthly family money flow for this period"
            : "Daily family money flow for this period"}
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-[#f8f7fb] px-6 text-center text-sm text-[#77738a]">
          Income and expense activity will appear here once this period has
          transactions.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e8e5ef"
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9a96a8", fontSize: 11 }}
                interval={shouldGroupByMonth ? 0 : "preserveStartEnd"}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9a96a8", fontSize: 11 }}
                tickFormatter={(value) =>
                  value >= 1000 ? `₹${value / 1000}k` : `₹${value}`
                }
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e8e5ef",
                  boxShadow: "0 10px 30px rgba(42, 35, 79, 0.1)",
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />

              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  color: "#77738a",
                }}
              />

              <Bar
                dataKey="income"
                name="Income"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                animationDuration={900}
              />

              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#e11d48"
                radius={[4, 4, 0, 0]}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SpendingOverview;