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
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">10-Year Rent Projection</h3>
          <div className="text-sm text-muted-foreground">
            Growth Rate: <span className="font-medium text-foreground">{growthRate}%/year</span>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="year" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Projected Rent"]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Line
                type="monotone"
                dataKey="rent"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
