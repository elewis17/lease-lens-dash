import { CapitalAllocation } from "./CapitalAllocation";
import { useId } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  capitalHorizonYears, capitalObjectives, capitalOpportunities, netSaleProceeds, rankCapitalOpportunities,
  type CapitalObjective, type CapitalOpportunity, type RefinanceQuote,
} from "@/domain/finance/capital";
import { coverage, money, percent, ratio } from "@/domain/finance/format";
import type { AssetMetrics } from "@/domain/finance/portfolio";
import { CapitalLifecycle } from "@/features/decisions/CapitalLifecycle";
import { capitalHistory } from "@/features/decisions/entries";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { useSessionState } from "@/features/navigation/sessionState";

const horizon = `${capitalHorizonYears}-year`;
const objectiveBasis: Record<CapitalObjective, string> = {
  cash: `${horizon} cash change after upfront costs`,
  wealth: `${horizon} incremental real estate net worth`,
  risk: "Change in debt-service coverage",
};

function Opportunity({ row, objective, quote }: {
  row: CapitalOpportunity;
  objective: CapitalObjective;
  quote: RefinanceQuote;
}) {
  const { action, asset, refinance: model } = row;
  const { entries, userId } = useWorkspace();
  const history = capitalHistory(entries.entries, row.id);
  const latest = history.at(0)?.payload;
  const stage = latest?.status ?? "identified";
  const captured = {
    kind: "capital" as const, status: stage, opportunityId: row.id, title: row.title, propertyId: asset.property.id,
    notes: "", actualAnnualCashChange: null,
    projection: {
      quote, annualCashChange: model?.annualRunRateImpact ?? null, initialCost: model?.closingCosts ?? null,
      tenYearCashChange: model?.cash ?? null, tenYearWealthChange: model?.wealth ?? null, coverageChange: model?.risk ?? null,
    },
  } as const;
  const current = stage === "identified" || stage === "investigating" ? captured : latest ?? captured;
  const score = model?.[objective] ?? null;
  const formatScore = objective === "risk" ? ratio : money;

  return (
    <li className="border-t">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 px-2 py-3 text-left
            transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{row.title}</span>
              <span className="block text-xs capitalize text-muted-foreground">{stage}{(stage === "identified" || stage === "investigating") && " · Needs verification"}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 tabular-nums">
              <span className="text-right">
                <span className="block text-sm font-medium italic">{formatScore(score)}</span>
                <span className="block text-xs text-muted-foreground">{score === null ? "Basis missing" : "Hypothetical"}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" hideClose
          className="mx-auto flex max-h-[min(90dvh,48rem)] max-w-2xl flex-col gap-0 border p-0">
          <header className="space-y-1 border-b px-4 py-4 sm:px-6">
            <SheetTitle>{row.title}</SheetTitle>
            <SheetDescription className="capitalize">{stage}{(stage === "identified" || stage === "investigating") && " · Needs verification"}</SheetDescription>
          </header>
          <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 sm:px-6">
            <section className="space-y-1">
              <h3 className="text-sm font-medium">Evidence</h3>
              {action === "refinance" && (
                <p className="text-sm text-muted-foreground">
                  Estimate · Existing balance {money(asset.debt)}, balance-weighted loan rate {asset.loanRatePct === null ? "—" : percent(asset.loanRatePct / 100)}, and DSCR {coverage(asset)}.
                </p>
              )}
              {action === "vacancy" && asset.occupancy && (
                <p className="text-sm text-muted-foreground">
                  Contractual · Active leases cover {asset.occupancy.occupiedUnits} of {asset.occupancy.totalUnits} recorded units.
                </p>
              )}
              {action === "sale" && (
                <p className="text-sm text-muted-foreground">
                  Estimate · Annualized cash flow {money(asset.cashFlow === null ? null : asset.cashFlow * 12)}, DSCR {coverage(asset)}, property value {money(asset.value)}, and current debt {money(asset.debt)}.
                </p>
              )}
            </section>
            <section className="space-y-1">
              <h3 className="text-sm font-medium">Cost and risk</h3>
              <p className="text-sm text-muted-foreground">{row.risk}</p>
              <p className="text-sm text-muted-foreground">{row.missing}</p>
            </section>
            {action === "sale" && <SaleScenario sessionKey={"dealstack:" + userId + ":sale:" + asset.property.id} />}
            {model ? (
              <section className="space-y-3 italic">
                <p className="text-sm">Hypothetical · If refinanced at {quote.rate}% for {quote.years} years with {quote.cost}% upfront costs</p>
                <dl className="grid grid-cols-2 gap-3 text-sm tabular-nums">
                  <div><dt>Upfront costs</dt><dd className="font-semibold">{money(model.closingCosts)}</dd></div>
                  <div><dt>Annualized cash change before costs</dt><dd className="font-semibold">{money(model.annualRunRateImpact)}</dd></div>
                  <div><dt>First 12 months after costs</dt><dd className="font-semibold">{money(model.firstYearNet)}</dd></div>
                  <div><dt>First-year cash yield before costs</dt><dd className="font-semibold">{percent(model.cashYield)}</dd></div>
                  <div><dt>{horizon} cash change after costs</dt><dd className="font-semibold">{money(model.cash)}</dd></div>
                  <div><dt>{horizon} incremental real estate net worth</dt><dd className="font-semibold">{money(model.wealth)}</dd></div>
                  <div><dt>{horizon} interest saved · Estimate</dt><dd className="font-semibold">{money(model.tenYearInterestSaved)}</dd></div>
                  <div><dt>Change in DSCR</dt><dd className="font-semibold">{ratio(model.risk)}</dd></div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Holds operating income fixed. The net worth change includes cash retained and the difference in remaining loan balances.
                </p>
              </section>
            ) : action !== "sale" && (
              <p className="text-sm text-muted-foreground">
                {action === "refinance"
                  ? "— Enter quote assumptions in Refinance below. The estimate also needs complete loan and operating records."
                  : "— The impact and cost need the information above."}
              </p>
            )}
          </div>
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <CapitalLifecycle current={current} />
            <SheetClose asChild><Button variant="outline" className="min-h-11">Close</Button></SheetClose>
          </footer>
        </SheetContent>
      </Sheet>
    </li>
  );
}

