import { useState } from "react";
import { money } from "@/domain/finance/format";
import type { PortfolioMetrics } from "@/domain/finance/portfolio";
import { cn } from "@/lib/utils";
import { Disclosure } from "@/components/ui/disclosure";

export function RentWaterfall({ metrics }: { metrics: PortfolioMetrics }) {
  const [selected, setSelected] = useState(0);
  const { expectedRent, effectiveRent, opex, noi, debtService, cashFlow } = metrics;
  const stages = [
    { title: "Contractual rent", value: expectedRent, before: 0, after: expectedRent, basis: "Contractual · Monthly rent from active signed leases." },
    { title: "Vacancy", value: effectiveRent === null || expectedRent === null ? null : effectiveRent - expectedRent,
      before: expectedRent, after: effectiveRent, basis: "Estimate · Contractual rent adjusted using recorded vacancy assumptions." },
    { title: "Operating costs", value: opex === null ? null : -opex, before: effectiveRent, after: noi,
      basis: "Estimate · Monthly operating costs use recorded expenses and stated assumptions." },
    { title: "Debt service", value: debtService === null ? null : -debtService, before: noi, after: cashFlow,
      basis: "Scheduled rental principal and interest · May use an estimated split from escrow." },
    { title: "Cash flow", value: cashFlow, before: 0, after: cashFlow,
      basis: "Estimate · Monthly net operating income less scheduled rental principal and interest." },
  ];
  const points = stages.flatMap(stage => [stage.before ?? 0, stage.after ?? 0]);
  const low = Math.min(0, ...points);
  const scale = Math.max(1, ...points) - low;
  const active = stages[selected];

  return (
    <div className="space-y-3">
      <div aria-label="Monthly rent waterfall" className="grid grid-cols-5 items-stretch gap-1 sm:gap-3">
        {stages.map((stage, index) => {
          const { before, after } = stage;
          return (
            <button type="button" key={stage.title} aria-pressed={selected === index} onClick={() => setSelected(index)}
              aria-label={stage.title + " " + money(stage.value) + " per month"}
              className={cn("grid min-w-0 grid-rows-[auto_5.5rem_1fr] gap-1 rounded-sm p-1 text-center focus-visible:outline-2 focus-visible:outline-ring sm:px-2",
                selected === index && "bg-muted")}>
              <span className="text-xs font-semibold tabular-nums">{money(stage.value)}</span>
              <span className="relative block border-b border-border" aria-hidden="true">
                {before !== null && after !== null && <span className={cn("absolute inset-x-1 rounded-sm sm:inset-x-2",
                  index === 0 ? "bg-foreground" : index === 4 ? after < 0 ? "bg-destructive" : "bg-brand" : "bg-muted-foreground/65")}
                  style={{ bottom: ((Math.min(before, after) - low) / scale) * 100 + "%",
                    height: "max(2px, " + (Math.abs(after - before) / scale) * 100 + "%)" }} />}
              </span>
              <span className="text-xs leading-tight text-muted-foreground">{stage.title}</span>
            </button>
          );
        })}
      </div>
      <input type="range" className="h-8 w-full accent-[hsl(var(--ring))]" min={0} max={stages.length - 1} step={1}
        aria-label="Inspect a rent waterfall step" aria-valuetext={active.title} value={selected}
        onChange={event => setSelected(Number(event.target.value))} />
      <p className="text-sm" aria-live="polite">
        <span className="font-medium">{active.title} · {money(active.value)}/mo</span>
        {active.value === null && <span className="block text-xs text-muted-foreground">Required source missing.</span>}
      </p>
      <Disclosure label="Calculation basis">
        <p>{active.basis}</p>
        <p>Annualized rental cash flow · {money(metrics.annualizedCashFlow)}</p>
      </Disclosure>
    </div>
  );
}
