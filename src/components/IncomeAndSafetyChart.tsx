import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";

interface IncomeAndSafetyChartProps {
  currentRent: number;
  rentGrowthRate: number;
  noi: number;
  opex: number;
  opexInflationRate: number;
  debtService: number;
}

export const IncomeAndSafetyChart = ({
  currentRent,
  rentGrowthRate,
  noi,
  opex,
  opexInflationRate,
  debtService,
}: IncomeAndSafetyChartProps) => {
  // Build 10-year projection dataset
  const data = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;

    const revenue = currentRent * 12 * Math.pow(1 + rentGrowthRate / 100, i);
    const opexTotal = opex * 12 * Math.pow(1 + opexInflationRate / 100, i);
    const totalExpenses = opexTotal + debtService * 12;
    const freeCashFlow = revenue - totalExpenses;
    const marginPct = (freeCashFlow / totalExpenses) * 100;

    return { year, revenue, totalExpenses, freeCashFlow, marginPct };
  });

  // Interpret safety guidance from last-year margin
  const lastMargin = data[data.length - 1].marginPct;
  let guidance = "⚠ Retain cash; high risk (<15% margin)";
  if (lastMargin >= 30) guidance = "✓ Safe to refinance (≥30% margin)";
  else if (lastMargin >= 20) guidance = "✓ Safe to distribute profits (20–30% margin)";
  else if (lastMargin >= 15) guidance = "⚠ Moderate risk (15–20% margin)";

  return (
    <Card className="p-5 rounded-xl shadow-sm border-border">
      <div className="h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 25, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />

            <XAxis
              dataKey="year"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
                fontSize: "14px",
                padding: "8px 12px",
              }}
              formatter={(v, name) => [
                `$${v.toLocaleString()}`,
                name === "revenue"
                  ? "Revenue"
                  : name === "totalExpenses"
                  ? "Total Expenses"
                  : "Free Cash Flow",
              ]}
              labelFormatter={(label) => `Year ${label}`}
            />

            <Legend verticalAlign="top" height={36} iconType="circle" />

            {/* Break-even baseline */}
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />

            {/* Revenue (Rent) */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Revenue"
            />

            {/* Total Expenses */}
            <Line
              type="monotone"
              dataKey="totalExpenses"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Total Expenses"
            />

            {/* Free Cash Flow */}
            <Line
              type="monotone"
              dataKey="freeCashFlow"
              stroke="#16a34a"
              strokeWidth={3}
              dot={false}
              name="Free Cash Flow"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">{guidance}</p>
    </Card>
  );
};
