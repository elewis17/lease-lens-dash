import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
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
  debtService 
}: IncomeAndSafetyChartProps) => {
  const generateProjections = () => {
    const data = [];
    const inflationRate = 2.5; // Standard inflation rate
    
    for (let month = 0; month <= 120; month++) {
      const years = month / 12;
      
      const projectedRent = currentRent * Math.pow(1 + rentGrowthRate / 100, years);
      const projectedOpex = opex * Math.pow(1 + opexInflationRate / 100, years);
      const projectedNOI = projectedRent - projectedOpex;
      const cashFlowAfterDebt = projectedNOI - debtService;
      const breakEvenRent = projectedOpex + debtService;
      const inflationBenchmark = currentRent * Math.pow(1 + inflationRate / 100, years);
      
      data.push({
        month,
        rent: Math.round(projectedRent),
        opex: Math.round(projectedOpex),
        noi: Math.round(projectedNOI),
        debtService: Math.round(debtService),
        cashFlow: Math.round(cashFlowAfterDebt),
        breakEven: Math.round(breakEvenRent),
        inflation: Math.round(inflationBenchmark),
      });
    }
    
    return data;
  };

  const data = generateProjections();
  
  const margin = data[data.length - 1].cashFlow / data[data.length - 1].debtService;
  
  let safetyGuidance = "";
  if (margin > 1.5) {
    safetyGuidance = "✓ Safe to refinance (>50% margin)";
  } else if (margin > 1.2) {
    safetyGuidance = "✓ Safe to distribute profits (20-50% margin)";
  } else {
    safetyGuidance = "⚠ Retain cash; low margin (<20%)";
  }

  return (
    <Card className="p-6 rounded-xl shadow-sm border-border">
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground">{safetyGuidance}</p>
      </div>
      <div className="h-[400px] sm:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: "Months", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              label={{ value: "Monthly Dollars", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              labelFormatter={(label) => `Month ${label}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="rent"
              name="Projected Rent"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="opex"
              name="Operating Expenses"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="noi"
              name="NOI (ex-debt)"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="debtService"
              name="Monthly Debt Service"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cashFlow"
              name="Cash Flow After Debt"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="breakEven"
              name="Break-even Rent"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="inflation"
              name="Inflation Benchmark"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              opacity={0.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
