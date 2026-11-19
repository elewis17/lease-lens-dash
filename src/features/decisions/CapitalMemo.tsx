import { Card } from "@/components/ui/card";
import { money, ratio } from "@/domain/finance/format";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { CapitalLifecycle } from "./CapitalLifecycle";
import { capitalHistory, lifecycle, type CapitalEntry, type Entry } from "./entries";

export function CapitalMemo({ entry }: { entry: Entry & { payload: CapitalEntry } }) {
  const { entries } = useWorkspace();
  const { payload } = entry;
  const history = capitalHistory(entries.entries, payload.opportunityId);
  const latest = history.at(0)?.payload ?? payload;
  const projection = payload.projection;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Decision memo · {new Date(entry.created_at).toLocaleDateString()}</p>
        <h1 className="text-3xl font-semibold">{payload.title}</h1>
      </div>
      <Card className="space-y-4 p-4">
        <h2 className="text-xl font-semibold">Why</h2>
        <p className="whitespace-pre-wrap break-words">{payload.notes}</p>
        {payload.evidenceUrl && <a className="text-sm underline" href={payload.evidenceUrl} target="_blank" rel="noreferrer">Open decision evidence</a>}
        <dl className="grid grid-cols-2 gap-4 text-sm tabular-nums">
          {[
            ["Projected annualized cash change before costs", money(projection.annualCashChange)],
            ["Actual annual cash change", money(latest.actualAnnualCashChange)],
            ["Upfront cost", money(projection.initialCost)],
            ["10-year cash change after costs", money(projection.tenYearCashChange)],
            ["10-year incremental real estate net worth", money(projection.tenYearWealthChange)],
            ["Change in DSCR", ratio(projection.coverageChange)],
          ].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">Frozen assumptions</h2>
        {projection.annualCashChange !== null
          ? <p className="text-sm italic">Hypothetical · If refinanced at {projection.quote.rate}% over {projection.quote.years} years with {projection.quote.cost}% upfront costs.</p>
          : <p className="text-sm text-muted-foreground">The decision record had insufficient evidence for a modeled cash impact.</p>}
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">Lifecycle</h2>
        <ol className="space-y-3">
          {lifecycle.map(status => {
            const event = history.find(item => item.payload.status === status);
            return <li key={status} className="text-sm">
              <span className="font-medium capitalize">{status}</span>
              {event ? <p className="text-muted-foreground">{new Date(event.created_at).toLocaleDateString()} · {event.payload.notes}</p>
                : status !== "identified" && <p className="text-muted-foreground">Pending</p>}
            </li>;
          })}
        </ol>
        <div className="print:hidden"><CapitalLifecycle current={latest} /></div>
      </Card>
    </div>
  );
}
