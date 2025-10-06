import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const mockData = [
  { month: "Jan", expected: 4200, collected: 4200 },
  { month: "Feb", expected: 4200, collected: 4200 },
  { month: "Mar", expected: 4200, collected: 2200 },
  { month: "Apr", expected: 4200, collected: 4200 },
  { month: "May", expected: 4200, collected: 4200 },
  { month: "Jun", expected: 4200, collected: 4200 },
  { month: "Jul", expected: 4200, collected: 4200 },
  { month: "Aug", expected: 4200, collected: 4200 },
  { month: "Sep", expected: 4200, collected: 4200 },
  { month: "Oct", expected: 4200, collected: 4200 },
  { month: "Nov", expected: 4200, collected: 4200 },
  { month: "Dec", expected: 4200, collected: 2200 },
];

export const RevenueChart = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 12 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem"
            }} 
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="expected" 
            stroke="hsl(var(--muted-foreground))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Expected"
          />
          <Line 
            type="monotone" 
            dataKey="collected" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Collected"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
