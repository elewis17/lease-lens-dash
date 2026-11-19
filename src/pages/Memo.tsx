import { acquisitionVerdictDetail } from "@/domain/finance/verdicts";
import { VerdictExplanation } from "@/components/VerdictExplanation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { money, ratio, percent } from "@/domain/finance/format";
import { modelDeal, priceGates, type DealAssumptions } from "@/domain/finance/underwriting";
import type { ThresholdPolicy } from "@/domain/finance/thresholds";

export default function Memo({ assumptions, onOpenUnderwriting, policy }: { assumptions: DealAssumptions | null; onOpenUnderwriting: () => void; policy: ThresholdPolicy }) {
  const model = assumptions && modelDeal(assumptions);
  const gates = assumptions && priceGates(assumptions, policy.buy, policy.lender);
  if (!assumptions || !model || !gates) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Investment Memo</h1>
        <p className="text-muted-foreground">Complete the assumptions in Deal Underwriting to prepare a memo.</p>
        <Button onClick={onOpenUnderwriting}>Open Deal Underwriting</Button>
      </section>
    );
  }

  const summary = [
    ["Asking price", money(assumptions.price)],
    ["Max offer · Estimate", money(gates.maxOffer)],
    ["Walk-away · Estimate", money(gates.walkAway)],
    ["First-year DSCR · Estimate", ratio(model.dscr, "n/a")],
    [`${assumptions.holdYears}-year modelled IRR · Estimate`, percent(model.irr)],
    ["First-year cash flow / mo · Estimate", money(model.cashFlow)],
  ];
  const basis = `Buy gates use ${ratio(policy.buy.minimumDscr)} DSCR and ${percent(policy.buy.minimumIrr)} modelled IRR. Exit proceeds use next-year NOI at the entered exit cap, less selling costs and the remaining loan payoff.`;
  const text = ["Investment Memo", `Verdict · ${gates.verdict}`, ...summary.map(([label, value]) => `${label} · ${value}`), basis].join("\n");
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Investment Memo</h1>
      <Card className="space-y-4 p-5">
        <VerdictExplanation label={gates.verdict} detail={acquisitionVerdictDetail(gates.verdict)} />
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 tabular-nums">
          {summary.map(([label, value]) => <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-xl font-semibold">{value}</dd>
          </div>)}
        </dl>
        <p className="text-sm text-muted-foreground">{basis}</p>
        <p className="text-sm text-muted-foreground">Verify rent evidence, operating costs, and financing terms before recording a decision.</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onOpenUnderwriting}>Review assumptions</Button>
        <Button onClick={() => navigator.clipboard.writeText(text)}>Copy memo</Button>
      </div>
    </section>
  );
}
