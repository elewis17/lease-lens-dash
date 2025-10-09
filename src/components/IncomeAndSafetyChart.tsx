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
    
    for (let year = 1; year <= 10; year++) {
      const projectedRent = (currentRent * 12) * Math.pow(1 + rentGrowthRate / 100, year - 1);
      const projectedOpex = (opex * 12) * Math.pow(1 + opexInflationRate / 100, year - 1);
      const projectedNOI = projectedRent - projectedOpex;
      const annualDebtService = debtService * 12;
      const cashFlowAfterDebt = projectedNOI - annualDebtService;
      const breakEvenRent = projectedOpex + annualDebtService;
      const inflationBenchmark = (currentRent * 12) * Math.pow(1 + inflationRate / 100, year - 1);
      
      data.push({
        year,
        rent: Math.round(projectedRent),
        opex: Math.round(projectedOpex),
        noi: Math.round(projectedNOI),
        debtService: Math.round(annualDebtService),
        cashFlow: Math.round(cashFlowAfterDebt),
        breakEven: Math.round(breakEvenRent),
        inflation: Math.round(inflationBenchmark),
      });
    }
    
    return data;
  };

  const data = generateProjections();
  
  const lastYear = data[data.length - 1];
  const marginAboveBreakEven = ((lastYear.cashFlow - lastYear.breakEven) / lastYear.breakEven) * 100;
  
  let safetyGuidance = "";
  if (marginAboveBreakEven >= 30) {
    safetyGuidance = "✓ Safe to refinance (≥30% margin above break-even)";
  } else if (marginAboveBreakEven >= 20) {
    safetyGuidance = "✓ Safe to distribute profits (20-30% margin)";
  } else if (marginAboveBreakEven >= 15) {
    safetyGuidance = "⚠ Moderate risk (15-20% margin)";
  } else {
    safetyGuidance = "⚠ Retain cash; high risk (<15% margin)";
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
              dataKey="year" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: "Years", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              label={{ value: "Annual Dollars", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
              labelFormatter={(label) => `Year ${label}`}
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
