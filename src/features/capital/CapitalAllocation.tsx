import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { ReactNode } from "react";
import { Disclosure } from "@/components/ui/disclosure";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, ratio } from "@/domain/finance/format";
import { capitalBudget, capitalConflicts, capitalProjection, combinedCapitalPlan, netSaleProceeds, recommendCapital, type CapitalObjective, type CapitalOpportunity, type SalePlan } from "@/domain/finance/capital";
import { useSessionState } from "@/features/navigation/sessionState";
import { useWorkspace } from "@/features/portfolio/useWorkspace";

export function CapitalAllocation({ actions, objective, sessionKey, salePlans, objectiveControl, children }: {
  actions: CapitalOpportunity[]; objective: CapitalObjective; sessionKey: string; salePlans: Readonly<Record<string, SalePlan>>; objectiveControl: ReactNode; children: (fit: (action: CapitalOpportunity) => string) => ReactNode;
}) {
  const { metrics, illustrative } = useWorkspace();
  const [available, setAvailable] = useSessionState(sessionKey + ":available", illustrative ? "75000" : "");
  const [reserve, setReserve] = useSessionState(sessionKey + ":reserve", illustrative ? "25000" : "");
  const [arrival, setArrival] = useSessionState(sessionKey + ":arrival", "");
  const [arrivalDate, setArrivalDate] = useSessionState(sessionKey + ":arrivalDate", "");
  const [delay, setDelay] = useSessionState(sessionKey + ":delay", illustrative ? "1" : "");
  const [chosen, setChosen] = useSessionState<string[]>(sessionKey + ":chosen", []);
  const deployable = capitalBudget(available, reserve);
  const belowReserve = deployable !== null && Number(available) < Number(reserve);
  const suggested = deployable === null || belowReserve ? [] : recommendCapital(actions, objective, deployable);
  const eligible = actions.filter(action => {
    const projection = capitalProjection(action);
    return projection && (projection[objective] ?? 0) > 0;
  });
  const nearest = deployable === null ? undefined : eligible.filter(action => capitalProjection(action)!.closingCosts > deployable)
    .sort((a, b) => capitalProjection(a)!.closingCosts - capitalProjection(b)!.closingCosts)[0];
  const first = suggested[0];
  const firstCost = first && capitalProjection(first)!.closingCosts;
  const headline = first ? `${first.title} first · ${money(firstCost)} estimated cost`
    : deployable === null ? "Set the capital budget to compare opportunities."
    : belowReserve ? `Restore ${money(Number(reserve) - Number(available))} to the reserve floor first.`
    : nearest ? `${nearest.title} needs ${money(capitalProjection(nearest)!.closingCosts - deployable)} more.`
    : actions.length ? "The ranked opportunities need evidence or a positive result for this objective."
    : "The current records support no capital action.";
  const fit = (action: CapitalOpportunity) => {
    const projection = capitalProjection(action);
    if (!projection) return "Fit pending · enter assumptions";
    const positive = (projection[objective] ?? 0) > 0;
    if (deployable === null) return positive ? "Budget pending · objective passes" : "Budget pending · no positive objective result";
    if (belowReserve) return positive ? "Reserve shortfall · objective passes" : "Reserve shortfall · no positive objective result";
    const budget = projection.closingCosts <= deployable ? "Within reserve floor" : `${money(projection.closingCosts - deployable)} above deployable`;
    return budget + (positive ? " · objective passes" : " · no positive objective result");
  };
  const alternatives = actions.flatMap(action => action.action === "refinance" &&
    !actions.some(candidate => candidate.action === "sale" && candidate.asset.property.id === action.asset.property.id) ? [{
      ...action, action: "sale" as const, id: action.asset.property.id + ":sale-hypothesis",
      title: "Consider selling " + action.asset.property.alias, refinance: null,
    }] : []);
  const combinationChoices = [...actions, ...alternatives];
  const selected = combinationChoices.filter(action => chosen.includes(action.id));
  const conflicts = capitalConflicts(selected);
  const start = delay.trim() ? Number(delay) : null;
  const plan = combinedCapitalPlan(suggested, start, metrics);
  const selectionPlan = combinedCapitalPlan(selected, start, metrics);

  const budgetField = (label: string, value: string, change: (text: string) => void) => (
    <label className="space-y-1 text-sm">
      <span>{label}</span>
      <Input type="number" min="0" step="any" value={value} onChange={event => change(event.target.value)} />
    </label>
  );

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="view-title">{headline}</h1>
        {!first && nearest && <p className="text-sm">{money(deployable)} deployable above the reserve floor, compared with {money(capitalProjection(nearest)?.closingCosts)} estimated cost.</p>}
        {illustrative && <p className="text-xs text-muted-foreground">Illustrative budget and scenario assumptions</p>}
      </header>
      <Card className="min-w-0 space-y-4 p-4">
      <h3 className="text-lg font-semibold">Capital budget</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {budgetField("Available capital ($)", available, setAvailable)}
        {budgetField("Liquidity reserve floor ($)", reserve, setReserve)}
        <div><p className="text-sm text-muted-foreground">Deployable now</p><p className="font-semibold tabular-nums"><AnimatedNumber value={deployable} format={money} /></p></div>
      </div>
      {deployable === null && <p className="text-sm text-muted-foreground">Enter available capital and the reserve floor.</p>}
      {belowReserve && <p className="text-sm text-warning">Available capital is below the reserve floor.</p>}
      {objectiveControl}
      <Disclosure label="Future capital and timing">
      <div className="grid gap-3 sm:grid-cols-2">
        {budgetField("Additional monthly capital ($)", arrival, setArrival)}
        <label className="space-y-1 text-sm"><span>Monthly capital starts</span><Input type="date" value={arrivalDate} onChange={event => setArrivalDate(event.target.value)} /></label>
      </div>
      {arrival && arrivalDate && <p className="text-sm italic">Hypothetical · If {money(Number(arrival))} arrives monthly from {arrivalDate}, it is available from that date.</p>}
      {actions.flatMap(action => {
        const sale = salePlans[action.id];
        if (!sale || action.action !== "sale") return [];
        const proceeds = netSaleProceeds(sale.price, sale.costs, sale.payoff);
        if (proceeds === null || proceeds <= 0) return [];
        return [<p key={action.id} className="text-sm italic">
          Hypothetical · {money(proceeds)} in net proceeds if {action.asset.property.alias} sells.
          {sale.date ? " Expected " + sale.date + "." : " Closing date is unconfirmed."} The current budget excludes this amount.
        </p>];
      })}
      {[...suggested, ...selected].some(action => action.refinance) && <label className="block max-w-xs space-y-1 text-sm">
              <span>Months until modeled refinance closes</span>
              <Input type="number" min="0" max="12" step="1" value={delay} onChange={event => setDelay(event.target.value)} />
            </label>}
      </Disclosure>
      <div className="grid items-start gap-5 border-t pt-4 lg:grid-cols-[3fr_2fr]">
        <section aria-label="Ranked opportunities" className="min-w-0 space-y-3"><Disclosure label="How an opportunity fits"><p>Upfront cost must be at or below deployable capital after protecting the reserve. The selected objective must have a positive modeled result.</p></Disclosure>{children(fit)}</section>
        <aside aria-label="Allocation plan" className="order-first min-w-0 space-y-4 border-b pb-4 lg:order-none lg:border-b-0 lg:border-l lg:pb-0 lg:pl-4">
            <div className="space-y-2">
              <h4 className="font-medium">Recommended allocation</h4>
              {suggested.length ? <>
                <p className="text-sm text-muted-foreground">Confidence · Each amount depends on the terms and timing shown in its opportunity.</p>
                {!plan && <ul className="space-y-1 text-sm">{suggested.map(action => (
                  <li key={action.id}>{action.title} · {money(capitalProjection(action)?.closingCosts)} estimated cost</li>
                ))}</ul>}
                <PlanResult model={plan} missing="Enter timing from zero to twelve months to calculate first-year net cash." />
              </> : <p className="text-sm text-muted-foreground">{nearest ? "Review the nearest budget gap above." : "Review the budget and objective checks on the ranked opportunities."}</p>}
            </div>
            {combinationChoices.length > 1 && <Disclosure section label="Check a combination">
              {combinationChoices.map(action => (
                <label key={action.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" checked={chosen.includes(action.id)} onChange={event => setChosen(event.target.checked
                    ? [...chosen, action.id] : chosen.filter(id => id !== action.id))} />
                  {action.title}
                </label>
              ))}
              {conflicts.map(conflict => <p key={conflict} role="status" className="text-sm text-warning">{conflict}</p>)}
              {selectionPlan && deployable !== null && selectionPlan.costs > deployable && <p role="status" className="text-sm text-warning">This combination would breach the reserve floor.</p>}
              {selected.length > 0 && conflicts.length === 0 && <PlanResult model={selectionPlan} missing="Model each action’s impact and confirm timing before calculating the combination." />}
            </Disclosure>}
        </aside>
      </div>
    </Card>
    </div>
  );
}

function PlanResult({ model, missing }: { model: ReturnType<typeof combinedCapitalPlan>; missing: string }) {
  return model ? (
    <div className="space-y-3 text-sm italic">
      <p>Hypothetical · If the modeled actions go ahead on this schedule, verify terms and costs first.</p>
      <p className="tabular-nums">
        {money(model.costs)} total capital required, {money(model.runRate)}/yr once live,
        {" "}{money(model.firstYear)} net in the first 12 months, and {ratio(model.dscr)} blended DSCR once live.
      </p>
      <ol aria-label="Modeled capital schedule" className="divide-y border-y">
        {model.steps.map(step => <li key={step.id} className="space-y-1 py-2">
          <p className="font-medium">{step.title}</p>
          <p className="text-xs text-muted-foreground">
            {money(step.costs)} in month {step.costMonth} · {step.runRate === 0 ? "No immediate change to cash run-rate" :
              `${money(step.runRate / 12)}/mo from month ${step.startMonth}`}
          </p>
          <p className="text-xs text-muted-foreground">{money(step.firstYear)} net in the first 12 months</p>
        </li>)}
      </ol>
    </div>
  ) : <p className="text-sm text-muted-foreground">{missing}</p>;
}
