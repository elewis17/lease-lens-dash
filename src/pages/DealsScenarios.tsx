import { cn } from "@/lib/utils";
import { acquisitionVerdictDetail } from "@/domain/finance/verdicts";
import { VerdictExplanation } from "@/components/VerdictExplanation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { propertyTypes, type ThresholdPolicy } from "@/domain/finance/thresholds";
import { breakEvenInputs, modelDeal, priceGates, type DealAssumptions } from "@/domain/finance/underwriting";

import { money as currency, ratio, percent } from "@/domain/finance/format";

import { assumptionsFrom, fields, holdYears, type AssumptionInputs } from "@/features/underwriting/draft";
import { SensitivityTable } from "@/features/underwriting/SensitivityTable";
import { RentSensitivity } from "@/features/underwriting/RentSensitivity";

const assumptionSliders: Partial<Record<keyof DealAssumptions, { max: number; step: number; unit: "money" | "percent" }>> = {
  rentMonthly: { max: 10000, step: 25, unit: "money" },
  opexMonthly: { max: 5000, step: 25, unit: "money" },
  downPayment: { max: 100, step: 0.5, unit: "percent" },
  annualRate: { max: 20, step: 0.05, unit: "percent" },
};

function priceRange(asking: number, test: number, walkAway: number, maxOffer: number | null) {
  const high = Math.max(asking, test, walkAway);
  const low = Math.min(asking, test, maxOffer ?? walkAway);
  const tick = 10 ** Math.max(0, Math.floor(Math.log10(high)) - 1);
  const min = Math.max(1, Math.floor(low * 0.95 / tick) * tick);
  const max = Math.ceil(high * 1.08 / tick) * tick;
  return Number.isSafeInteger(max) && max > min ? { min, max, step: Math.max(1, tick / 10) } : null;
}

