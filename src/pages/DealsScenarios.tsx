import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AssetClass = "sfr" | "multifamily" | "apartment" | "commercial";

const DEFAULT_MARKET_RATE_PCT = 6.75; // directional placeholder
const num = (v: any) => (v === "" || v === null || v === undefined ? 0 : Number(v));
const money0 = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—");
const money2 = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—");
const pct2 = (n: number) => (Number.isFinite(n) ? `${n.toFixed(2)}%` : "—");

const calcMonthlyPI = (principal: number, annualRatePct: number, months: number) => {
  if (!principal || !annualRatePct || !months) return 0;
  const r = (annualRatePct / 100) / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

type MarketData = {
  inferredAssetClass: AssetClass;
  estPrice: number;
  estRentMonthly: number; // for SFR
  estUnits: number; // for MF/Apt
  estRentPerUnit: number; // for MF/Apt
  estNoiAnnual: number; // for Apt/Commercial
  estTaxesAnnual: number;
  estInsuranceAnnual: number;
};

const fakeMarketLookup = (address: string): MarketData => {
  // Placeholder “smart-ish” inference from address string to make UX feel real today.
  const a = address.toLowerCase();
  const seed = Math.max(1, address.length);

  let inferredAssetClass: AssetClass = "sfr";
  if (a.includes("plaza") || a.includes("retail") || a.includes("suite") || a.includes("office")) inferredAssetClass = "commercial";
  if (a.includes("apt") || a.includes("apart") || a.includes("unit") || a.includes("#")) inferredAssetClass = "apartment";
  if (a.includes("duplex") || a.includes("triplex") || a.includes("quad") || a.includes("multi")) inferredAssetClass = "multifamily";

  const estPrice = 420000 + seed * 1500;
  const estRentMonthly = 2950 + Math.min(700, seed * 25);

  const estUnits = inferredAssetClass === "sfr" ? 1 : inferredAssetClass === "multifamily" ? Math.min(20, Math.max(2, Math.floor(seed / 6))) : Math.min(120, Math.max(20, Math.floor(seed / 4)));
  const estRentPerUnit = 1350 + Math.min(650, seed * 8);
  const estGprAnnual = estUnits * estRentPerUnit * 12;
  const estNoiAnnual = Math.round(estGprAnnual * 0.52); // directional

  return {
    inferredAssetClass,
    estPrice,
    estRentMonthly,
    estUnits,
    estRentPerUnit,
    estNoiAnnual,
    estTaxesAnnual: Math.round(estPrice * 0.009),
    estInsuranceAnnual: inferredAssetClass === "commercial" ? 4200 : 1800,
  };
};

function AssetToggle({ value, onChange }: { value: AssetClass; onChange: (v: AssetClass) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={value === "sfr" ? "default" : "outline"} onClick={() => onChange("sfr")}>
        Single Family
      </Button>
      <Button variant={value === "multifamily" ? "default" : "outline"} onClick={() => onChange("multifamily")}>
        Multifamily (2–20)
      </Button>
      <Button variant={value === "apartment" ? "default" : "outline"} onClick={() => onChange("apartment")}>
        Apartment (20+)
      </Button>
      <Button variant={value === "commercial" ? "default" : "outline"} onClick={() => onChange("commercial")}>
        Commercial (NNN)
      </Button>
    </div>
  );
}

export default function DealsScenarios() {
  const [address, setAddress] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass>("sfr");
  const [analyzed, setAnalyzed] = useState(false);
  const [market, setMarket] = useState<MarketData | null>(null);

  // Shared financing
  const [ratePct, setRatePct] = useState<number>(DEFAULT_MARKET_RATE_PCT);
  const [termMonths, setTermMonths] = useState<number>(360);
  const [downPct, setDownPct] = useState<number>(25);

  // SFR inputs
  const [purchasePrice, setPurchasePrice] = useState<number>(450000);
  const [monthlyRent, setMonthlyRent] = useState<number>(3200);
  const [vacancyPct, setVacancyPct] = useState<number>(5);
  const [opexPct, setOpexPct] = useState<number>(35);

  // MF inputs
  const [units, setUnits] = useState<number>(6);
  const [rentPerUnit, setRentPerUnit] = useState<number>(1450);
  const [mfVacancyPct, setMfVacancyPct] = useState<number>(8);
  const [mfOpexPct, setMfOpexPct] = useState<number>(45);

  // Apartment inputs (NOI-first)
  const [aptPrice, setAptPrice] = useState<number>(8500000);
  const [noiAnnual, setNoiAnnual] = useState<number>(531250); // NOI-first
  const [aptUnits, setAptUnits] = useState<number>(42);

  // Commercial inputs (NOI + lease/occupancy flavor)
  const [comPrice, setComPrice] = useState<number>(5200000);
  const [comNoiAnnual, setComNoiAnnual] = useState<number>(355000);
  const [occupancyPct, setOccupancyPct] = useState<number>(92);
  const [rentPerSqft, setRentPerSqft] = useState<number>(24);

  // Buy box per asset class
  // SFR buy box (cashflow-first)
  const [bbSfrMinCashFlow, setBbSfrMinCashFlow] = useState<number>(200);
  const [bbSfrMinDscr, setBbSfrMinDscr] = useState<number>(1.15);
  const [bbSfrMaxPrice, setBbSfrMaxPrice] = useState<number>(550000);

  // MF buy box (units + NOI/cap/dscr + price/unit)
  const [bbMfMinCap, setBbMfMinCap] = useState<number>(6.0);
  const [bbMfMinDscr, setBbMfMinDscr] = useState<number>(1.25);
  const [bbMfMinCashFlow, setBbMfMinCashFlow] = useState<number>(500);
  const [bbMfMaxPricePerUnit, setBbMfMaxPricePerUnit] = useState<number>(220000);

  // Apartment buy box (NOI/cap-first)
  const [bbAptMinCap, setBbAptMinCap] = useState<number>(6.25);
  const [bbAptMinDscr, setBbAptMinDscr] = useState<number>(1.25);
  const [bbAptMinDebtYield, setBbAptMinDebtYield] = useState<number>(8.0); // NOI / loan
  const [bbAptMaxPricePerUnit, setBbAptMaxPricePerUnit] = useState<number>(240000);

  // Commercial buy box (cap + dscr + debt yield)
  const [bbComMinCap, setBbComMinCap] = useState<number>(6.5);
  const [bbComMinDscr, setBbComMinDscr] = useState<number>(1.30);
  const [bbComMinDebtYield, setBbComMinDebtYield] = useState<number>(8.5);
  const [bbComMaxPrice, setBbComMaxPrice] = useState<number>(7000000);

  const onAnalyze = () => {
    const md = fakeMarketLookup(address.trim());
    setMarket(md);

    // Auto-fill + infer asset class (user can override via buttons)
    setAssetClass(md.inferredAssetClass);

    // Prefill by class
    setPurchasePrice(md.estPrice);
    setMonthlyRent(md.estRentMonthly);

    setUnits(md.estUnits);
    setRentPerUnit(md.estRentPerUnit);

    setAptUnits(md.estUnits);
    setAptPrice(Math.max(2500000, md.estPrice * 10)); // just to feel “bigger”
    setNoiAnnual(md.estNoiAnnual);

    setComPrice(Math.max(1500000, md.estPrice * 8));
    setComNoiAnnual(Math.round(md.estNoiAnnual * 0.9));

    setAnalyzed(true);
  };

  // ===== Calculators by asset class =====

  const sfr = useMemo(() => {
    const downPayment = num(purchasePrice) * (num(downPct) / 100);
    const loan = Math.max(0, num(purchasePrice) - downPayment);

    const effRent = num(monthlyRent) * (1 - num(vacancyPct) / 100);
    const opex = effRent * (num(opexPct) / 100);
    const noi = effRent - opex;

    const debt = calcMonthlyPI(loan, num(ratePct), num(termMonths));
    const cashFlow = noi - debt;

    const capRate = (noi * 12) / Math.max(1, num(purchasePrice)) * 100;
    const dscr = (noi * 12) / Math.max(1, debt * 12);

    const breakEvenRent = (() => {
      // Solve for rent where cashFlow = 0: effRent - opex - debt = 0; effRent*(1-opexPct)=debt
      const keep = 1 - num(opexPct) / 100;
      if (keep <= 0) return 0;
      const effNeeded = debt / keep;
      const grossNeeded = effNeeded / Math.max(0.0001, 1 - num(vacancyPct) / 100);
      return grossNeeded;
    })();

    return { downPayment, loan, effRent, opex, noi, debt, cashFlow, capRate, dscr, breakEvenRent };
  }, [purchasePrice, downPct, monthlyRent, vacancyPct, opexPct, ratePct, termMonths]);

  const mf = useMemo(() => {
    const price = num(purchasePrice); // reuse purchasePrice input for MF price to keep simple
    const downPayment = price * (num(downPct) / 100);
    const loan = Math.max(0, price - downPayment);

    const grossRent = num(units) * num(rentPerUnit);
    const effRent = grossRent * (1 - num(mfVacancyPct) / 100);

    const opex = effRent * (num(mfOpexPct) / 100);
    const noi = effRent - opex;

    const debt = calcMonthlyPI(loan, num(ratePct), num(termMonths));
    const cashFlow = noi - debt;

    const capRate = (noi * 12) / Math.max(1, price) * 100;
    const dscr = (noi * 12) / Math.max(1, debt * 12);
    const pricePerUnit = price / Math.max(1, num(units));

    return { price, downPayment, loan, grossRent, effRent, opex, noi, debt, cashFlow, capRate, dscr, pricePerUnit };
  }, [purchasePrice, downPct, units, rentPerUnit, mfVacancyPct, mfOpexPct, ratePct, termMonths]);

  const apt = useMemo(() => {
    const price = num(aptPrice);
    const downPayment = price * (num(downPct) / 100);
    const loan = Math.max(0, price - downPayment);

    const noiA = num(noiAnnual);
    const noiM = noiA / 12;

    const debt = calcMonthlyPI(loan, num(ratePct), num(termMonths));
    const cashFlow = noiM - debt;

    const capRate = (noiA / Math.max(1, price)) * 100;
    const dscr = (noiA) / Math.max(1, debt * 12);
    const pricePerUnit = price / Math.max(1, num(aptUnits));
    const debtYield = (noiA / Math.max(1, loan)) * 100;

    return { price, downPayment, loan, noiA, noiM, debt, cashFlow, capRate, dscr, pricePerUnit, debtYield };
  }, [aptPrice, noiAnnual, aptUnits, downPct, ratePct, termMonths]);

  const com = useMemo(() => {
    const price = num(comPrice);
    const downPayment = price * (num(downPct) / 100);
    const loan = Math.max(0, price - downPayment);

    const noiA = num(comNoiAnnual);
    const noiM = noiA / 12;

    const debt = calcMonthlyPI(loan, num(ratePct), num(termMonths));
    const cashFlow = noiM - debt;

    const capRate = (noiA / Math.max(1, price)) * 100;
    const dscr = (noiA) / Math.max(1, debt * 12);
    const debtYield = (noiA / Math.max(1, loan)) * 100;

    return { price, downPayment, loan, noiA, noiM, debt, cashFlow, capRate, dscr, debtYield };
  }, [comPrice, comNoiAnnual, downPct, ratePct, termMonths]);

  // ===== Verdict Engine (changes by asset class) =====

  const verdict = useMemo(() => {
    if (!analyzed) return null;

    const mk = (label: string, pass: boolean, detail: string) => ({ label, pass, detail });

    if (assetClass === "sfr") {
      const checks = [
        mk("Cash Flow", sfr.cashFlow >= bbSfrMinCashFlow, `$${money0(sfr.cashFlow)} (min $${money0(bbSfrMinCashFlow)})`),
        mk("DSCR", sfr.dscr >= bbSfrMinDscr, `${sfr.dscr.toFixed(2)} (min ${bbSfrMinDscr.toFixed(2)})`),
        mk("Price", num(purchasePrice) <= bbSfrMaxPrice, `$${money0(num(purchasePrice))} (max $${money0(bbSfrMaxPrice)})`),
      ];
      const passCount = checks.filter((c) => c.pass).length;
      const label = passCount === checks.length ? "PASS" : passCount >= 2 ? "REVIEW" : "FAIL";
      return { label, checks };
    }

    if (assetClass === "multifamily") {
      const checks = [
        mk("Cap Rate", mf.capRate >= bbMfMinCap, `${pct2(mf.capRate)} (min ${pct2(bbMfMinCap)})`),
        mk("DSCR", mf.dscr >= bbMfMinDscr, `${mf.dscr.toFixed(2)} (min ${bbMfMinDscr.toFixed(2)})`),
        mk("Cash Flow", mf.cashFlow >= bbMfMinCashFlow, `$${money0(mf.cashFlow)} (min $${money0(bbMfMinCashFlow)})`),
        mk("Price/Unit", mf.pricePerUnit <= bbMfMaxPricePerUnit, `$${money0(mf.pricePerUnit)} (max $${money0(bbMfMaxPricePerUnit)})`),
      ];
      const passCount = checks.filter((c) => c.pass).length;
      const label = passCount === checks.length ? "PASS" : passCount >= 3 ? "REVIEW" : "FAIL";
      return { label, checks };
    }

    if (assetClass === "apartment") {
      const checks = [
        mk("Cap Rate", apt.capRate >= bbAptMinCap, `${pct2(apt.capRate)} (min ${pct2(bbAptMinCap)})`),
        mk("DSCR", apt.dscr >= bbAptMinDscr, `${apt.dscr.toFixed(2)} (min ${bbAptMinDscr.toFixed(2)})`),
        mk("Debt Yield", apt.debtYield >= bbAptMinDebtYield, `${pct2(apt.debtYield)} (min ${pct2(bbAptMinDebtYield)})`),
        mk("Price/Unit", apt.pricePerUnit <= bbAptMaxPricePerUnit, `$${money0(apt.pricePerUnit)} (max $${money0(bbAptMaxPricePerUnit)})`),
      ];
      const passCount = checks.filter((c) => c.pass).length;
      const label = passCount === checks.length ? "PASS" : passCount >= 3 ? "REVIEW" : "FAIL";
      return { label, checks };
    }

    // commercial
    const checks = [
      mk("Cap Rate", com.capRate >= bbComMinCap, `${pct2(com.capRate)} (min ${pct2(bbComMinCap)})`),
      mk("DSCR", com.dscr >= bbComMinDscr, `${com.dscr.toFixed(2)} (min ${bbComMinDscr.toFixed(2)})`),
      mk("Debt Yield", com.debtYield >= bbComMinDebtYield, `${pct2(com.debtYield)} (min ${pct2(bbComMinDebtYield)})`),
      mk("Price", com.price <= bbComMaxPrice, `$${money0(com.price)} (max $${money0(bbComMaxPrice)})`),
    ];
    const passCount = checks.filter((c) => c.pass).length;
    const label = passCount === checks.length ? "PASS" : passCount >= 3 ? "REVIEW" : "FAIL";
    return { label, checks };
  }, [
    analyzed,
    assetClass,
    purchasePrice,
    sfr.cashFlow,
    sfr.dscr,
    bbSfrMinCashFlow,
    bbSfrMinDscr,
    bbSfrMaxPrice,
    mf.capRate,
    mf.dscr,
    mf.cashFlow,
    mf.pricePerUnit,
    bbMfMinCap,
    bbMfMinDscr,
    bbMfMinCashFlow,
    bbMfMaxPricePerUnit,
    apt.capRate,
    apt.dscr,
    apt.debtYield,
    apt.pricePerUnit,
    bbAptMinCap,
    bbAptMinDscr,
    bbAptMinDebtYield,
    bbAptMaxPricePerUnit,
    com.capRate,
    com.dscr,
    com.debtYield,
    com.price,
    bbComMinCap,
    bbComMinDscr,
    bbComMinDebtYield,
    bbComMaxPrice,
  ]);

  const badgeTone =
    verdict?.label === "PASS" ? "bg-emerald-50 text-emerald-700" : verdict?.label === "REVIEW" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

  // ===== Render helpers for dynamic input blocks =====

  const renderAssumptions = () => {
    // Shared financing row always present
    const Financing = (
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <div className="text-sm font-semibold mb-4">Financing</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Down %</Label>
            <Input type="number" value={downPct} onChange={(e) => setDownPct(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Rate %</Label>
            <Input type="number" step="0.01" value={ratePct} onChange={(e) => setRatePct(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Term (months)</Label>
            <Input type="number" value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value) || 0)} />
          </div>
        </div>
      </Card>
    );

    if (assetClass === "sfr") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 rounded-xl shadow-sm border-border lg:col-span-2">
            <div className="text-sm font-semibold mb-4">Assumptions (Single Family)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase price</Label>
                <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Monthly rent</Label>
                <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Vacancy %</Label>
                <Input type="number" step="0.1" value={vacancyPct} onChange={(e) => setVacancyPct(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>OPEX % (of effective rent)</Label>
                <Input type="number" step="0.1" value={opexPct} onChange={(e) => setOpexPct(Number(e.target.value) || 0)} />
              </div>
            </div>
          </Card>

          {Financing}
        </div>
      );
    }

    if (assetClass === "multifamily") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 rounded-xl shadow-sm border-border lg:col-span-2">
            <div className="text-sm font-semibold mb-4">Assumptions (Multifamily 2–20)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Purchase price</Label>
                <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Units</Label>
                <Input type="number" value={units} onChange={(e) => setUnits(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Avg rent / unit (monthly)</Label>
                <Input type="number" value={rentPerUnit} onChange={(e) => setRentPerUnit(Number(e.target.value) || 0)} />
              </div>

              <div className="space-y-2">
                <Label>Vacancy %</Label>
                <Input type="number" step="0.1" value={mfVacancyPct} onChange={(e) => setMfVacancyPct(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>OPEX % (of effective rent)</Label>
                <Input type="number" step="0.1" value={mfOpexPct} onChange={(e) => setMfOpexPct(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Gross rent (auto)</Label>
                <Input disabled value={`$${money0(num(units) * num(rentPerUnit))}/mo`} />
              </div>
            </div>
          </Card>

          {Financing}
        </div>
      );
    }

    if (assetClass === "apartment") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 rounded-xl shadow-sm border-border lg:col-span-2">
            <div className="text-sm font-semibold mb-4">Assumptions (Apartment 20+)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Purchase price</Label>
                <Input type="number" value={aptPrice} onChange={(e) => setAptPrice(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>NOI (annual)</Label>
                <Input type="number" value={noiAnnual} onChange={(e) => setNoiAnnual(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Units</Label>
                <Input type="number" value={aptUnits} onChange={(e) => setAptUnits(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <p className="text-xs text-muted-foreground">
                  Apartments are NOI-first: investors care about NOI, cap rate, DSCR, debt yield, and price/unit.
                </p>
              </div>
            </div>
          </Card>

          {Financing}
        </div>
      );
    }

    // commercial
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 rounded-xl shadow-sm border-border lg:col-span-2">
          <div className="text-sm font-semibold mb-4">Assumptions (Commercial NNN)</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Purchase price</Label>
              <Input type="number" value={comPrice} onChange={(e) => setComPrice(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>NOI (annual)</Label>
              <Input type="number" value={comNoiAnnual} onChange={(e) => setComNoiAnnual(Number(e.target.value) || 0)} />
            </div>

            <div className="space-y-2">
              <Label>Occupancy %</Label>
              <Input type="number" step="0.1" value={occupancyPct} onChange={(e) => setOccupancyPct(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Rent / sq ft</Label>
              <Input type="number" step="0.1" value={rentPerSqft} onChange={(e) => setRentPerSqft(Number(e.target.value) || 0)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Notes (later: tenant, lease end, escalations)</Label>
              <Input disabled value="Coming next" />
            </div>

            <div className="sm:col-span-4">
              <p className="text-xs text-muted-foreground">
                Commercial is cap rate + DSCR + debt yield driven; leases matter, but we’ll add those next.
              </p>
            </div>
          </div>
        </Card>

        {Financing}
      </div>
    );
  };

  const renderBuyBox = () => {
    if (assetClass === "sfr") {
      return (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="text-sm font-semibold mb-4">Buy Box (Single Family)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Min cash flow ($/mo)</Label>
              <Input type="number" value={bbSfrMinCashFlow} onChange={(e) => setBbSfrMinCashFlow(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Min DSCR</Label>
              <Input type="number" step="0.01" value={bbSfrMinDscr} onChange={(e) => setBbSfrMinDscr(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max price</Label>
              <Input type="number" value={bbSfrMaxPrice} onChange={(e) => setBbSfrMaxPrice(Number(e.target.value) || 0)} />
            </div>
          </div>
        </Card>
      );
    }

    if (assetClass === "multifamily") {
      return (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="text-sm font-semibold mb-4">Buy Box (Multifamily 2–20)</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Min cap rate %</Label>
              <Input type="number" step="0.01" value={bbMfMinCap} onChange={(e) => setBbMfMinCap(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Min DSCR</Label>
              <Input type="number" step="0.01" value={bbMfMinDscr} onChange={(e) => setBbMfMinDscr(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Min cash flow ($/mo)</Label>
              <Input type="number" value={bbMfMinCashFlow} onChange={(e) => setBbMfMinCashFlow(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max price / unit</Label>
              <Input type="number" value={bbMfMaxPricePerUnit} onChange={(e) => setBbMfMaxPricePerUnit(Number(e.target.value) || 0)} />
            </div>
          </div>
        </Card>
      );
    }

    if (assetClass === "apartment") {
      return (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="text-sm font-semibold mb-4">Buy Box (Apartment 20+)</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Min cap rate %</Label>
              <Input type="number" step="0.01" value={bbAptMinCap} onChange={(e) => setBbAptMinCap(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Min DSCR</Label>
              <Input type="number" step="0.01" value={bbAptMinDscr} onChange={(e) => setBbAptMinDscr(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Min debt yield %</Label>
              <Input type="number" step="0.01" value={bbAptMinDebtYield} onChange={(e) => setBbAptMinDebtYield(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max price / unit</Label>
              <Input type="number" value={bbAptMaxPricePerUnit} onChange={(e) => setBbAptMaxPricePerUnit(Number(e.target.value) || 0)} />
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <div className="text-sm font-semibold mb-4">Buy Box (Commercial NNN)</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Min cap rate %</Label>
            <Input type="number" step="0.01" value={bbComMinCap} onChange={(e) => setBbComMinCap(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Min DSCR</Label>
            <Input type="number" step="0.01" value={bbComMinDscr} onChange={(e) => setBbComMinDscr(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Min debt yield %</Label>
            <Input type="number" step="0.01" value={bbComMinDebtYield} onChange={(e) => setBbComMinDebtYield(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Max price</Label>
            <Input type="number" value={bbComMaxPrice} onChange={(e) => setBbComMaxPrice(Number(e.target.value) || 0)} />
          </div>
        </div>
      </Card>
    );
  };

  const renderKeyMetrics = () => {
    if (!analyzed) return null;

    if (assetClass === "sfr") {
      return (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="text-sm font-semibold mb-4">Key Metrics (Cash Flow-first)</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cash flow</span><span className="font-medium">${money0(sfr.cashFlow)}/mo</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DSCR</span><span>{sfr.dscr.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cap rate</span><span>{pct2(sfr.capRate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Break-even rent</span><span>${money0(sfr.breakEvenRent)}/mo</span></div>
            <div className="pt-2 border-t border-border flex justify-between"><span className="text-muted-foreground">Debt (P&amp;I)</span><span>${money0(sfr.debt)}/mo</span></div>
          </div>
        </Card>
      );
    }

    if (assetClass === "multifamily") {
      return (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="text-sm font-semibold mb-4">Key Metrics (Units + NOI)</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">NOI</span><span className="font-medium">${money0(mf.noi)}/mo</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cap rate</span><span>{pct2(mf.capRate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DSCR</span><span>{mf.dscr.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cash flow</span><span className="font-medium">${money0(mf.cashFlow)}/mo</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Price / unit</span><span>${money0(mf.pricePerUnit)}</span></div>
          </div>
        </Card>
      );
    }

    if (assetClass === "apartment") {
      return (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="text-sm font-semibold mb-4">Key Metrics (NOI-first)</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">NOI</span><span className="font-medium">${money0(apt.noiA)}/yr</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cap rate</span><span>{pct2(apt.capRate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DSCR</span><span>{apt.dscr.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Debt yield</span><span>{pct2(apt.debtYield)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Price / unit</span><span>${money0(apt.pricePerUnit)}</span></div>
            <div className="pt-2 border-t border-border flex justify-between"><span className="text-muted-foreground">Cash flow</span><span className="font-medium">${money0(apt.cashFlow)}/mo</span></div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <div className="text-sm font-semibold mb-4">Key Metrics (Commercial)</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">NOI</span><span className="font-medium">${money0(com.noiA)}/yr</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cap rate</span><span>{pct2(com.capRate)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">DSCR</span><span>{com.dscr.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Debt yield</span><span>{pct2(com.debtYield)}</span></div>
          <div className="pt-2 border-t border-border flex justify-between"><span className="text-muted-foreground">Cash flow</span><span className="font-medium">${money0(com.cashFlow)}/mo</span></div>
          <div className="text-xs text-muted-foreground">Occupancy: {money2(occupancyPct)}% · Rent/sf: ${money2(rentPerSqft)}</div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold leading-snug">Deals & Scenarios</h1>
        <p className="text-sm text-muted-foreground">Address → Analyze → buy box verdict, with UI that changes by asset class.</p>
      </div>

      <Card className="p-6 rounded-xl shadow-sm border-border space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          <div className="lg:col-span-2 space-y-2">
            <Label>Property address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., 321 Peachtree Way, Atlanta, GA" />
            <div className="text-xs text-muted-foreground">
              For now, we fake “market prefill.” Later we swap in Zillow/MLS.
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onAnalyze} disabled={!address} className="w-full">
              Analyze Deal
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Asset class</Label>
          <AssetToggle value={assetClass} onChange={setAssetClass} />
          {market && (
            <div className="text-xs text-muted-foreground">
              Market inference: <span className="font-medium text-foreground">{market.inferredAssetClass}</span> (you can override)
            </div>
          )}
        </div>
      </Card>

      {analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Data */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <div className="text-sm font-semibold mb-4">Market Data (placeholder)</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Est. price</span><span>${money0(market?.estPrice ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. rent</span><span>${money0(market?.estRentMonthly ?? 0)}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. units</span><span>{money0(market?.estUnits ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. rent/unit</span><span>${money0(market?.estRentPerUnit ?? 0)}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. NOI</span><span>${money0(market?.estNoiAnnual ?? 0)}/yr</span></div>
            </div>
          </Card>

          {/* Buy Box */}
          {renderBuyBox()}

          {/* Verdict */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <div className="text-sm font-semibold mb-4">Verdict</div>
            <div className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${badgeTone}`}>
              {verdict?.label ?? "—"}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {(verdict?.checks ?? []).map((c: any) => (
                <div key={c.label} className="flex justify-between gap-3">
                  <span className={c.pass ? "text-foreground" : "text-red-600"}>{c.label}</span>
                  <span className="text-muted-foreground text-right">{c.detail}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Next: “why” bullets + suggested fix (price drop / rent target / DSCR target).
            </p>
          </Card>
        </div>
      )}

      {analyzed && (
        <>
          {renderAssumptions()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderKeyMetrics()}

            <Card className="p-6 rounded-xl shadow-sm border-border lg:col-span-2">
              <div className="text-sm font-semibold mb-4">Notes (next)</div>
              <div className="text-sm text-muted-foreground">
                Next upgrades: real comps/estimates, saved buy boxes, conservative/base/optimistic scenarios, and “Required price / required rent” suggestions.
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}