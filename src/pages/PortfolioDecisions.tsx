import { useSessionState } from "@/features/navigation/sessionState";
import { CapitalOpportunities } from "@/features/capital/CapitalOpportunities";
import { VerdictExplanation } from "@/components/VerdictExplanation";
import { Button } from "@/components/ui/button";
import { coverage, money } from "@/domain/finance/format";
import type { PortfolioMetrics } from "@/domain/finance/portfolio";
import { PortfolioWhatIf } from "./PortfolioWhatIf";

export default function PortfolioDecisions({ metrics, onAddData, ...scenarios }: {
  metrics: PortfolioMetrics;
  onAddData: () => void;
  marketRate: string;
  onMarketRateChange: (rate: string) => void;
  sessionKey: string;
  rentScenario: (increase: number) => PortfolioMetrics;
}) {
  const [termYears, setTermYears] = useSessionState(`${scenarios.sessionKey}:termYears`, "");
  const [costPct, setCostPct] = useSessionState(`${scenarios.sessionKey}:costPct`, "");

  if (!metrics.assets.length) {
    return (
      <section className="space-y-4">
        <h1 className="view-title">Where should the next dollar go?</h1>
        <p className="text-muted-foreground">Add records in Holdings to compare assets and model changes.</p>
        <Button onClick={onAddData}>Open Holdings</Button>
      </section>
    );
  }

  const ranked = metrics.assets.flatMap(asset =>
    asset.cashFlow !== null && asset.dscr !== null && asset.equity !== null ? [{ ...asset, cashFlow: asset.cashFlow, dscr: asset.dscr, equity: asset.equity }] : [],
  ).sort((a, b) => b.cashFlow - a.cashFlow || b.dscr - a.dscr || b.equity - a.equity);
  const ranks = new Map(ranked.map((asset, i) => [asset.property.id, i + 1]));
  const rows = [...ranked, ...metrics.assets.filter(asset => !ranks.has(asset.property.id))];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="view-title">Where should the next dollar go?</h1>
        <VerdictExplanation {...metrics.verdict} />
      </header>
      <CapitalOpportunities assets={metrics.assets} sessionKey={scenarios.sessionKey}
        quote={{ rate: scenarios.marketRate, years: termYears, cost: costPct }} />
      <details className="border-y">
        <summary className="cursor-pointer py-4 text-sm font-semibold">Portfolio comparison</summary>
        <dl className="grid grid-cols-3 gap-3 px-1 pb-4">
        {[
          ["Monthly cash flow", money(metrics.cashFlow)],
          ["DSCR", coverage(metrics)],
          ["Real estate equity", money(metrics.equity)],
        ].map(([label, value]) => <div key={label}>
          <dt className="text-sm text-muted-foreground">{label} · Estimate</dt><dd className="text-2xl font-semibold tabular-nums">{value}</dd>
        </div>)}
      </dl>
      <section className="space-y-3 border-t px-1 pb-4 pt-4">
        <h2 className="text-lg font-semibold">Asset ranking</h2>
        <p className="text-sm text-muted-foreground">Estimated monthly cash flow, with coverage and real estate equity as tie-breakers. A rank requires all three measures.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead><tr>{["Rank", "Property", "Cash flow / mo", "DSCR", "Real estate equity", "Verdict"].map(title => <th scope="col" className="p-2" key={title}>{title}</th>)}</tr></thead>
            <tbody>{rows.map(asset => (
              <tr className="border-t" key={asset.property.id}>
                <td className="p-2">{ranks.get(asset.property.id) ?? "—"}</td>
                <th scope="row" className="p-2">{asset.property.alias}</th>
                <td className="p-2">{money(asset.cashFlow)}</td>
                <td className="p-2">{coverage(asset)}</td>
                <td className="p-2">{money(asset.equity)}</td>
                <td className="p-2">{asset.verdict.label}{!ranks.has(asset.property.id) && <span className="block text-xs text-muted-foreground">Insufficient data for rank</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      </details>
      <PortfolioWhatIf metrics={metrics} {...scenarios}
        termYears={termYears} setTermYears={setTermYears} costPct={costPct} setCostPct={setCostPct} />
    </section>
  );
}
