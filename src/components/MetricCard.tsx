import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string | React.ReactNode;
  value: string;
  subtitle?: string;
   icon?: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
}

export const MetricCard = ({ title, value, subtitle, icon: Icon, variant = "default" }: MetricCardProps) => {
  const gradientClass = {
    default: "bg-metric-gradient",
    success: "bg-success-gradient",
    warning: "bg-warning-gradient",
  }[variant];

  const iconBgClass = {
    default: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
  }[variant];

  const iconColorClass = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
  }[variant];

  return (
    <Card className={`p-6 ${gradientClass} border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground leading-snug">{title}</p>
          <h3 className="text-3xl font-extrabold text-foreground leading-tight">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>}
        </div>
        <div className={`rounded-md ${iconBgClass} p-2 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
      </div>
    </Card>
  );
};
