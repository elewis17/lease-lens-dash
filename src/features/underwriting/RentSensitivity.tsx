import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { money, percent, ratio } from "@/domain/finance/format";
import { defaultThresholds } from "@/domain/finance/thresholds";
import { modelDeal, type DealAssumptions } from "@/domain/finance/underwriting";
import { cn } from "@/lib/utils";

export function RentSensitivity({ assumptions }: { assumptions: DealAssumptions }) {
  const [selectedCase, setSelectedCase] = useState(0);
  const { rentMonthly, price } = assumptions;
  const increment = Math.max(1, Math.round(rentMonthly * 0.06 / 100) * 100);
  const cases = (rentMonthly === 0 ? [0, 1] : [-1, 0, 1]).map(offset => {
    const rent = Math.max(0, rentMonthly + offset * increment);
    const model = modelDeal({ ...assumptions, rentMonthly: rent });
    return { offset, rent, irr: model?.irr ?? null, dscr: model?.dscr ?? null };
  });
  const activeOffset = rentMonthly === 0 ? Math.max(0, selectedCase) : selectedCase;
  const selected = cases[activeOffset + (rentMonthly === 0 ? 0 : 1)];
  const irrGate = defaultThresholds.buy.minimumIrr;

  return (
    <Card className="min-w-0 space-y-3 p-5 shadow-none lg:col-start-2 lg:row-start-2">
      <h3 className="text-lg font-semibold">Sensitivity · IRR by rent</h3>
      <p className="text-sm italic text-muted-foreground">
        Hypothetical · if bought at {money(price)} with the other assumptions unchanged
      </p>
      {cases.some(point => point.irr !== null) && (
        <div className="h-24 min-w-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cases} margin={{ top: 5, right: 8, bottom: 4, left: 8 }}>
              <YAxis hide domain={([min, max]) => [Math.min(min, irrGate), Math.max(max, irrGate)]} />
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <ReferenceLine y={irrGate} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 4" />
              <Line type="linear" dataKey="irr" stroke="hsl(var(--foreground))" strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--background))" }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div role="group" aria-label="Monthly rent scenarios"
        className="grid auto-cols-fr grid-flow-col gap-px overflow-hidden rounded-lg border bg-border">
        {cases.map(({ offset, rent, irr }) => (
          <button key={offset} type="button" aria-pressed={offset === selected.offset}
            aria-label={`If monthly rent is ${money(rent)}, modelled IRR ${irr === null ? "unavailable" : percent(irr)}`}
            onClick={() => setSelectedCase(offset)}
            className={cn("min-h-11 bg-card px-1 py-2 text-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              offset === selected.offset && "bg-muted")}>
            <span className="block font-medium">{money(rent)}</span>
            <span className={cn("block text-xs italic text-muted-foreground", irr !== null && irr < irrGate && "text-destructive")}>
              {percent(irr)}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm italic text-muted-foreground">
        If monthly rent is {money(selected.rent)}, {selected.dscr === null
          ? "first-year DSCR requires scheduled debt service."
          : `first-year DSCR is ${ratio(selected.dscr)}.`}
        {selected.irr === null && " Modelled IRR is unavailable for this cash-flow projection."}
      </p>
    </Card>
  );
}
