import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  FileText,
  Gauge,
  LineChart,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type AssetClass = "sfr" | "multifamily" | "apartment" | "commercial";
type Verdict = "Buy" | "Negotiate" | "Pass";

const money = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : "—";

const pct = (value: number) => (Number.isFinite(value) ? `${value.toFixed(2)}%` : "—");

const calcMonthlyPayment = (principal: number, annualRatePct: number, months: number) => {
  if (!principal || !annualRatePct || !months) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

const assetLabels: Record<AssetClass, string> = {
  sfr: "Single Family",
  multifamily: "Multifamily (2–20)",
  apartment: "Apartment (20+)",
  commercial: "Commercial / NNN",
};

const comps = [
  { address: "1180 Monroe Dr NE", type: "Rental Comp", distance: "0.4 mi", rent: 3950, price: 0, cap: 0, confidence: "High" },
  { address: "742 North Ave NE", type: "Sale Comp", distance: "0.8 mi", rent: 0, price: 685000, cap: 5.7, confidence: "Medium" },
  { address: "991 Ponce De Leon Ave", type: "Sale Comp", distance: "1.1 mi", rent: 0, price: 712000, cap: 5.4, confidence: "Medium" },
  { address: "421 Glen Iris Dr", type: "Rental Comp", distance: "1.3 mi", rent: 4100, price: 0, cap: 0, confidence: "High" },
];

const scenarios = [
  { name: "Base Case", irr: 10.8, cashFlow: 420, dscr: 1.23, note: "Works only if rent holds." },
  { name: "Downside", irr: 6.9, cashFlow: -135, dscr: 0.96, note: "Vacancy and insurance pressure break coverage." },
  { name: "Upside", irr: 14.2, cashFlow: 875, dscr: 1.42, note: "Rent reset creates attractive spread." },
  { name: "Refi Case", irr: 12.1, cashFlow: 690, dscr: 1.35, note: "Debt optimization improves hold profile." },
];

const riskItems = [
  { label: "Insurance sensitivity", status: "Watch", icon: AlertTriangle },
  { label: "Rent comp confidence", status: "Strong", icon: CheckCircle2 },
  { label: "Debt coverage", status: "Moderate", icon: ShieldCheck },
  { label: "Exit cap pressure", status: "Watch", icon: TrendingDown },
];

export default function DealsScenarios() {
  const [assetClass, setAssetClass] = useState<AssetClass>("sfr");
  const [address, setAddress] = useState("123 Ponce De Leon Ave NE, Atlanta, GA");
  const [purchasePrice, setPurchasePrice] = useState(650000);
  const [marketRent, setMarketRent] = useState(4050);
  const [targetIrr, setTargetIrr] = useState(12);
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [ratePct, setRatePct] = useState(6.75);
  const [termMonths, setTermMonths] = useState(360);
  const [opexPct, setOpexPct] = useState(36);
  const [vacancyPct, setVacancyPct] = useState(5);

  const model = useMemo(() => {
    const monthlyGrossRent = Number(marketRent) || 0;
    const effectiveRent = monthlyGrossRent * (1 - vacancyPct / 100);
    const monthlyOpex = effectiveRent * (opexPct / 100);
    const monthlyNoi = effectiveRent - monthlyOpex;
    const loanAmount = purchasePrice * (1 - downPaymentPct / 100);
    const monthlyDebt = calcMonthlyPayment(loanAmount, ratePct, termMonths);
    const cashFlow = monthlyNoi - monthlyDebt;
    const annualNoi = monthlyNoi * 12;
    const capRate = (annualNoi / Math.max(purchasePrice, 1)) * 100;
    const dscr = annualNoi / Math.max(monthlyDebt * 12, 1);
    const cashInvested = purchasePrice * (downPaymentPct / 100);
    const cashOnCash = (cashFlow * 12) / Math.max(cashInvested, 1) * 100;

    const marketValue = marketRent * 12 / 0.061;
    const priceDeltaPct = ((purchasePrice - marketValue) / Math.max(marketValue, 1)) * 100;
    const maxOffer = Math.round(Math.min(marketValue * 0.96, purchasePrice * (targetIrr >= 12 ? 0.94 : 0.98)) / 1000) * 1000;
    const score = Math.max(0, Math.min(100, Math.round(72 + (capRate - 6) * 8 + (dscr - 1.2) * 22 - Math.max(priceDeltaPct, 0) * 0.7)));

    let verdict: Verdict = "Negotiate";
    if (score >= 78 && dscr >= 1.25 && cashFlow > 300) verdict = "Buy";
    if (score < 62 || dscr < 1 || cashFlow < 0) verdict = "Pass";

    return {
      effectiveRent,
      monthlyOpex,
      monthlyNoi,
      loanAmount,
      monthlyDebt,
      cashFlow,
      annualNoi,
      capRate,
      dscr,
      cashOnCash,
      marketValue,
      priceDeltaPct,
      maxOffer,
      score,
      verdict,
    };
  }, [marketRent, vacancyPct, opexPct, purchasePrice, downPaymentPct, ratePct, termMonths, targetIrr]);

  const verdictClass =
    model.verdict === "Buy"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : model.verdict === "Pass"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-amber-50 text-amber-800 ring-amber-200";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> PE Underwriting Command Center
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Deals & Scenarios</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Screen acquisitions, compare the deal to market, pressure test scenarios, and generate an investment committee view.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
            <div>
              <p className="text-xs text-white/60">Deal Score</p>
              <p className="text-2xl font-semibold">{model.score}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Verdict</p>
              <p className="text-2xl font-semibold">{model.verdict}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Max Offer</p>
              <p className="text-2xl font-semibold">{money(model.maxOffer)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-border p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Deal Intake</h2>
              <p className="text-sm text-muted-foreground">Inputs stay simple tonight; tomorrow these become Zillow, MLS, FRED, and internal model feeds.</p>
            </div>
            <Button className="gap-2">
              <Search className="h-4 w-4" /> Analyze Deal
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label>Property address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Asset class</Label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(assetLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Purchase price</Label>
              <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Market rent / month</Label>
              <Input type="number" value={marketRent} onChange={(e) => setMarketRent(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Target IRR</Label>
              <Input type="number" value={targetIrr} onChange={(e) => setTargetIrr(Number(e.target.value))} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Investment Verdict</h2>
              <p className="text-sm text-muted-foreground">Decision output a PE buyer cares about.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${verdictClass}`}>{model.verdict}</span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Recommendation</p>
              <p className="mt-1 text-sm font-medium">
                {model.verdict === "Buy"
                  ? "Deal clears the current buy box. Proceed to diligence and validate market rent comps."
                  : model.verdict === "Pass"
                  ? "Current economics do not justify the price. Pass unless seller materially reprices."
                  : `Negotiate to ${money(model.maxOffer)} or better to protect the target return.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Cap Rate" value={pct(model.capRate)} icon={Gauge} />
              <Metric label="DSCR" value={model.dscr.toFixed(2)} icon={ShieldCheck} />
              <Metric label="Cash Flow" value={money(model.cashFlow)} icon={TrendingUp} />
              <Metric label="Cash-on-Cash" value={pct(model.cashOnCash)} icon={LineChart} />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-border p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Market Comparison</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">This is the moat screen: comps, benchmarks, confidence, and pricing pressure.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Benchmark label="Market Value" value={money(model.marketValue)} sub={`${model.priceDeltaPct > 0 ? "+" : ""}${model.priceDeltaPct.toFixed(1)}% vs ask`} />
            <Benchmark label="Market Rent" value={money(marketRent)} sub="based on rental comps" />
            <Benchmark label="Market Cap" value="6.10%" sub="submarket benchmark" />
            <Benchmark label="Comp Confidence" value="78%" sub="needs MLS validation" />
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Comp</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Distance</th>
                  <th className="px-4 py-3 text-left font-medium">Rent / Price</th>
                  <th className="px-4 py-3 text-left font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((comp) => (
                  <tr key={comp.address} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{comp.address}</td>
                    <td className="px-4 py-3 text-muted-foreground">{comp.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{comp.distance}</td>
                    <td className="px-4 py-3">{comp.rent ? money(comp.rent) : `${money(comp.price)} · ${pct(comp.cap)}`}</td>
                    <td className="px-4 py-3">{comp.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Capital Stack</h2>
          </div>
          <div className="mt-5 space-y-4">
            <Field label="Down payment %" value={downPaymentPct} setValue={setDownPaymentPct} />
            <Field label="Interest rate %" value={ratePct} setValue={setRatePct} />
            <Field label="Term months" value={termMonths} setValue={setTermMonths} />
            <Field label="Vacancy %" value={vacancyPct} setValue={setVacancyPct} />
            <Field label="OPEX %" value={opexPct} setValue={setOpexPct} />
          </div>
          <div className="mt-5 rounded-xl bg-muted/40 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-medium">{money(model.loanAmount)}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Debt Service</span><span className="font-medium">{money(model.monthlyDebt)}/mo</span></div>
            <div className="mt-2 flex justify-between"><span className="text-muted-foreground">NOI</span><span className="font-medium">{money(model.annualNoi)}/yr</span></div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-border p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Scenario Matrix</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {scenarios.map((scenario) => (
              <div key={scenario.name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{scenario.name}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">IRR</p><p className="font-semibold">{pct(scenario.irr)}</p></div>
                  <div><p className="text-xs text-muted-foreground">CF</p><p className="font-semibold">{money(scenario.cashFlow)}</p></div>
                  <div><p className="text-xs text-muted-foreground">DSCR</p><p className="font-semibold">{scenario.dscr.toFixed(2)}</p></div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{scenario.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">IC Memo Preview</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <MemoLine label="Thesis" value="Acquire only if pricing supports rent comp validation and DSCR resilience." />
            <MemoLine label="Price Guidance" value={`Bid at ${money(model.maxOffer)} or below.`} />
            <MemoLine label="Primary Risk" value="Insurance and exit cap sensitivity could compress returns." />
            <MemoLine label="Next Diligence" value="Validate rent comps, insurance quote, taxes, and repair scope." />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {riskItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="rounded-2xl border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.status}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
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

function Benchmark({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
    </div>
  );
}

function MemoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
