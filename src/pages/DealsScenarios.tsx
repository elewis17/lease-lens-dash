import { acquisitionVerdictDetail } from "@/domain/finance/verdicts";
import { VerdictExplanation } from "@/components/VerdictExplanation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultThresholds } from "@/domain/finance/thresholds";
import { modelDeal, priceGates, type DealAssumptions } from "@/domain/finance/underwriting";

import { money as currency, ratio, percent } from "@/domain/finance/format";

import { assumptionsFrom, fields, holdYears, type AssumptionInputs } from "@/features/underwriting/draft";

export default function DealsScenarios({ illustrative = false, values, onChange }: {
  illustrative?: boolean;
  values: AssumptionInputs;
  onChange: (values: AssumptionInputs) => void;
}) {
  const changeInput = (key: keyof DealAssumptions, value: string) => onChange({ ...values, [key]: value });

  const assumptions = assumptionsFrom(values);
  const model = assumptions && modelDeal(assumptions);
  const gates = assumptions && priceGates(assumptions);
  const scenarios = model && assumptions ? [
    { name: "Base case", model },
    { name: "If monthly rent is $200 lower", model: modelDeal({ ...assumptions, rentMonthly: assumptions.rentMonthly - 200 }) },
    { name: "If interest rate is 0.5 pp higher", model: modelDeal({ ...assumptions, annualRate: assumptions.annualRate + 0.005 }) },
    { name: "If operating expenses are 15% higher", model: modelDeal({ ...assumptions, opexMonthly: assumptions.opexMonthly * 1.15 }) },
  ] : [];
  const dscrPasses = model?.dscr != null && model.dscr >= defaultThresholds.buy.minimumDscr;
  const irrPasses = model?.irr != null && model.irr >= defaultThresholds.buy.minimumIrr;

  return (
    <section aria-labelledby="underwriting-title" className="space-y-6 tabular-nums">
      <header className="space-y-1">
        <h2 id="underwriting-title" className="text-2xl font-semibold">Deal Underwriting</h2>
        {illustrative && <p className="text-sm text-muted-foreground">Illustrative data · Kirkwood</p>}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5 shadow-none">
          <h3 className="text-lg font-semibold">Deal inputs</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ key, label }) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={`deal-${key}`}>{label}</Label>
                <Input
                  id={`deal-${key}`}
                  type="number"
                  step="any"
                  value={values[key] ?? ""}
                  onChange={(event) => changeInput(key, event.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5 shadow-none">
          <h3 className="text-lg font-semibold">Price guidance</h3>
          {model && gates
            ? <VerdictExplanation label={gates.verdict} detail={acquisitionVerdictDetail(gates.verdict)} live />
            : <p className="font-medium" role="status">Enter valid assumptions to calculate price guidance.</p>}
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-sm text-muted-foreground">Max offer</dt><dd className="text-xl font-semibold">{currency(gates?.maxOffer)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Walk-away</dt><dd className="text-xl font-semibold">{currency(gates?.walkAway)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">First-year DSCR</dt><dd>{ratio(model?.dscr)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">{holdYears}-year modelled IRR</dt><dd>{percent(model?.irr)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">First-year cash flow / mo</dt><dd>{currency(model?.cashFlow)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">First-year cash yield</dt><dd>{percent(model?.cashYield)}</dd></div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Estimate · Buy requires DSCR ≥ {ratio(defaultThresholds.buy.minimumDscr)} and IRR ≥ {percent(defaultThresholds.buy.minimumIrr)}.
            {model?.dscr != null && model.irr != null && ` Asking price passes ${Number(dscrPasses) + Number(irrPasses)} of 2 gates.`}
          </p>
          <p className="text-sm text-muted-foreground">
            Walk-away uses the {ratio(defaultThresholds.lender.minimumDscr)} lender floor. Above max offer, verify rent, a rate buydown, or a larger down payment before proceeding.
          </p>
          {model?.dscr === null && <p className="text-sm text-muted-foreground">DSCR requires scheduled debt service.</p>}
          {model?.irr === null && <p className="text-sm text-muted-foreground">Projected cash flows do not establish a unique IRR.</p>}
        </Card>
      </div>

      <Card className="space-y-3 p-5 shadow-none">
        <h3 className="text-lg font-semibold">Scenario analysis</h3>
        <p className="text-sm text-muted-foreground">The estimate uses operating income after vacancy and expenses. The sale uses next-year NOI at the exit cap, less selling costs and loan payoff.</p>
        {scenarios.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b">
                <th scope="col" className="p-2">Scenario</th>
                <th scope="col" className="p-2">DSCR</th>
                <th scope="col" className="p-2">{holdYears}-year IRR</th>
                <th scope="col" className="p-2">Cash flow / mo</th>
              </tr></thead>
              <tbody>{scenarios.map(({ name, model: result }, index) => (
                <tr className={index === 0 ? "border-b" : "border-b italic"} key={name}>
                  <th scope="row" className="p-2 font-medium">{name}</th>
                  <td className="p-2">{ratio(result?.dscr)}</td>
                  <td className="p-2">{percent(result?.irr)}</td>
                  <td className="p-2">{currency(result?.cashFlow)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">Complete the deal inputs to compare scenarios.</p>}
      </Card>

      <Card className="space-y-2 p-5 shadow-none">
        <h3 className="text-lg font-semibold">Market comparables</h3>
        <p className="text-sm text-muted-foreground">No verified comparables are available for this deal.</p>
      </Card>
    </section>
  );
}
