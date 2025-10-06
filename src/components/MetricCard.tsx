import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning";
}

export const MetricCard = ({ title, value, subtitle, icon: Icon, variant = "default" }: MetricCardProps) => {
  const gradientClass = {
    default: "bg-metric-gradient",
    success: "bg-success-gradient",
    warning: "bg-warning-gradient",
  }[variant];

  return (
    <Card className={`p-6 ${gradientClass} border-border transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-background/50 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
};
