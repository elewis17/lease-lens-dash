import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, LineChart } from "lucide-react";

interface ROISummaryCardProps {
  roi: number;
  capRate: number;
  cashOnCash: number;
  irr10Year: number;
}

export const ROISummaryCard = ({ roi, capRate, cashOnCash, irr10Year }: ROISummaryCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-success/5 border-border rounded-xl shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Investment Performance</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-success" />
              <p className="text-xs text-muted-foreground">ROI</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{roi.toFixed(1)}%</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">Cap Rate</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{capRate.toFixed(2)}%</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <p className="text-xs text-muted-foreground">Cash-on-Cash</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{cashOnCash.toFixed(2)}%</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">10-Year IRR</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{irr10Year.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