export default function DealsScenarios({ illustrative = false, values, onChange, policy }: {
  illustrative?: boolean;
  policy: ThresholdPolicy;
  values: AssumptionInputs;
  onChange: (values: AssumptionInputs) => void;
}) {
  const changeInput = (key: keyof DealAssumptions, value: string) =>
    onChange({ ...values, [key]: value, testPrice: key === "price" ? undefined : values.testPrice });

  const asking = assumptionsFrom(values);
  const testPrice = values.testPrice ? Number(values.testPrice) : null;
  const assumptions = asking && { ...asking, price: testPrice ?? asking.price };
  const model = assumptions && modelDeal(assumptions);
  const breakEvens = assumptions && breakEvenInputs(assumptions, policy.buy);
  const gates = assumptions && priceGates(assumptions, policy.buy, policy.lender);
  const range = asking && assumptions && gates?.walkAway != null
    ? priceRange(asking.price, assumptions.price, gates.walkAway, gates.maxOffer)
    : null;
  const scenarios = model && assumptions ? [
    { name: testPrice === null ? "Base case" : "If bought at the test price", model },
    { name: "If monthly rent is $200 lower", model: modelDeal({ ...assumptions, rentMonthly: assumptions.rentMonthly - 200 }) },
    { name: "If interest rate is 0.5 pp higher", model: modelDeal({ ...assumptions, annualRate: assumptions.annualRate + 0.005 }) },
    { name: "If operating expenses are 15% higher", model: modelDeal({ ...assumptions, opexMonthly: assumptions.opexMonthly * 1.15 }) },
  ] : [];
  const dscrPasses = model?.dscr != null && model.dscr >= policy.buy.minimumDscr;
  const irrPasses = model?.irr != null && model.irr >= policy.buy.minimumIrr;

  return (
    <section aria-labelledby="underwriting-title" className="space-y-6 tabular-nums">
      <header className="space-y-1">
        <h2 id="underwriting-title" tabIndex={-1} className="text-2xl font-semibold">Deal Underwriting</h2>
        {illustrative && <p className="text-sm text-muted-foreground">Illustrative data · Kirkwood</p>}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5 lg:col-start-2 lg:row-start-1">
          <h3 className="text-lg font-semibold">Price guidance</h3>
          {model && gates
            ? <div className={cn("space-y-1", testPrice !== null && "italic")}>
                {testPrice !== null && <p className="text-xs text-muted-foreground">Hypothetical · if bought at {currency(testPrice)}</p>}
                <VerdictExplanation label={gates.verdict} detail={acquisitionVerdictDetail(gates.verdict)} live />
                <p className="text-xs text-muted-foreground">Confidence · Price guidance depends on the entered rents, operating costs, financing and exit assumptions.</p>
              </div>
            : <p className="font-medium" role="status">Enter valid assumptions to calculate price guidance.</p>}
          {asking && assumptions && range && (
            <div className="space-y-1 border-y py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4">
                <p className="text-sm font-medium">Price to test</p>
                <output className="text-lg font-semibold">{currency(assumptions.price)}</output>
              </div>
              <div className="relative">
                <Slider {...range} className="min-h-11"
                  thumbLabel="Price to test" thumbValueText={currency(assumptions.price)}
                  value={[assumptions.price]}
                  onValueChange={([price]) => onChange({ ...values, testPrice: price === asking.price ? undefined : String(price) })} />
                <div className="pointer-events-none absolute inset-x-0 top-8" aria-hidden="true">
                  {[gates?.maxOffer, gates?.walkAway].map((price, index) => price != null && (
                    <span key={index}
                      className="absolute h-2 w-px bg-foreground"
                      style={{ left: `${100 * (price - range.min) / (range.max - range.min)}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 text-xs text-muted-foreground">
                <span aria-hidden="true">{currency(range.min)}</span>
                {testPrice === null
                  ? <span>Asking {currency(asking.price)}</span>
                  : <button type="button" className="min-h-11 rounded underline focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() => onChange({ ...values, testPrice: undefined })}>
                      Reset to asking {currency(asking.price)}
                    </button>}
                <span aria-hidden="true">{currency(range.max)}</span>
              </div>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-sm text-muted-foreground">Max offer</dt><dd className="text-xl font-semibold">{currency(gates?.maxOffer)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Walk-away</dt><dd className="text-xl font-semibold">{currency(gates?.walkAway)}</dd></div>
            <div className={testPrice !== null ? "italic" : undefined}>
              <dt className="text-sm text-muted-foreground">First-year DSCR</dt><dd>{ratio(model?.dscr)}</dd>
              {model?.dscr != null && <dd className={cn("text-xs", dscrPasses ? "text-brand" : "text-destructive")}>{dscrPasses ? "Pass" : "Fail"} · {ratio(policy.buy.minimumDscr)} minimum</dd>}
            </div>
            <div className={testPrice !== null ? "italic" : undefined}>
              <dt className="text-sm text-muted-foreground">{holdYears}-year modelled IRR</dt><dd>{percent(model?.irr)}</dd>
              {model?.irr != null && <dd className={cn("text-xs", irrPasses ? "text-brand" : "text-destructive")}>{irrPasses ? "Pass" : "Fail"} · {percent(policy.buy.minimumIrr)} minimum</dd>}
            </div>
            <div className={testPrice !== null ? "italic" : undefined}><dt className="text-sm text-muted-foreground">First-year cash flow / mo</dt><dd>{currency(model?.cashFlow)}</dd></div>
            <div className={testPrice !== null ? "italic" : undefined}><dt className="text-sm text-muted-foreground">First-year cash yield</dt><dd>{percent(model?.cashYield)}</dd></div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Estimate · Buy requires DSCR ≥ {ratio(policy.buy.minimumDscr)} and IRR ≥ {percent(policy.buy.minimumIrr)}.
            {model?.dscr != null && model.irr != null && ` ${testPrice === null ? "Asking price" : "Test price"} passes ${Number(dscrPasses) + Number(irrPasses)} of 2 gates.`}
          </p>
          <p className="text-sm text-muted-foreground">
            Walk-away uses the {ratio(policy.lender.minimumDscr)} lender floor. Above max offer, verify rent, a rate buydown, or a larger down payment before proceeding.
          </p>
          {model && <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium">Break-evens · Estimate</h4>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt>Minimum monthly rent</dt><dd className="font-medium">{currency(breakEvens?.rent)}</dd></div>
              <div><dt>Maximum loan rate</dt><dd className="font-medium">{breakEvens?.annualRate == null ? "—" : (breakEvens.annualRate * 100).toFixed(2) + "%"}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">Moves one assumption at a time to pass both buy gates. A dash means there is no supported break-even with the other inputs fixed.</p>
          </div>}
          {model?.dscr === null && <p className="text-sm text-muted-foreground">DSCR requires scheduled debt service.</p>}
          {model?.irr === null && <p className="text-sm text-muted-foreground">Projected cash flows do not establish a unique IRR.</p>}
        </Card>
        {assumptions && model && <RentSensitivity assumptions={assumptions} irrGate={policy.buy.minimumIrr} />}
        <Card className="space-y-4 p-5 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-start">
          <h3 className="text-lg font-semibold">Deal inputs</h3>
          <label className="grid gap-1 text-sm">Property type
            <select className="rounded-md border bg-background p-2" value={values.propertyType ?? ""}
              onChange={event => onChange({ ...values, propertyType: event.target.value || undefined })}>
              <option value="">Use portfolio policy</option>
              {propertyTypes.map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ key, label }) => {
              const slider = assumptionSliders[key];
              const current = values[key]?.trim() ? Number(values[key]) : null;
              return (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={`deal-${key}`}>{label}</Label>
                  <Input
                    id={`deal-${key}`}
                    type="number"
                    step="any"
                    value={values[key] ?? ""}
                    onChange={(event) => changeInput(key, event.target.value)}
                  />
                  {slider && current !== null && Number.isFinite(current) && current >= 0 && (
                    <Slider className="min-h-11" min={0} max={Math.max(slider.max, current)} step={slider.step}
                      thumbLabel={`Adjust ${label}`} thumbValueText={slider.unit === "money" ? currency(current) : current + "%"}
                      value={[current]} onValueChange={([value]) => changeInput(key, String(value))} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {assumptions && model && <SensitivityTable assumptions={assumptions} minimumIrr={policy.buy.minimumIrr} />}

      <Card className="space-y-3 p-5">
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
                <tr className={index === 0 && testPrice === null ? "border-b" : "border-b italic"} key={name}>
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

      <Card className="space-y-2 p-5">
        <h3 className="text-lg font-semibold">Market comparables</h3>
        <p className="text-sm text-muted-foreground">No verified comparables are available for this deal.</p>
      </Card>
    </section>
  );
}
