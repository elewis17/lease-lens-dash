import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CircleDollarSign,
  Gauge,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type PortfolioCommandCenterProps = {
  properties?: any[];
  leases?: any[];
  mortgages?: any[];
  metrics?: any;
};

const sampleAssets = [
  {
    name: "Amazon Data Center Warehouse",
    strategy: "Hold + Refi",
    irr: 13.8,
    cashFlow: 8900,
    dscr: 1.42,
    equity: 315000,
    action: "Refinance to release trapped equity for next acquisition.",
    score: 86,
  },
  {
    name: "Cabbage Town Duplex",
    strategy: "Optimize",
    irr: 8.4,
    cashFlow: 420,
    dscr: 1.08,
    equity: 122000,
    action: "Raise rents or improve debt terms before adding capital.",
    score: 61,
  },
  {
    name: "Bagel Bros Commercial",
    strategy: "Review / Sell",
    irr: 6.1,
    cashFlow: 1100,
    dscr: 1.12,
    equity: 248000,
    action: "Low return on equity. Consider sale if proceeds can redeploy above 12% IRR.",
    score: 49,
  },
];

const money = (value: number) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const shortMoney = (value: number) => {
  if (!Number.isFinite(value)) return "$0";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return money(value);
};

const PortfolioCommandCenter = ({
  properties = [],
  leases = [],
  mortgages = [],
  metrics = {},
}: PortfolioCommandCenterProps) => {
  const hasRealProperties = properties.length > 0;

  const portfolioValue = hasRealProperties
    ? properties.reduce(
        (sum, p) => sum + Number(p?.sale_price ?? p?.purchase_price ?? p?.property_value ?? 0),
        0
      )
    : 1_800_000;

  const monthlyCashFlow = Number(metrics?.cashFlow ?? 10_400);
  const avgDscr = Number(metrics?.dcr ?? 1.28);
  const avgCapRate = Number(metrics?.capRate ?? 8);

  const debtByProperty = mortgages.reduce((map: Record<string, number>, m: any) => {
    const propertyId = m?.property_id;
    if (!propertyId) return map;
    map[propertyId] = (map[propertyId] ?? 0) + Number(m?.monthly_payment ?? 0);
    return map;
  }, {});

  const rentByProperty = leases.reduce((map: Record<string, number>, lease: any) => {
    const propertyId = lease?.property_id;
    if (!propertyId) return map;
    map[propertyId] = (map[propertyId] ?? 0) + Number(lease?.monthlyRent ?? lease?.monthly_rent ?? 0);
    return map;
  }, {});

  const realAssets = properties.map((property) => {
    const value = Number(property?.sale_price ?? property?.purchase_price ?? property?.property_value ?? 0);
    const rent = Number(rentByProperty[property.id] ?? 0);
    const debt = Number(debtByProperty[property.id] ?? 0);
    const mgmt = rent * (Number(property?.mgmt_pct ?? 0) / 100);
    const maintenance = rent * (Number(property?.maintenance_pct ?? 0) / 100);
    const taxes = Number(property?.property_taxes ?? 0);
    const insurance = Number(property?.insurance ?? 0);
    const cashFlow = rent - mgmt - maintenance - taxes - insurance - debt;
    const estimatedNoi = rent - mgmt - maintenance - taxes - insurance;
    const dscr = debt > 0 ? estimatedNoi / debt : 1.5;
    const irr = value > 0 ? Math.max(4, Math.min(16, (cashFlow * 12 / value) * 100 + 8)) : avgCapRate;
    const equity = Math.max(value * 0.35, 0);
    const score = Math.max(30, Math.min(95, Math.round(irr * 5 + dscr * 15)));

    let strategy = "Hold";
    let action = "Stable asset. Continue monitoring cash flow, debt coverage, and rent upside.";

    if (dscr < 1.1 || cashFlow < 0) {
      strategy = "Review / Sell";
      action = "Weak coverage. Review pricing, debt terms, rent upside, or sale/redeployment options.";
    } else if (dscr < 1.25 || irr < 9) {
      strategy = "Optimize";
      action = "Improve rents, expenses, or debt terms before allocating more capital.";
    } else if (equity > 100_000 && dscr >= 1.25) {
      strategy = "Hold + Refi";
      action = "Strong coverage. Evaluate refinance to release trapped equity for the next acquisition.";
    }

    return {
      name: property?.alias ?? property?.address ?? "Property",
      strategy,
      irr,
      cashFlow,
      dscr,
      equity,
      action,
      score,
    };
  });

  const assets = hasRealProperties ? realAssets : sampleAssets;
  const bestAsset = [...assets].sort((a, b) => b.score - a.score)[0];
  const weakestAsset = [...assets].sort((a, b) => a.score - b.score)[0];
  const trappedEquity = assets.reduce((sum, asset) => sum + Number(asset.equity ?? 0), 0);


  const highestEquityAsset = [...assets].sort((a, b) => Number(b.equity ?? 0) - Number(a.equity ?? 0))[0];
  const bestRentUpsideAsset = [...assets].sort((a, b) => Number(a.cashFlow ?? 0) - Number(b.cashFlow ?? 0))[0];
  const acquisitionBudgetSignal = Math.max(monthlyCashFlow * 12 * 4, 0);

  const allocationOptions = hasRealProperties
    ? [
        {
          title: bestRentUpsideAsset ? `Optimize ${bestRentUpsideAsset.name}` : "Optimize weakest asset",
          capital: "Model required",
          impact:
            bestRentUpsideAsset && bestRentUpsideAsset.cashFlow < 0
              ? `Fix ${money(Math.abs(bestRentUpsideAsset.cashFlow))}/mo drag`
              : bestRentUpsideAsset
              ? `Improve cash flow from ${money(bestRentUpsideAsset.cashFlow)}/mo`
              : "Improve rent, expenses, or debt terms",
          returnProfile:
            bestRentUpsideAsset?.dscr < 1.25
              ? "Raise DSCR above 1.25x"
              : "Best operational upside",
          verdict: "Best first dollar",
        },
        {
          title: highestEquityAsset ? `Refi / sale review: ${highestEquityAsset.name}` : "Refi / sale review",
          capital: "$0 new cash",
          impact:
            highestEquityAsset?.equity > 0
              ? `Review ${shortMoney(highestEquityAsset.equity)} equity`
              : "Add debt/value data",
          returnProfile:
            highestEquityAsset?.dscr >= 1.25
              ? `Coverage ${highestEquityAsset.dscr.toFixed(2)}x supports review`
              : "Confirm DSCR before refi",
          verdict: "Best liquidity move",
        },
        {
          title: "Acquire next deal",
          capital:
            acquisitionBudgetSignal > 0
              ? `${shortMoney(acquisitionBudgetSignal)} buying-power signal`
              : "Needs capital source",
          impact:
            monthlyCashFlow > 0
              ? `${shortMoney(monthlyCashFlow)}/mo portfolio cash flow base`
              : "Portfolio cash flow is not ready yet",
          returnProfile:
            avgDscr >= 1.25
              ? "Portfolio can support growth review"
              : "Improve DSCR before scaling",
          verdict: "Growth option",
        },
      ]
    : [
        {
          title: "Renovate Duplex Unit B",
          capital: "$25K",
          impact: "+$650/mo rent",
          returnProfile: "31% cash-on-cash",
          verdict: "Best first dollar",
        },
        {
          title: "Refinance Warehouse",
          capital: "$0 new cash",
          impact: "+$145K liquidity",
          returnProfile: "Keeps DSCR above 1.25x",
          verdict: "Best liquidity move",
        },
        {
          title: "Buy New Small Multifamily",
          capital: "$180K",
          impact: "+$2.4K/mo cash flow",
          returnProfile: "11.7% projected IRR",
          verdict: "Near buy-box target",
        },
      ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              PE Portfolio Command Center
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Portfolio Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              Rank assets, surface trapped equity, and decide where the next dollar should go.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 min-w-[360px]">
            <div>
              <p className="text-xs text-white/60">Portfolio Value</p>
              <p className="text-2xl font-semibold">{shortMoney(portfolioValue)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Monthly Cash Flow</p>
              <p className="text-2xl font-semibold">{shortMoney(monthlyCashFlow)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Avg DSCR</p>
              <p className="text-2xl font-semibold">{avgDscr.toFixed(2)}x</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Best Asset</p>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-xl font-semibold">{bestAsset?.name ?? "No assets"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Highest risk-adjusted return.</p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Weakest Asset</p>
            <ArrowDownRight className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-xl font-semibold">{weakestAsset?.name ?? "No assets"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Lowest return / coverage score.</p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Trapped Equity</p>
            <CircleDollarSign className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-xl font-semibold">{shortMoney(trappedEquity)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Equity available for refi/sale review.</p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Recommended Move</p>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-xl font-semibold">
            {weakestAsset?.strategy === "Review / Sell" ? "Review weakest asset" : "Optimize first"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Best next action based on current data.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Asset Ranking</h2>
              <p className="text-sm text-muted-foreground">A PE-style view of which assets to hold, improve, refinance, or sell.</p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Decision stack</div>
          </div>

          <div className="mt-6 space-y-3">
            {assets.map((asset) => (
              <div key={asset.name} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <p className="font-semibold truncate">{asset.name}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{asset.action}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm min-w-[420px]">
                    <div>
                      <p className="text-muted-foreground text-xs">IRR</p>
                      <p className="font-semibold">{asset.irr.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Cash Flow</p>
                      <p className="font-semibold">{money(asset.cashFlow)}/mo</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">DSCR</p>
                      <p className="font-semibold">{asset.dscr.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Equity</p>
                      <p className="font-semibold">{shortMoney(asset.equity)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${asset.score}%` }} />
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{asset.strategy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold">Capital Allocation</h2>
          <p className="text-sm text-muted-foreground">Compares what to do with the next available dollar.</p>

          <div className="mt-6 space-y-3">
            {allocationOptions.map((option, index) => (
              <div key={option.title} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{option.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Capital required: {option.capital}</p>
                  </div>
                  <span className={["rounded-full px-2.5 py-1 text-xs font-medium", index === 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"].join(" ")}>{option.verdict}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Impact</p>
                    <p className="font-semibold">{option.impact}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Return</p>
                    <p className="font-semibold">{option.returnProfile}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Risk Watchlist</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {avgDscr < 1.25
              ? "Portfolio DSCR is below the 1.25x safety threshold. Review debt terms, rents, and expense exposure."
              : "Portfolio coverage is currently above the 1.25x safety threshold. Continue monitoring rent, vacancy, and insurance risk."}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Liquidity Opportunity</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {trappedEquity > 0
              ? `${shortMoney(trappedEquity)} of estimated equity should be reviewed for refinance, sale, or redeployment.`
              : "Add property value and debt data to estimate trapped equity and refinance potential."}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Next Model Hook</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Wire this page deeper into property-level NOI, ROE, refinance, renovation, and sale scenario calculations.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PortfolioCommandCenter;
