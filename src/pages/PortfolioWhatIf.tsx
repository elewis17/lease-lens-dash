import { useSessionState } from "@/features/navigation/sessionState";
import { Disclosure } from "@/components/ui/disclosure";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, coverage } from "@/domain/finance/format";
import { refinance } from "@/domain/finance/scenarios";
import type { PortfolioMetrics } from "@/domain/finance/portfolio";

export function PortfolioWhatIf({ metrics, marketRate, onMarketRateChange, rentScenario, sessionKey, termYears, setTermYears, costPct, setCostPct }: {
  metrics: PortfolioMetrics;
  marketRate: string;
  onMarketRateChange: (rate: string) => void;
  sessionKey: string;
  termYears: string;
  setTermYears: (term: string) => void;
  costPct: string;
  setCostPct: (cost: string) => void;
  rentScenario: (increase: number) => PortfolioMetrics;
}) {
  const [rentPct, setRentPct] = useSessionState(`${sessionKey}:rentPct`, "");
  const [buildingBasis, setBuildingBasis] = useSessionState(`${sessionKey}:buildingBasis`, "");
  const [eligibleShare, setEligibleShare] = useSessionState(`${sessionKey}:eligibleShare`, "");
  const [bonusPct, setBonusPct] = useSessionState(`${sessionKey}:bonusPct`, "");
  const [taxRate, setTaxRate] = useSessionState(`${sessionKey}:taxRate`, "");
  const [serviceYear, setServiceYear] = useSessionState(`${sessionKey}:serviceYear`, "");
  const refi = [marketRate, termYears, costPct].every(value => value !== "")
    ? refinance(metrics, Number(marketRate), Number(termYears) * 12, Number(costPct)) : null;
  const rent = rentPct !== "" && Number.isFinite(Number(rentPct)) && Number(rentPct) >= -100 ? rentScenario(Number(rentPct)) : null;
  const rentDelta = rent?.noi != null && metrics.noi !== null ? (rent.noi - metrics.noi) * 12 : null;
  const taxableInputs = [eligibleShare, bonusPct, taxRate];
  const tax = buildingBasis !== "" && Number.isFinite(Number(buildingBasis)) && Number(buildingBasis) >= 0 &&
    /^\d{4}$/.test(serviceYear) && taxableInputs.every(value => value !== "" && Number(value) >= 0 && Number(value) <= 100)
    ? Number(buildingBasis) * taxableInputs.reduce((product, value) => product * Number(value) / 100, 1) : null;

  const numberField = (label: string, value: string, change: (value: string) => void) => (
    <label className="space-y-1 text-sm">
      <span>{label}</span><Input value={value} type="number" step="any" onChange={event => change(event.target.value)} />
    </label>
  );

  return (
    <Disclosure section label="What-if analysis">
      <Card className="space-y-3 p-4">
        <h3 className="font-medium">Refinance</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {numberField("Market quote rate (%)", marketRate, onMarketRateChange)}
          {numberField("Quoted term (years)", termYears, setTermYears)}
          {numberField("Upfront closing costs (% of balance)", costPct, setCostPct)}
        </div>
        <Disclosure label="Refinance assumptions"><p>Uses rental loans in the selected scope and retains their monthly escrow. Assumes a cash-paid closing with no cash-out. Include fees and any prepayment charges.</p></Disclosure>
        {refi ? <p className="text-sm italic">If refinanced · Annualized cash flow change {money(refi.annualRunRateImpact)} · First 12 months after {money(refi.closingCosts)} closing costs {money(refi.firstYearNet)} · Retained escrow {money(refi.escrow)}/mo · DSCR {coverage({ dscr: refi.dscr, debtService: refi.newDebtService })}</p>
          : <p className="text-sm text-muted-foreground">Requires quote terms, current balances, existing loan schedules, and operating costs.</p>}
      </Card>
      <Card className="space-y-3 p-4">
        <h3 className="font-medium">Rent change</h3>
        {numberField("Change to active monthly rents (%)", rentPct, setRentPct)}
        <Disclosure label="Rent assumptions"><p>Keeps vacancy assumptions and recorded costs fixed. Rent-based management and maintenance estimates recalculate.</p></Disclosure>
        <p className="text-sm italic">If rents change · Annualized NOI change {money(rentDelta)} · DSCR {rent ? coverage(rent) : "—"}</p>
      </Card>
      <Card className="space-y-3 p-4">
        <h3 className="font-medium">Estimated first-year tax effect</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {numberField("Building basis excluding land ($)", buildingBasis, setBuildingBasis)}
          {numberField("Eligible share of building basis (%)", eligibleShare, setEligibleShare)}
          {numberField("Confirmed bonus rate for service year (%)", bonusPct, setBonusPct)}
          {numberField("Marginal tax rate (%)", taxRate, setTaxRate)}
          {numberField("Placed-in-service year", serviceYear, setServiceYear)}
        </div>
        <Disclosure label="Tax assumptions"><p>Uses your confirmed eligible basis and rates. Assumes the deduction can be used in the service year. Future recapture, other depreciation, and offset limits are excluded.</p></Disclosure>
        <p className="text-sm italic">If assumptions hold · Estimated first-year tax effect {money(tax)}</p>
      </Card>
    </Disclosure>
  );
}
