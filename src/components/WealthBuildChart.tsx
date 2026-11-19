import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { projectPortfolio } from "@/domain/finance/scenarios";
import { money } from "@/domain/finance/format";
import type { PortfolioMetrics } from "@/domain/finance/portfolio";

export function WealthBuildChart({ metrics, appreciationRatePct }: { metrics: PortfolioMetrics; appreciationRatePct: number | null }) {
  const [year, setYear] = useState(1);
  const data = projectPortfolio(metrics, appreciationRatePct);
  const selected = data.at(year - 1);
  const showIncome = data.some(point => point.cashFlow !== null);
  const showEquity = data.some(point => point.equity !== null);
  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold">Wealth trajectory</h2>
      <p className="text-sm text-muted-foreground">
        Estimate · Ten years at each property’s recorded rent growth, expense growth, and vacancy assumption.
        {appreciationRatePct === null ? " Valuation uses current cap rates." : " Valuation applies the entered appreciation rate."}
        Loan payments roll off at maturity. Loan balances use current balances and remaining terms.
      </p>
      {(!showEquity || !showIncome) && (
        <p className="text-sm text-muted-foreground">
          {showIncome ? "Equity requires positive NOI, valuation, and complete current loan terms and balances."
            : "Cash flow projections need rent, operating costs, growth assumptions, and remaining loan schedules."}
        </p>
      )}
      {metrics.assets.map(asset => (
        <p className="text-xs text-muted-foreground" key={asset.property.id}>
          {asset.property.alias} · Rent growth {asset.property.rent_growth_rate ?? "—"}% · Expense growth {asset.property.opex_inflation_rate ?? "—"}%
          {" · "}Vacancy {asset.property.vacancy_pct ?? "—"}% · Starting cap rate {asset.capRate === null ? "—" : `${(asset.capRate * 100).toFixed(2)}%`}
        </p>
      ))}
      {(showIncome || showEquity) && (
        <div className="h-72" aria-label="Estimated cash flow and real estate equity by year">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={value => money(value)} width={74} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", borderColor: "hsl(var(--border))" }} formatter={(value: number) => money(value)} labelFormatter={value => `Year ${value}`} />
              <Legend />
              {showIncome && <Line dataKey="cashFlow" name="Annual cash flow" stroke="hsl(var(--foreground))" dot={false} isAnimationActive={false} />}
              {showEquity && <Line dataKey="equity" name="Real estate equity" stroke="hsl(var(--success))" dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {selected && (showIncome || showEquity) && <div className="space-y-2">
        <p className="text-sm font-medium">Year {year} · Estimate</p>
        <Slider min={1} max={data.length} value={[year]} onValueChange={([value]) => setYear(value)}
          className="min-h-11" thumbLabel="Projection year" thumbValueText={"Year " + year} />
        <p className="text-sm tabular-nums">Real estate equity {money(selected.equity)} · Annual cash flow {money(selected.cashFlow)}</p>
      </div>}
    </Card>
  );
}
