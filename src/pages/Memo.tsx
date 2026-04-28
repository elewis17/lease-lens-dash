import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  Landmark,
  LineChart,
  ShieldCheck,
  Target,
} from "lucide-react";

const money = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

const pct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(2)}%` : "—");

const Memo = () => {
  const [dealName, setDealName] = useState("Marietta Value-Add Rental");
  const [assetClass, setAssetClass] = useState("Small Multifamily");
  const [purchasePrice, setPurchasePrice] = useState(1250000);
  const [maxOffer, setMaxOffer] = useState(1185000);
  const [targetIrr, setTargetIrr] = useState(12);
  const [projectedIrr, setProjectedIrr] = useState(11.4);
  const [dscr, setDscr] = useState(1.28);
  const [capRate, setCapRate] = useState(6.35);
  const [cashFlow, setCashFlow] = useState(3850);

  const verdict = useMemo(() => {
    if (projectedIrr >= targetIrr && dscr >= 1.25 && purchasePrice <= maxOffer) return "Approve";
    if (projectedIrr >= targetIrr - 1.5 && dscr >= 1.15) return "Negotiate";
    return "Pass";
  }, [projectedIrr, targetIrr, dscr, purchasePrice, maxOffer]);

  const verdictClass =
    verdict === "Approve"
      ? "bg-emerald-50 text-emerald-700"
      : verdict === "Negotiate"
        ? "bg-amber-50 text-amber-800"
        : "bg-rose-50 text-rose-700";

  const memoText = `Investment Committee Memo\n\nDeal: ${dealName}\nAsset Class: ${assetClass}\nRecommendation: ${verdict}\n\nSummary\nThe proposed acquisition is being evaluated against a ${pct(targetIrr)} target IRR, minimum DSCR discipline, and market-supported rent assumptions. Current pricing is ${purchasePrice <= maxOffer ? "inside" : "above"} the recommended max offer.\n\nKey Metrics\nPurchase Price: ${money(purchasePrice)}\nRecommended Max Offer: ${money(maxOffer)}\nProjected IRR: ${pct(projectedIrr)}\nTarget IRR: ${pct(targetIrr)}\nDSCR: ${dscr.toFixed(2)}x\nCap Rate: ${pct(capRate)}\nMonthly Cash Flow: ${money(cashFlow)}\n\nInvestment Thesis\nAcquire only if final diligence supports market rent assumptions, expense load, insurance, taxes, and exit cap sensitivity. The strongest case is driven by disciplined entry basis, stable debt coverage, and upside from operational execution.\n\nPrimary Risks\n1. Market rent assumptions may not hold after diligence.\n2. Insurance, taxes, or repairs could compress NOI.\n3. Exit cap expansion could reduce terminal value.\n4. Debt terms may reduce cash-on-cash returns.\n\nNext Steps\nValidate rent comps, sale comps, insurance quote, tax reassessment, repair scope, debt quote, and seller financials before final approval.`;

  const copyMemo = async () => {
    await navigator.clipboard.writeText(memoText);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Investment Committee</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">One-Click IC Memo</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Turn underwriting assumptions into a PE-style decision memo that explains the recommendation, risks, return profile, and next diligence steps.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={copyMemo}>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy memo
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export later
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-border p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Memo Inputs</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Deal name</Label>
              <Input value={dealName} onChange={(e) => setDealName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Asset class</Label>
              <Input value={assetClass} onChange={(e) => setAssetClass(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purchase price" value={purchasePrice} setValue={setPurchasePrice} />
              <Field label="Max offer" value={maxOffer} setValue={setMaxOffer} />
              <Field label="Target IRR %" value={targetIrr} setValue={setTargetIrr} />
              <Field label="Projected IRR %" value={projectedIrr} setValue={setProjectedIrr} />
              <Field label="DSCR" value={dscr} setValue={setDscr} />
              <Field label="Cap rate %" value={capRate} setValue={setCapRate} />
            </div>
            <Field label="Monthly cash flow" value={cashFlow} setValue={setCashFlow} />
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">IC Memo Preview</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">A clean decision document for partners, lenders, or internal review.</p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${verdictClass}`}>
              Recommendation: {verdict}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Projected IRR" value={pct(projectedIrr)} icon={LineChart} />
            <Metric label="Target IRR" value={pct(targetIrr)} icon={Target} />
            <Metric label="DSCR" value={`${dscr.toFixed(2)}x`} icon={ShieldCheck} />
            <Metric label="Max Offer" value={money(maxOffer)} icon={CheckCircle2} />
          </div>

          <div className="mt-6 space-y-4">
            <MemoSection
              title="Executive Summary"
              body={`${dealName} is being evaluated as a ${assetClass.toLowerCase()} acquisition. The model currently produces a ${pct(projectedIrr)} projected IRR against a ${pct(targetIrr)} target and a ${dscr.toFixed(2)}x DSCR.`}
            />
            <MemoSection
              title="Investment Thesis"
              body="The deal is attractive only if the entry basis remains disciplined, market rent assumptions are validated, and debt coverage remains resilient under downside conditions. The strongest value creation lever is operating execution, not just spreadsheet appreciation."
            />
            <MemoSection
              title="Pricing Guidance"
              body={`Recommended max offer is ${money(maxOffer)}. Current purchase price is ${money(purchasePrice)}, which is ${purchasePrice <= maxOffer ? "within" : "above"} the recommended bid range.`}
            />
            <MemoSection
              title="Primary Risks"
              body="Key risks include rent comp accuracy, insurance increases, tax reassessment, repair scope, debt terms, and exit cap expansion. These should be validated before final approval."
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RiskCard title="Market Validation" status="Open" body="Confirm sale comps, rent comps, and micro-market demand before issuing final IC recommendation." />
        <RiskCard title="Debt Quote" status="Open" body="Replace placeholder debt assumptions with lender quote, amortization, fees, and prepayment constraints." />
        <RiskCard title="Diligence Package" status="Open" body="Attach T12, rent roll, tax records, insurance quote, repair budget, and lease audit." />
      </section>
    </div>
  );
};

function Field({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MemoSection({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function RiskCard({ title, status, body }: { title: string; status: string; body: string }) {
  return (
    <Card className="rounded-2xl border-border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="font-medium">{title}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </Card>
  );
}

export default Memo;
