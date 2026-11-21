import { useRef } from "react";
import { Link, Outlet } from "react-router-dom";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { modelDeal } from "@/domain/finance/underwriting";
import { money, ratio } from "@/domain/finance/format";
import { capitalHistory } from "@/features/decisions/entries";

export default function DecisionLog() {
  const workspace = useWorkspace();
  const { pathTo, dealAssumptions, entries, properties } = workspace;
  const memoTriggerRef = useRef<HTMLAnchorElement | null>(null);
  const memoContext = { ...workspace, memoTriggerRef };
  const hasDraft = !!dealAssumptions && modelDeal(dealAssumptions) !== null;
  if (entries.isPending) return <section role="status" aria-label="Loading decisions" className="space-y-4">
    <Skeleton className="h-10 w-3/4" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /><Outlet context={memoContext} />
  </section>;

  const decisions = entries.entries.flatMap(entry => {
    const { payload } = entry;
    const date = new Date(entry.created_at).toLocaleDateString();
    const shared = { id: entry.id, date };
    if (payload.kind === "acquisition") return [{ ...shared, title: payload.title,
      verdict: payload.action === "pass" ? payload.projection.verdict === "Do not pursue" ? "Do not pursue" : "Declined" : "Offer recorded",
      figure: payload.projection.maxOffer === null ? "Max offer needs evidence" : `Max offer · ${money(payload.projection.maxOffer)} estimate`,
      stage: "Decided", projected: `${money(payload.projection.cashFlow)}/mo cash flow estimate`, actual: "Pending", pending: true }];
    if (payload.kind === "policy") return [{ ...shared, title: payload.target, verdict: `${payload.strategy} thresholds recorded`,
      figure: `Buy DSCR floor · ${ratio(payload.policy.buy.minimumDscr)}`, stage: "Completed",
      projected: "Applies to future verdicts", actual: "Policy recorded", pending: false }];
    if (payload.kind !== "capital" || payload.status !== "decided") return [];
    const latest = capitalHistory(entries.entries, payload.opportunityId)[0]?.payload ?? payload;
    return [{ ...shared, title: properties.find(property => property.id === payload.propertyId)?.alias ?? payload.title,
      verdict: payload.title, figure: payload.projection.initialCost === null ? "Cost requires evidence" : `Estimated cost · ${money(payload.projection.initialCost)}`,
      stage: latest.status, projected: payload.projection.annualCashChange === null ? "Cash impact needs evidence"
        : `${money(payload.projection.annualCashChange)}/yr before costs · Estimate`,
      actual: latest.actualAnnualCashChange === null ? "Pending" : `${money(latest.actualAnnualCashChange)}/yr recorded`,
      pending: latest.actualAnnualCashChange === null }];
  });
  const pending = decisions.filter(entry => entry.pending).length;
  const headline = entries.isError ? "Decision history could not load."
    : !entries.available ? "Connect the decision record to see your history."
    : !decisions.length ? "No decisions have been recorded."
    : `${decisions.length} ${decisions.length === 1 ? "decision" : "decisions"} recorded. ${pending ? `${pending} ${pending === 1 ? "outcome" : "outcomes"} pending.` : "Outcomes are up to date."}`;

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="view-title">{headline}</h1>
        {decisions[0] && <p className="text-sm text-muted-foreground">Latest · {decisions[0].title} · {decisions[0].verdict}</p>}
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        {decisions.length > 0 && <ul className="divide-y border-y">
          {decisions.map(entry => <li key={entry.id} className="space-y-2 py-4">
            <Link className="font-semibold underline underline-offset-4" to={pathTo("/decisions/" + entry.id + "/memo")} onClick={event => { memoTriggerRef.current = event.currentTarget; }}>{entry.title}</Link>
            <p className="text-sm">{entry.verdict} · {entry.figure}</p>
            <p className="text-xs capitalize text-muted-foreground">{entry.date} · {entry.stage}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Projected</dt><dd>{entry.projected}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Actual</dt><dd>{entry.actual}</dd></div>
            </dl>
          </li>)}
        </ul>}
        <aside className="lg:border-l lg:pl-6">
          <Link className={buttonVariants({ variant: "outline" })} to={pathTo(hasDraft ? "/decisions/draft/memo" : "/underwrite")} onClick={event => { memoTriggerRef.current = event.currentTarget; }}>
            {hasDraft ? "Open draft memo" : "Open Underwrite"}
          </Link>
        </aside>
      </div>
      <Outlet context={memoContext} />
    </section>
  );
}
