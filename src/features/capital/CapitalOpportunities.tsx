import { CapitalAllocation } from "./CapitalAllocation";
import { useId } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  capitalHorizonYears, capitalObjectives, capitalOpportunities, capitalProjection, emptyPaydownPlan, emptyRentPlan, emptySalePlan, netSaleProceeds, rankCapitalOpportunities,
  type CapitalObjective, type CapitalOpportunity, type RefinanceQuote, type RentPlan, type SalePlan, type PaydownPlan,
} from "@/domain/finance/capital";
import { balanceEvidenceText } from "@/domain/finance/debt";
import { coverage, money, percent, ratio } from "@/domain/finance/format";
import { operatingConfidence, type AssetMetrics } from "@/domain/finance/portfolio";
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

function Opportunity({ row, objective, quote, rentInputs, onRentChange, saleInputs, onSaleChange, paydownInputs, onPaydownChange }: {
  row: CapitalOpportunity;
  objective: CapitalObjective;
  quote: RefinanceQuote;
  rentInputs: RentPlan;
  onRentChange: (next: RentPlan) => void;
  saleInputs: SalePlan;
  onSaleChange: (next: SalePlan) => void;
  paydownInputs: PaydownPlan;
  onPaydownChange: (next: PaydownPlan) => void;
}) {
  const { action, asset, refinance: model, rentPlan } = row;
  const projection = capitalProjection(row);
  const netProceeds = action === "sale" ? netSaleProceeds(saleInputs.price, saleInputs.costs, saleInputs.payoff) : null;
  const { entries } = useWorkspace();
  const history = capitalHistory(entries.entries, row.id);
  const latest = history.at(0)?.payload;
  const stage = latest?.status ?? "identified";
  const captured = {
    kind: "capital" as const, status: stage, opportunityId: row.id, title: row.title, propertyId: asset.property.id,
    notes: "", actualAnnualCashChange: null,
    projection: {
      quote, rentInputs: rentPlan ? rentInputs : undefined,
      paydownInputs: row.paydown ? {
        ...paydownInputs, startingBalance: row.paydown.startingBalance, annualRate: row.paydown.annualRate,
        monthsSaved: row.paydown.monthsSaved, lifetimeInterestSaved: row.paydown.lifetimeInterestSaved,
      } : undefined,
      saleInputs: netProceeds === null ? undefined : { ...saleInputs, netProceeds },
      annualCashChange: projection?.annualRunRateImpact ?? null, initialCost: projection?.closingCosts ?? null,
      tenYearCashChange: projection?.cash ?? null, tenYearWealthChange: projection?.wealth ?? null, coverageChange: projection?.risk ?? null,
    },
  } as const;
  const current = stage === "identified" || stage === "investigating" ? captured : latest ?? captured;
  const debtEvidence = balanceEvidenceText(asset.debtEvidence);
  const score = projection?.[objective] ?? null;
  const formatScore = objective === "risk" ? ratio : money;
  const modeledBasis = operatingConfidence([asset]);

  return (
    <li className="border-t">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 px-2 py-3 text-left
            transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{row.title}</span>
              <span className="block text-xs capitalize text-muted-foreground">{stage}</span>
              <span className="block text-xs text-muted-foreground">Confidence · Needs verification</span>
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
              {(action === "refinance" || action === "paydown" || action === "sale") && debtEvidence && (
                <p className="text-sm text-muted-foreground">{debtEvidence}</p>
              )}
              {action === "vacancy" && asset.occupancy && (
                <p className="text-sm text-muted-foreground">
                  Contractual · Active leases cover {asset.occupancy.occupiedUnits} of {asset.occupancy.totalUnits} recorded units.
                </p>
              )}
              {action === "rent" && <p className="text-sm text-muted-foreground">Contractual · Active leases total {money(asset.expectedRent)} per month.</p>}
              {action === "paydown" && (
                <p className="text-sm text-muted-foreground">
                  Recorded loan balance {money(asset.debt)} · Scheduled monthly principal and interest {money(asset.debtService)}.
                </p>
              )}
              {action === "sale" && (
                <p className="text-sm text-muted-foreground">
                  Estimate · Annualized cash flow {money(asset.cashFlow === null ? null : asset.cashFlow * 12)}, DSCR {coverage(asset)}, property value {money(asset.value)}, and current debt {money(asset.debt)}.
                </p>
              )}
              {modeledBasis && action !== "paydown" && <p className="text-sm text-muted-foreground">{modeledBasis}</p>}
            </section>
            <section className="space-y-1">
              <h3 className="text-sm font-medium">Cost and risk</h3>
              <p className="text-sm text-muted-foreground">{row.risk}</p>
              <p className="text-sm text-muted-foreground">Confidence · {row.missing}</p>
            </section>
            {action === "paydown" && <PaydownEditor row={row} value={paydownInputs} change={onPaydownChange} />}
            {action === "sale" && <SaleScenario value={saleInputs} change={onSaleChange} net={netProceeds} />}
            {(action === "rent" || action === "vacancy") && (
              <RentPlanEditor value={rentInputs} change={onRentChange} estimate={rentPlan} />
            )}
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
            ) : action === "refinance" && (
              <p className="text-sm text-muted-foreground">
                — Enter quote assumptions in Refinance below. The estimate also needs complete loan and operating records.
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

function PaydownEditor({ row, value, change }: {
  row: CapitalOpportunity; value: PaydownPlan; change: (next: PaydownPlan) => void;
}) {
  const estimate = row.paydown;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">Principal paydown</h3>
      <label className="block space-y-1 text-sm">
        <span>Loan to pay down</span>
        <select value={value.loanId} onChange={event => change({ ...value, loanId: event.target.value })}
          className="block min-h-11 w-full rounded-md border bg-background px-2">
          <option value="">Select a loan</option>
          {row.asset.loans?.filter(loan => loan.balance !== null && loan.balance > 0).map(loan => (
            <option key={loan.id} value={loan.id}>{money(loan.balance)} recorded balance at {percent(loan.rate)}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>Principal payment ($)</span>
          <Input type="number" min="0" step=".01" value={value.amount} onChange={event => change({ ...value, amount: event.target.value })} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Prepayment fee ($)</span>
          <Input type="number" min="0" step=".01" value={value.fee} onChange={event => change({ ...value, fee: event.target.value })} />
        </label>
      </div>
      {estimate ? (
        <div className="space-y-2 text-sm italic tabular-nums">
          <p>Hypothetical · If paid now, deploys {money(estimate.closingCosts)} including any fee.</p>
          <p>Monthly cash flow change when applied {money(estimate.debtServiceReduction)}. Loan paid off {estimate.monthsSaved} months earlier.</p>
          <p>{horizon} interest saved {money(estimate.tenYearInterestSaved)}. Lifetime interest saved {money(estimate.lifetimeInterestSaved)}.</p>
          <p>First 12 months after costs {money(estimate.firstYearNet)}. First-year cash yield {percent(estimate.firstYearCashYield)}.</p>
          <p>{horizon} cash change {money(estimate.cash)}. {horizon} incremental real estate net worth {money(estimate.wealth)}.</p>
        </div>
      ) : <p className="text-sm text-muted-foreground">Requires a loan with a current balance and a complete payoff schedule. Enter the payment and a verified fee, or zero if none applies.</p>}
    </section>
  );
}

function SaleScenario({ value, change, net }: { value: SalePlan; change: (next: SalePlan) => void; net: number | null }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">Sale proceeds</h3>
      {([["price", "Sale price ($)"], ["costs", "Selling costs ($)"], ["payoff", "Quoted mortgage payoff ($)"]] as const).map(([key, label]) => (
        <label key={key} className="block space-y-1 text-sm">
          <span>{label}</span>
          <Input type="number" min="0" step="any" value={value[key]} onChange={event => change({ ...value, [key]: event.target.value })} />
        </label>
      ))}
      <label className="block space-y-1 text-sm">
        <span>Expected sale closing date</span>
        <Input type="date" value={value.date} onChange={event => change({ ...value, date: event.target.value })} />
      </label>
      {net === null ? <p className="text-sm text-muted-foreground">— Enter the price, costs, and payoff to calculate net proceeds.</p>
        : <p className="text-sm italic">Hypothetical · If sold on these terms, net proceeds {money(net)}. {net > 0 ? "Available after closing." : "No capital to redeploy from this sale."}</p>}
    </section>
  );
}

function RentPlanEditor({ value, change, estimate }: {
  value: RentPlan;
  change: (next: RentPlan) => void;
  estimate: CapitalOpportunity["rentPlan"];
}) {
  const fields = [
    ["rent", "Additional monthly rent ($)"], ["expenses", "Additional monthly operating costs ($)"],
    ["cost", "Upfront refresh or renewal costs ($)"], ["start", "Whole months until rent starts"],
  ] as const;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">Rent and timing assumptions</h3>
      <div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => (
        <label key={key} className="block space-y-1 text-sm">
          <span>{label}</span>
          <Input type="number" min="0" max={key === "start" ? 12 : undefined} step={key === "start" ? 1 : "any"}
            value={value[key]} onChange={event => change({ ...value, [key]: event.target.value })} />
        </label>
      ))}</div>
      {estimate ? (
        <p className="text-sm italic tabular-nums">
          Hypothetical · If these assumptions hold, {money(estimate.annualRunRateImpact)}/yr once live,
          {" "}{money(estimate.firstYearNet)} net in the first 12 months, and {money(estimate.cash)} net over {capitalHorizonYears} years.
          {" "}First-year cash yield {percent(estimate.cashYield)}. Net worth change includes retained cash with no change to property valuation.
        </p>
      ) : <p className="text-sm text-muted-foreground">Enter rent, incremental costs, upfront costs, and timing. Enter zero where it applies.</p>}
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
  const [rentPlans, setRentPlans] = useSessionState<Record<string, RentPlan>>(sessionKey + ":rent-plans", {});
  const [paydownPlans, setPaydownPlans] = useSessionState<Record<string, PaydownPlan>>(sessionKey + ":paydowns", {});
  const [salePlans, setSalePlans] = useSessionState<Record<string, SalePlan>>(sessionKey + ":sale-plans", {});
  const changeRentPlan = (id: string, next: RentPlan) => setRentPlans({ ...rentPlans, [id]: next });
  const ranked = rankCapitalOpportunities(capitalOpportunities(assets, quote, rentPlans, paydownPlans), objective);
  const paydownOptions = assets.filter(asset => (asset.debt ?? 0) > 0 && !paydownPlans[asset.property.id + ":paydown"]);
  const rentResetOptions = assets.filter(asset => (asset.expectedRent ?? 0) > 0 && !rentPlans[asset.property.id + ":rent"]);

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
      <CapitalAllocation actions={ranked} objective={objective} sessionKey={sessionKey} salePlans={salePlans} />
      <p className="text-sm text-muted-foreground">{objectiveBasis[objective]}</p>
      {!!rentResetOptions.length && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>Model a rent reset</span>
          <select className="min-h-11 rounded-md border bg-background px-2" value=""
            onChange={event => { if (event.target.value) changeRentPlan(event.target.value + ":rent", emptyRentPlan); }}>
            <option value="">Select a property</option>
            {rentResetOptions.map(asset => <option key={asset.property.id} value={asset.property.id}>{asset.property.alias}</option>)}
          </select>
        </label>
      )}
      {!!paydownOptions.length && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>Model a debt paydown</span>
          <select className="min-h-11 rounded-md border bg-background px-2" value=""
            onChange={event => {
              if (event.target.value) setPaydownPlans({ ...paydownPlans, [event.target.value + ":paydown"]: emptyPaydownPlan });
            }}>
            <option value="">Select a property</option>
            {paydownOptions.map(asset => <option key={asset.property.id} value={asset.property.id}>{asset.property.alias}</option>)}
          </select>
        </label>
      )}
      {ranked.length
        ? <ul aria-label="Capital opportunities">{ranked.map(row => (
            <Opportunity key={row.id} row={row} objective={objective} quote={quote}
              rentInputs={rentPlans[row.id] ?? emptyRentPlan} onRentChange={next => changeRentPlan(row.id, next)}
              saleInputs={salePlans[row.id] ?? emptySalePlan} onSaleChange={next => setSalePlans({ ...salePlans, [row.id]: next })}
              paydownInputs={paydownPlans[row.id] ?? emptyPaydownPlan} onPaydownChange={next => setPaydownPlans({ ...paydownPlans, [row.id]: next })} />
          ))}</ul>
        : <p className="text-sm text-muted-foreground">The current record does not identify a refinance, vacancy, or sale review.</p>}
    </Card>
  );
}
