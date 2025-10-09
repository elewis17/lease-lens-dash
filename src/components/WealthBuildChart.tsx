import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface WealthBuildChartProps {
  noi: number;
  capRate: number;
  mortgages: Array<{
    principal: number;
    interest_rate: number;
    term_months: number;
    start_date: Date;
  }>;
}

export const WealthBuildChart = ({ noi, capRate, mortgages }: WealthBuildChartProps) => {
  const calculateLoanBalance = (
    principal: number,
    interestRate: number,
    termMonths: number,
    monthsPaid: number
  ) => {
    if (monthsPaid >= termMonths) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    let balance = principal;
    for (let i = 0; i < monthsPaid; i++) {
      const interest = balance * monthlyRate;
      const principalPaid = monthlyPayment - interest;
      balance -= principalPaid;
    }
    
    return Math.max(0, balance);
  };

  const generateProjections = () => {
    const data = [];
    const monthlyNOI = noi;
    const annualNOI = monthlyNOI * 12;
    
    for (let year = 1; year <= 10; year++) {
      // Project property value based on NOI and cap rate
      const projectedNOI = annualNOI * Math.pow(1.03, year - 1); // Assume 3% NOI growth
      const propertyValue = capRate > 0 ? projectedNOI / (capRate / 100) : 0;
      
      // Calculate total loan balance across all mortgages
      let totalLoanBalance = 0;
      const monthsPassed = year * 12;
      mortgages.forEach(mortgage => {
        totalLoanBalance += calculateLoanBalance(
          mortgage.principal,
          mortgage.interest_rate,
          mortgage.term_months,
          monthsPassed
        );
      });
      
      const equity = propertyValue - totalLoanBalance;
      
      data.push({
        year,
        propertyValue: Math.round(propertyValue / 1000), // Convert to thousands
        loanBalance: Math.round(totalLoanBalance / 1000),
        equity: Math.round(equity / 1000),
      });
    }
    
    return data;
  };

  const data = generateProjections();

  return (
    <Card className="p-6 rounded-xl shadow-sm border-border">
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
              tickFormatter={(value) => `$${value}k`}
              label={{ value: "Thousands ($)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
              formatter={(value: number) => [`$${value}k`, ""]}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="propertyValue"
              name="Projected Property Value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="loanBalance"
              name="Loan Balance"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="equity"
              name="Equity"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