function SaleScenario({ sessionKey }: { sessionKey: string }) {
  const [values, setValues] = useSessionState(sessionKey, { price: "", costs: "", payoff: "" });
  const net = netSaleProceeds(values.price, values.costs, values.payoff);
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">Sale proceeds</h3>
      {([["price", "Sale price ($)"], ["costs", "Selling costs ($)"], ["payoff", "Quoted mortgage payoff ($)"]] as const).map(([key, label]) => (
        <label key={key} className="block space-y-1 text-sm">
          <span>{label}</span>
          <Input type="number" min="0" step="any" value={values[key]} onChange={event => setValues({ ...values, [key]: event.target.value })} />
        </label>
      ))}
      {net === null ? <p className="text-sm text-muted-foreground">— Enter the price, costs, and payoff to calculate net proceeds.</p>
        : <p className="text-sm italic">Hypothetical · If sold on these terms, net proceeds {money(net)}. {net > 0 ? "Available after closing." : "No capital to redeploy from this sale."}</p>}
    </section>
  );
}

export function CapitalOpportunities({ assets, sessionKey, quote }: {
  assets: AssetMetrics[];
  sessionKey: string;
  quote: RefinanceQuote;
}) {
  const groupName = useId();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [savedObjective, setSavedObjective] = useSessionState<CapitalObjective>(`${sessionKey}:objective`, "cash");
  const linkedObjective = new URLSearchParams(search).get("objective");
  const objective = capitalObjectives.find(option => option.id === linkedObjective)?.id
    ?? capitalObjectives.find(option => option.id === savedObjective)?.id ?? "cash";
  const changeObjective = (next: CapitalObjective) => {
    const params = new URLSearchParams(search);
    params.set("objective", next);
    setSavedObjective(next);
    navigate({ pathname, search: params.toString(), hash }, { replace: true, preventScrollReset: true });
  };
  const ranked = rankCapitalOpportunities(capitalOpportunities(assets, quote), objective);

  return (
    <Card className="min-w-0 space-y-4 p-4 sm:p-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Rank by objective</legend>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border sm:w-fit">
          {capitalObjectives.map(({ id, label }) => (
            <label key={id} className="relative">
              <input className="peer sr-only" type="radio" name={groupName} value={id}
                checked={objective === id} onChange={() => changeObjective(id)} />
              <span className="flex min-h-11 cursor-pointer items-center justify-center bg-card px-2 text-sm
                peer-checked:bg-muted peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-ring sm:px-4">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <CapitalAllocation actions={ranked} objective={objective} sessionKey={sessionKey} />
      <p className="text-sm text-muted-foreground">{objectiveBasis[objective]}</p>
      {ranked.length
        ? <ul aria-label="Capital opportunities">{ranked.map(row => <Opportunity key={row.id} row={row} objective={objective} quote={quote} />)}</ul>
        : <p className="text-sm text-muted-foreground">The current record does not identify a refinance, vacancy, or sale review.</p>}
    </Card>
  );
}
