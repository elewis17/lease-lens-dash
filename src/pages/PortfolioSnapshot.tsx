import { RentWaterfall } from "@/features/portfolio/RentWaterfall";
import { useRef } from "react";
import { VerdictExplanation } from "@/components/VerdictExplanation";
import { useSessionState } from "@/features/navigation/sessionState";
import { Input } from "@/components/ui/input";
import { projectNextYearWealth } from "@/domain/finance/scenarios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WealthBuildChart } from "@/components/WealthBuildChart";
import { balanceEvidenceText } from "@/domain/finance/debt";
import { coverage, money, percent } from "@/domain/finance/format";
import { operatingConfidence, vacancyOpportunity, type PortfolioMetrics } from "@/domain/finance/portfolio";

const signedPoints = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, signDisplay: "exceptZero" });

export default function PortfolioSnapshot({ metrics, onAddData, onReviewProperty, initialAppreciation = "", vacancyTarget, sessionKey }: {
  metrics: PortfolioMetrics; onAddData: () => void; onReviewProperty: (propertyId: string) => void;
  initialAppreciation?: string; vacancyTarget: number | null; sessionKey: string;
}) {
  const [appreciationRate, setAppreciationRate] = useSessionState(sessionKey, initialAppreciation);
  const [equityGoal, setEquityGoal] = useSessionState(sessionKey + ":equityGoal", "");
  const [cashGoal, setCashGoal] = useSessionState(sessionKey + ":cashGoal", "");
  const wealthHeading = useRef<HTMLHeadingElement>(null);
  if (!metrics.assets.length) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Portfolio Snapshot</h1>
        <p className="text-muted-foreground">No properties yet. Add a property and its leases, operating costs, and financing to calculate the snapshot.</p>
        <Button onClick={onAddData}>Open Holdings</Button>
      </section>
    );
  }

  const appreciation = appreciationRate.trim() === "" ? null : Number(appreciationRate);
  const wealth = projectNextYearWealth(metrics, appreciation);
  const progress = (amount: number | null, target: string) =>
    amount !== null && Number(target) > 0 && Number.isFinite(Number(target)) ? percent(amount / Number(target)) : "—";
  const debtEvidence = balanceEvidenceText(metrics.debtEvidence);
  const operatingEvidence = operatingConfidence(metrics.assets);
  const priorities = metrics.assets.filter(asset =>
    ["Distress", "Sell candidate", "Refinance candidate"].includes(asset.verdict.label))
    .sort((left, right) => (left.cashFlow ?? Infinity) - (right.cashFlow ?? Infinity));
  const deficits = priorities.filter(asset => asset.verdict.label !== "Refinance candidate");
  const refinance = priorities.find(asset => asset.verdict.label === "Refinance candidate");
  const finding = deficits.length === 1 ? deficits[0].property.alias + " needs attention."
    : deficits.length > 1 ? deficits.length + " properties need attention."
    : refinance ? refinance.property.alias + " qualifies for a refinance review."
    : metrics.cashFlow === null ? "Cash flow needs more evidence."
    : metrics.cashFlow > 0 ? "The portfolio is cash-flow positive."
    : metrics.cashFlow < 0 ? "The portfolio is cash-flow negative." : "The portfolio is breaking even.";
  const previous = metrics.previousReceipts;
  const receiptChange = metrics.receipts === null || previous.receipts === null ? null : metrics.receipts - previous.receipts;
  const occupancyChange = metrics.economicOccupancy === null || previous.economicOccupancy === null
    ? null : (metrics.economicOccupancy - previous.economicOccupancy) * 100;
  const cashShortfalls = metrics.assets.flatMap(asset =>
    asset.cashFlow !== null && asset.cashFlow < 0 ? [{ asset, annual: Math.round(asset.cashFlow) * 12 }] : [],
  ).sort((a, b) => a.annual - b.annual);
  const vacancyGaps = metrics.assets.flatMap(asset => {
    const annual = vacancyOpportunity(asset, vacancyTarget);
    return annual !== null && annual > 0 ? [{ asset, annual }] : [];
  }).sort((a, b) => b.annual - a.annual);
  const tiles = [
    { label: "Monthly cash flow", value: money(metrics.cashFlow), basis: "Estimate · Monthly NOI less principal and interest", source: operatingEvidence },
    { label: "DSCR", value: coverage(metrics), basis: "Estimate · Monthly NOI divided by principal and interest", source: operatingEvidence },
    { label: "Cap rate", value: percent(metrics.capRate), basis: "Estimate · Annualized NOI divided by estimated property value" },
    { label: "Cash-on-cash", value: percent(metrics.cashOnCash), basis: "Invested cash basis is missing" },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Briefing</p>
        <h1 className="text-3xl font-semibold">{finding}</h1>
        {metrics.cashFlow !== null && <p className="text-sm">Estimated portfolio cash flow is {money(metrics.cashFlow)} per month.</p>}
        {refinance && deficits.length > 0 && <p className="text-sm">{refinance.property.alias} qualifies for a refinance review.</p>}
        <VerdictExplanation {...metrics.verdict} />
      </header>

      <section aria-label="Wealth at a glance" className="flex flex-wrap items-center gap-x-8 gap-y-4 border-y py-4">
        <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Real estate equity · Estimate</dt>
            <dd className="text-xl font-semibold tabular-nums">{money(metrics.equity)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Debt · Recorded balances</dt>
            <dd className="text-xl font-semibold tabular-nums">{money(metrics.debt)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Equity growth · 12-month projection</dt>
            <dd className="text-xl font-semibold tabular-nums">{money(wealth.growth)}</dd></div>
        </dl>
        <Button variant="outline" onClick={() => {
          wealthHeading.current?.focus({ preventScroll: true });
          wealthHeading.current?.scrollIntoView({ block: "start" });
        }}>View wealth</Button>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="text-lg font-semibold">What changed</h2>
            <p className="text-sm text-muted-foreground">Recorded payments · {metrics.month} compared with {previous.month}</p>
            <dl className="space-y-2 tabular-nums">
              <div className="flex justify-between gap-4"><dt>Rent receipts</dt><dd>{receiptChange !== null && receiptChange > 0 && "+"}{money(receiptChange)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Economic occupancy</dt><dd>{occupancyChange === null ? "—" : signedPoints.format(occupancyChange) + " pp"}</dd></div>
            </dl>
            {(receiptChange === null || occupancyChange === null) && <p className="text-xs text-muted-foreground">A comparison requires a recorded basis for both months.</p>}
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">Where the month’s rent goes</h2>
            <RentWaterfall metrics={metrics} />
            <dl className="space-y-2 border-t pt-3 tabular-nums">
              <div className="flex justify-between gap-4"><dt>Recorded cash receipts · {metrics.month}</dt><dd>{money(metrics.receipts)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Economic occupancy · {metrics.month}</dt><dd>{percent(metrics.economicOccupancy)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Recorded arrears</dt><dd>{money(metrics.arrears)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">Economic occupancy uses recorded receipts divided by contractual amounts due on payment records for the completed month. Arrears use recorded amounts overdue.</p>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">Where money is leaking</h2>
            <section aria-label="Actual losses" className="space-y-2">
              <h3 className="font-medium">Actual losses</h3>
              <p className="text-sm text-muted-foreground">— · Verified losses require a complete record of cash paid, including debt payments.</p>
            </section>
            {cashShortfalls.length > 0 && <section aria-label="Estimated cash flow shortfalls" className="space-y-2 border-t pt-3">
              <h3 className="font-medium">Estimated cash flow shortfalls</h3>
              <ul className="space-y-2">
                {cashShortfalls.map(({ asset, annual }) => <li key={asset.property.id} className="text-sm">
                  {asset.property.alias} · <span className="tabular-nums">{money(annual)}/yr annualized</span>
                </li>)}
              </ul>
            </section>}
            <section aria-label="Missed income" className="space-y-2 border-t pt-3">
              <h3 className="font-medium">Missed income</h3>
              {vacancyGaps.length > 0 ? <ul className="space-y-2">
                {vacancyGaps.map(({ asset, annual }) => <li key={asset.property.id} className="text-sm italic">
                  <p>{asset.property.alias} · {money(annual)}/yr potential rent</p>
                  <p className="text-xs text-muted-foreground">Hypothetical · If vacancy fell from {asset.property.vacancy_pct}% to {vacancyTarget}%</p>
                </li>)}
              </ul> : <p className="text-sm text-muted-foreground">{vacancyTarget === null
                ? "— · Vacancy opportunity requires a supported vacancy target." : "No modeled vacancy above the illustrative target."}</p>}
              <p className="text-sm text-muted-foreground">— · Below-market rent requires verified comparable rents.</p>
            </section>
          </Card>
          {priorities.length > 0 && (
            <Card className="space-y-3 p-5">
              <h2 className="text-lg font-semibold">Needs you</h2>
              <ul className="divide-y">
                {priorities.map(asset => {
                  const isRefinance = asset.verdict.label === "Refinance candidate";
                  const evidence = operatingConfidence([asset]) || "Coverage uses the recorded rents, costs and scheduled debt payments.";
                  return (
                    <li key={asset.property.id} className="space-y-2 py-3">
                      <p className="font-medium">{asset.property.alias} · {asset.verdict.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Estimate · {money(asset.cashFlow)}/mo cash flow and {coverage(asset)} debt-service coverage.
                        {" "}{asset.verdict.detail}
                      </p>
                      <p className="text-xs text-muted-foreground">{evidence}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRefinance
                          ? "Confirm the quote and fees before estimating savings."
                          : "Verify rent and expenses and obtain a payoff quote and selling costs before considering a sale."}
                      </p>
                      <Button variant="outline" onClick={() => onReviewProperty(asset.property.id)}>
                        Review {asset.property.alias} in Capital
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(tile => (
          <Card key={tile.label} className="p-4">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{tile.value}</dd>
            <dd className="text-xs text-muted-foreground">{tile.basis}</dd>
            {tile.source && <dd className="mt-1 text-xs text-muted-foreground">{tile.source}</dd>}
          </Card>
        ))}
      </dl>

      <Card className="space-y-4 p-5">
        <h2 ref={wealthHeading} tabIndex={-1} className="scroll-mt-4 text-lg font-semibold focus-visible:outline-ring">Equity position</h2>
        <dl className="space-y-2 tabular-nums">
          <div className="flex justify-between gap-4"><dt>Property value · Estimate, source date unverified</dt><dd>{money(metrics.value)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Debt · Recorded current balances</dt><dd>{money(metrics.debt)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Loan-to-value · Estimate</dt><dd>{percent(metrics.ltv)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Scheduled principal reduction · Next 12 months</dt><dd>{money(metrics.paydown)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Physical occupancy · Contracted units</dt><dd>{percent(metrics.physicalOccupancy)}</dd></div>
        </dl>
        {debtEvidence && <p className="text-xs text-muted-foreground">{debtEvidence}</p>}
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
