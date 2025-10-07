import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface ProjectionChartProps {
  currentRent: number;
  growthRate: number;
}

export const ProjectionChart = ({ currentRent, growthRate }: ProjectionChartProps) => {
  const generateProjections = () => {
    const data = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i <= 10; i++) {
      const projectedRent = currentRent * Math.pow(1 + growthRate / 100, i);
      data.push({
        year: currentYear + i,
        rent: Math.round(projectedRent),
      });
    }
    
    return data;
  };

  const data = generateProjections();

  return (
    <Card className="p-6 rounded-xl shadow-sm border-border">
      <div className="h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="year" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Projected Rent"]}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Line
              type="monotone"
              dataKey="rent"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
