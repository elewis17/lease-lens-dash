import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Scenario = "conservative" | "base" | "optimistic";

interface ScenarioToggleProps {
  scenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}

export const ScenarioToggle = ({ scenario, onScenarioChange }: ScenarioToggleProps) => {
  const scenarios: Array<{ value: Scenario; label: string }> = [
    { value: "conservative", label: "Conservative" },
    { value: "base", label: "Base" },
    { value: "optimistic", label: "Optimistic" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Scenario:</span>
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {scenarios.map((s) => (
          <Button
            key={s.value}
            variant="ghost"
            size="sm"
            onClick={() => onScenarioChange(s.value)}
            className={cn(
              "px-3 py-1 text-xs font-medium transition-all",
              scenario === s.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
