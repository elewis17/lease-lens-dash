import { VerdictExplanation } from "@/components/VerdictExplanation";
import { useSessionState } from "@/features/navigation/sessionState";
import { Input } from "@/components/ui/input";
import { projectNextYearWealth } from "@/domain/finance/scenarios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WealthBuildChart } from "@/components/WealthBuildChart";
import { coverage, money, percent } from "@/domain/finance/format";
import type { PortfolioMetrics } from "@/domain/finance/portfolio";

export default function PortfolioSnapshot({ metrics, onAddData, initialAppreciation = "", sessionKey }: {
  metrics: PortfolioMetrics; onAddData: () => void; initialAppreciation?: string; sessionKey: string;
}) {
  const [appreciationRate, setAppreciationRate] = useSessionState(sessionKey, initialAppreciation);
  const [equityGoal, setEquityGoal] = useSessionState(sessionKey + ":equityGoal", "");
  const [cashGoal, setCashGoal] = useSessionState(sessionKey + ":cashGoal", "");
  if (!metrics.assets.length) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Portfolio Snapshot</h1>
        <p className="text-muted-foreground">No properties yet. Add a property and its leases, operating costs, and financing to calculate the snapshot.</p>
        <Button onClick={onAddData}>Open Data Room</Button>
      </section>
    );
  }

  const appreciation = appreciationRate.trim() === "" ? null : Number(appreciationRate);
  const wealth = projectNextYearWealth(metrics, appreciation);
  const progress = (amount: number | null, target: string) =>
    amount !== null && Number(target) > 0 && Number.isFinite(Number(target)) ? percent(amount / Number(target)) : "—";
  const tiles = [
    { label: "Monthly cash flow", value: money(metrics.cashFlow), basis: "Estimate · Monthly NOI less principal and interest" },
    { label: "DSCR", value: coverage(metrics), basis: "Estimate · Monthly NOI divided by principal and interest" },
    { label: "Cap rate", value: percent(metrics.capRate), basis: "Estimate · Annualized NOI divided by property value" },
    { label: "Physical occupancy", value: percent(metrics.physicalOccupancy), basis: metrics.occupiedUnits === null || metrics.totalUnits === null
      ? "Unit or lease records missing" : `Contractual · ${metrics.occupiedUnits} of ${metrics.totalUnits} units on current leases` },
    { label: "Real estate equity", value: money(metrics.equity), basis: "Estimate · Property value less recorded current loan balances" },
    { label: "Cash-on-cash", value: percent(metrics.cashOnCash), basis: "Invested cash basis is missing" },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Portfolio Snapshot</h1>
        <VerdictExplanation {...metrics.verdict} />
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(tile => (
          <Card key={tile.label} className="p-4">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{tile.value}</dd>
            <dd className="text-xs text-muted-foreground">{tile.basis}</dd>
          </Card>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Operating reality</h2>
          <dl className="space-y-2 tabular-nums">
            <div className="flex justify-between gap-4"><dt>Contractual rent / mo</dt><dd>{money(metrics.expectedRent)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Vacancy adjustment / mo · Estimate</dt><dd>{money(metrics.expectedRent === null || metrics.effectiveRent === null ? null : metrics.effectiveRent - metrics.expectedRent)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Operating expenses / mo · Estimate</dt><dd>{money(metrics.opex)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Principal and interest / mo</dt><dd>{money(metrics.debtService)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Cash flow · Annualized from rounded monthly run-rate</dt><dd>{money(metrics.annualizedCashFlow)}</dd></div>
          </dl>
          <dl className="space-y-2 border-t pt-3 tabular-nums">
            <div className="flex justify-between gap-4"><dt>Recorded cash receipts · {metrics.month}</dt><dd>{money(metrics.receipts)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Economic occupancy · {metrics.month}</dt><dd>{percent(metrics.economicOccupancy)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Recorded arrears</dt><dd>{money(metrics.arrears)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Economic occupancy uses recorded receipts divided by contractual amounts due on payment records for the completed month. Arrears use recorded amounts overdue.</p>
        </Card>
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Equity position</h2>
          <dl className="space-y-2 tabular-nums">
            <div className="flex justify-between gap-4"><dt>Property value · Estimate</dt><dd>{money(metrics.value)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Debt · Recorded current balances</dt><dd>{money(metrics.debt)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Loan-to-value · Estimate</dt><dd>{percent(metrics.ltv)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Scheduled principal reduction · Next 12 months</dt><dd>{money(metrics.paydown)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Equity requires a current valuation and current balances for every loan. Sale proceeds also require selling costs and payoff quotes.</p>
          <div className="space-y-2 border-t pt-3">
            <h3 className="font-medium">Projected wealth growth · Next 12 months</h3>
            <label className="block text-sm">Expected annual appreciation (%)
              <Input type="number" step="any" value={appreciationRate} onChange={event => setAppreciationRate(event.target.value)} />
            </label>
            <dl className="space-y-2 tabular-nums">
              <div className="flex justify-between gap-4"><dt>Appreciation · Estimate</dt><dd>{money(wealth.appreciation)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Projected growth · Estimate</dt><dd>{money(wealth.growth)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">Adds the annualized cash flow, scheduled principal reduction, and entered appreciation. Requires all three.</p>
          </div>
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Expense evidence</h2>
        {metrics.assets.map(asset => (
          <details key={asset.property.id} className="border-t pt-2">
            <summary>{asset.property.alias}</summary>
            <p className="mt-2 text-xs text-muted-foreground">Recorded expenses use the prior 12 months divided by 12. Missing categories are shown below.</p>
            {asset.expenseLines.length ? <dl className="mt-2 space-y-1 text-sm">
              {asset.expenseLines.map(line => <div className="flex justify-between gap-4" key={line.category}>
                <dt>{line.category === "pm" ? "Management" : line.category}</dt><dd>{money(line.amount)} · {line.basis}</dd>
              </div>)}
            </dl> : <p className="text-sm text-muted-foreground">Expense records could not be loaded.</p>}
          </details>
        ))}
      </Card>
      <WealthBuildChart metrics={metrics} appreciationRatePct={appreciation} />
      <Card className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Portfolio objectives</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Real estate equity target ($)
            <Input type="number" min="0" value={equityGoal} onChange={event => setEquityGoal(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">Monthly cash flow target ($)
            <Input type="number" min="0" value={cashGoal} onChange={event => setCashGoal(event.target.value)} />
          </label>
        </div>
        <p className="text-sm tabular-nums">Estimated progress · Equity {progress(metrics.equity, equityGoal)} · Monthly cash flow {progress(metrics.cashFlow, cashGoal)}</p>
      </Card>
    </section>
  );
}
