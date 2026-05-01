import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  DollarSign,
  FileText,
  Home,
  Info,
  LineChart,
  Percent,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

type PortfolioSnapshotProps = {
  properties?: any[];
  leases?: any[];
  mortgages?: any[];
  metrics?: any;
};

type ExplanationItem = {
  label: string;
  text: string;
};

const money = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : "-";

const shortMoney = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return money(value);
};

const pct = (value: number) => (Number.isFinite(value) ? `${value.toFixed(2)}%` : "-");
const num = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : "-");

const demoProperties = [
  { id: "1", alias: "Amazon Warehouse", sale_price: 700000, vacancy_pct: 5 },
  { id: "2", alias: "Cabbage Town Duplex", sale_price: 450000, vacancy_pct: 5 },
  { id: "3", alias: "Bagel Bros", sale_price: 650000, vacancy_pct: 5 },
];

const demoMetrics = {
  cashFlow: 1540,
  capRate: 14.31,
  irr10Year: 3.76,
  cashOnCash: 1.03,
  dcr: 1.08,
  noi: 21468,
  expectedRent: 33300,
  occupancyRate: 100,
  activeLeases: 3,
  totalUnits: 3,
};

const metricExplanations: Record<string, ExplanationItem[]> = {
  cashFlow: [
    {
      label: "What it measures",
      text: "Monthly cash left after operating expenses and debt service. This is the number that tells you whether the asset supports itself today.",
    },
    {
      label: "Why this matters",
      text: "Positive cash flow creates flexibility. Negative cash flow means the investor has to feed the deal or rely on appreciation, refinancing, or a future exit to make the return work.",
    },
    {
      label: "How to improve it",
      text: "Increase rent, reduce operating expenses, reduce vacancy, refinance debt, or pay down enough principal to lower debt pressure.",
    },
  ],
  capRate: [
    {
      label: "Formula",
      text: "Cap Rate = Annual NOI divided by property value.",
    },
    {
      label: "What it measures",
      text: "The income efficiency of the asset before financing. It shows how much operating income the property produces relative to its value.",
    },
    {
      label: "Why this matters",
      text: "Cap rate helps compare properties without letting the loan structure hide the asset quality. A low cap rate may be acceptable in a premium market, but it needs a stronger appreciation or exit story.",
    },
    {
      label: "How to improve it",
      text: "Raise NOI through rent growth, better expense control, lower vacancy, or buying the asset below market value.",
    },
  ],
  irr: [
    {
      label: "Formula",
      text: "IRR is the discount rate where the 10-year cash flows plus exit proceeds equal the original investment.",
    },
    {
      label: "What it measures",
      text: "Total return including cash flow, equity growth, loan paydown, appreciation, and exit value.",
    },
    {
      label: "Why this matters",
      text: "IRR prevents you from judging a deal only by today’s cash flow. It shows whether the full hold period justifies tying up capital.",
    },
    {
      label: "How to improve it",
      text: "Buy better, force appreciation, improve operations, accelerate principal paydown, or time the exit when valuation supports a stronger return.",
    },
  ],
  cashOnCash: [
    {
      label: "Formula",
      text: "Cash-on-Cash = Annual cash flow divided by cash invested.",
    },
    {
      label: "What it measures",
      text: "The cash return on the investor’s actual cash tied up in the deal.",
    },
    {
      label: "Why this matters",
      text: "It tells you whether the property is rewarding your cash today. It is especially useful when comparing income-focused deals or different financing structures.",
    },
    {
      label: "How to improve it",
      text: "Improve monthly cash flow, reduce upfront cash required, refinance into better terms, or stabilize vacancy and rent collection.",
    },
  ],
  dcr: [
    {
      label: "Formula",
      text: "DSCR = Annual NOI divided by annual debt service.",
    },
    {
      label: "What it measures",
      text: "The ability to survive debt stress. It shows whether the property’s income can cover its loan payments with a safety margin.",
    },
    {
      label: "Why this matters",
      text: "A property can look profitable but still be fragile if debt coverage is thin. DSCR is one of the clearest signals of financing risk.",
    },
    {
      label: "How to improve it",
      text: "Increase NOI, refinance into lower payments, extend amortization, pay down debt, or delay equity extraction until the coverage ratio improves.",
    },
  ],
  noi: [
    {
      label: "Formula",
      text: "NOI = rental income minus operating expenses. Debt service is excluded.",
    },
    {
      label: "What it measures",
      text: "The property’s operating engine before financing decisions.",
    },
    {
      label: "Why this matters",
      text: "NOI drives valuation, cap rate, lender comfort, refinance capacity, and long-term asset quality.",
    },
  ],
  occupancy: [
    {
      label: "What it measures",
      text: "How much of the property or portfolio is filled based on active lease and unit data.",
    },
    {
      label: "Why this matters",
      text: "Occupancy pressure can turn a good-looking deal into a cash drain quickly because debt and fixed expenses continue even when rent drops.",
    },
  ],
  equity: [
    {
      label: "What it measures",
      text: "Estimated property value minus known mortgage balances.",
    },
    {
      label: "Why this matters",
      text: "Equity is only useful if the asset can support the debt after extraction. This page separates visible equity from usable equity.",
    },
  ],
};

const InfoModal = ({
  title,
  intro,
  items,
}: {
  title: string;
  intro?: string;
  items: ExplanationItem[];
}) => (
  <details className="relative inline-flex">
    <summary
      className="list-none inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
      aria-label={`About ${title}`}
      title={`About ${title}`}
    >
      <Info className="h-3.5 w-3.5" />
    </summary>

    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/20"
        onClick={(e) => {
          const d = e.currentTarget.closest("details") as HTMLDetailsElement | null;
          if (d) d.open = false;
        }}
      />
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/10 text-[13px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {intro && <p className="mt-1 text-xs text-gray-500 leading-relaxed">{intro}</p>}
          </div>
          <button
            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-700"
            aria-label="Close"
            onClick={(e) => {
              const d = e.currentTarget.closest("details") as HTMLDetailsElement | null;
              if (d) d.open = false;
            }}
          >
            ✕
          </button>
        </div>

        <ul className="mt-3 space-y-2 text-gray-700">
          {items.map((item) => (
            <li key={item.label} className="rounded-lg bg-gray-50 px-3 py-2">
              <span className="font-semibold text-gray-900">{item.label}:</span>{" "}
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </details>
);

const InfoTip = ({ text }: { text: string }) => (
  <span
    title={text}
    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground cursor-help"
  >
    <Info className="h-3.5 w-3.5" />
  </span>
);

const MetricTile = ({
  title,
  value,
  subtitle,
  icon: Icon,
  explanationTitle,
  explanationIntro,
  explanationItems,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  explanationTitle: string;
  explanationIntro?: string;
  explanationItems: ExplanationItem[];
  tone?: "default" | "good" | "warn";
}) => {
  const toneClass =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700"
      : "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <span>{title}</span>
            <InfoModal
              title={explanationTitle}
              intro={explanationIntro}
              items={explanationItems}
            />
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

const PortfolioSnapshot = ({
  properties = [],
  leases = [],
  mortgages = [],
  metrics = {},
}: PortfolioSnapshotProps) => {
  const hasRealData = properties.length > 0;
  const portfolioProperties = hasRealData ? properties : demoProperties;
  const m = { ...demoMetrics, ...metrics };

  const portfolioValue = portfolioProperties.reduce(
    (sum, p) => sum + Number(p.sale_price ?? p.purchase_price ?? p.property_value ?? 0),
    0
  );

  const monthlyCashFlow = Number(m.cashFlow ?? 0);
  const annualCashFlow = monthlyCashFlow * 12;
  const dcr = Number(m.dcr ?? 0);
  const capRate = Number(m.capRate ?? 0);
  const irr = Number(m.irr10Year ?? 0);
  const cashOnCash = Number(m.cashOnCash ?? 0);
  const noiMonthly = Number(m.noi ?? 0);
  const expectedRent = Number(m.expectedRent ?? 0);
  const occupancyRate = Number(m.occupancyRate ?? 0);
  const activeLeases = Number(m.activeLeases ?? leases.length ?? 0);
  const totalUnits = Number(m.totalUnits ?? portfolioProperties.length ?? 0);

  const totalDebtService = mortgages.reduce((sum, mtg) => sum + Number(mtg.monthly_payment ?? 0), 0);
  const debtHealth = dcr >= 1.25 ? "Healthy" : dcr >= 1.05 ? "Watch" : "Pressure";
  const debtTone = dcr >= 1.25 ? "good" : "warn";

  const knownDebtBalance = mortgages.reduce(
    (sum, mtg) =>
      sum + Number(mtg.current_balance ?? mtg.principal ?? mtg.principal_original ?? 0),
    0
  );

  const estimatedEquity = Math.max(portfolioValue - knownDebtBalance, 0);

  const refiCapacity =
    dcr >= 1.25 && estimatedEquity > 0
      ? estimatedEquity * 0.35
      : dcr >= 1.05 && estimatedEquity > 0
      ? estimatedEquity * 0.15
      : 0;

  const dataConfidence =
    properties.length > 0 && leases.length > 0 && mortgages.length > 0
      ? "High"
      : properties.length > 0 && (leases.length > 0 || mortgages.length > 0)
      ? "Medium"
      : "Demo";

  const verdict = (() => {
    const marginBase = totalDebtService > 0 ? totalDebtService : Math.max(noiMonthly, 1);
    const marginPct = marginBase > 0 ? (monthlyCashFlow / marginBase) * 100 : 0;

    if (monthlyCashFlow < 0 && dcr < 1) {
      return {
        label: "DISTRESS / HIGH RISK",
        tone: "bg-rose-50 text-rose-700",
        text: `Negative monthly cash flow with DSCR at ${num(dcr)}x. Protect liquidity before extracting equity.`,
      };
    }

    if (irr < 6 && dcr < 1.05 && marginPct < 5) {
      return {
        label: "SELL / REPOSITION",
        tone: "bg-rose-50 text-rose-700",
        text: `Low long-term return signal with thin coverage. Compare this asset against stronger uses of capital.`,
      };
    }

    if (dcr >= 1.3 && marginPct >= 15 && totalDebtService > 0) {
      return {
        label: "REFINANCE SCREEN",
        tone: "bg-emerald-50 text-emerald-700",
        text: `Coverage and cash-flow buffer are strong enough to review debt optimization or trapped equity.`,
      };
    }

    if (dcr >= 1.2 && monthlyCashFlow > 0 && irr >= 8) {
      return {
        label: "HOLD",
        tone: "bg-emerald-50 text-emerald-700",
        text: `Stable hold profile with positive cash flow, acceptable debt coverage, and return support.`,
      };
    }

    return {
      label: "HOLD + OPTIMIZE",
      tone: "bg-amber-50 text-amber-800",
      text: `The portfolio is operating, but returns or coverage need improvement before a more aggressive move.`,
    };
  })();

  const riskFlags = [
    {
      title: dcr < 1.25 ? "Debt coverage needs attention" : "Debt coverage is stable",
      detail:
        dcr < 1.25
          ? `DSCR is ${num(dcr)}x. Underwriting should protect against rate, vacancy, or expense pressure.`
          : `DSCR is ${num(dcr)}x. Portfolio appears to cover debt service with room to monitor.`,
      why: "Debt coverage decides how much stress the portfolio can absorb before owner cash is required.",
      tone: dcr < 1.25 ? "warn" : "good",
    },
    {
      title: monthlyCashFlow < 0 ? "Negative cash flow" : "Positive monthly cash flow",
      detail:
        monthlyCashFlow < 0
          ? `${money(monthlyCashFlow)} per month. Review debt terms, rents, and operating expenses.`
          : `${money(monthlyCashFlow)} per month after debt service based on current inputs.`,
      why: "Cash flow is the clearest signal of whether the portfolio funds itself or consumes liquidity.",
      tone: monthlyCashFlow < 0 ? "warn" : "good",
    },
    {
      title: occupancyRate < 95 ? "Vacancy sensitivity" : "Occupancy looks strong",
      detail:
        occupancyRate < 95
          ? `${occupancyRate.toFixed(1)}% occupancy. Review lease roll and vacancy assumptions.`
          : `${occupancyRate.toFixed(1)}% occupancy based on active lease and unit data.`,
      why: "Vacancy can quietly break a deal because fixed expenses and debt continue while income drops.",
      tone: occupancyRate < 95 ? "warn" : "good",
    },
  ];

  const takeaways = [
    {
      label: "Portfolio health",
      value: dcr >= 1.25 && monthlyCashFlow > 0 ? "Stable" : "Monitor",
      text:
        dcr >= 1.25 && monthlyCashFlow > 0
          ? "Portfolio is producing positive cash flow with acceptable debt coverage."
          : "Portfolio needs review before aggressive growth or equity extraction.",
      why: "This summarizes whether you can confidently hold, optimize, refinance, or pause new moves.",
    },
    {
      label: "Equity visibility",
      value: shortMoney(estimatedEquity),
      text: "Estimated equity available before lender haircuts, taxes, transaction costs, and reserves.",
      why: "Equity only matters if it can be converted into usable capital without weakening the asset.",
    },
    {
      label: "Next review",
      value: refiCapacity > 0 ? "Refi screen" : "Operations",
      text:
        refiCapacity > 0
          ? `Potential refi capacity signal of ${shortMoney(refiCapacity)} while preserving coverage.`
          : "Improve cash flow or DSCR before relying on trapped equity.",
      why: "The next screen tells you whether the highest-value action is debt strategy or operating improvement.",
    },
  ];

  const decisionInputs = [
    {
      icon: Building2,
      label: `${portfolioProperties.length} properties`,
      cue: "used in snapshot",
      detail: "Property value, type, and operating assumptions feed the portfolio read.",
    },
    {
      icon: Home,
      label: `${leases.length || activeLeases} leases`,
      cue: "supports rent and occupancy",
      detail: "Lease data drives contracted rent, occupancy, and current income quality.",
    },
    {
      icon: ShieldCheck,
      label: `${mortgages.length} mortgages`,
      cue: "feeds debt stress",
      detail: "Mortgage payments and balances drive DSCR, cash flow, and equity visibility.",
    },
    {
      icon: FileText,
      label: `Confidence: ${dataConfidence}`,
      cue: "feeds memo",
      detail: "Confidence improves as properties, leases, mortgages, and expenses are all populated.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-[1.75rem] bg-slate-950 text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5" />
              Portfolio Snapshot
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Portfolio Snapshot</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              A fast investor-read of performance, risk, equity, and operating health before you move into decisions.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${verdict.tone}`}>
                Verdict: {verdict.label}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                Confidence: {dataConfidence}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-300">{verdict.text}</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 grid grid-cols-3 gap-5 min-w-[320px]">
            <div>
              <p className="text-xs text-slate-300">Portfolio Value</p>
              <p className="mt-1 text-2xl font-bold">{shortMoney(portfolioValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Cash Flow</p>
              <p className="mt-1 text-2xl font-bold">{money(monthlyCashFlow)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">DSCR</p>
              <p className="mt-1 text-2xl font-bold">{num(dcr)}x</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricTile
          title="Monthly Cash Flow"
          value={money(monthlyCashFlow)}
          subtitle="Surplus after debt service"
          icon={DollarSign}
          explanationTitle="Monthly Cash Flow"
          explanationItems={metricExplanations.cashFlow}
          tone={monthlyCashFlow >= 0 ? "good" : "warn"}
        />
        <MetricTile
          title="Cap Rate"
          value={pct(capRate)}
          subtitle="Income efficiency of asset"
          icon={Percent}
          explanationTitle="Cap Rate"
          explanationItems={metricExplanations.capRate}
        />
        <MetricTile
          title="10-Year IRR"
          value={pct(irr)}
          subtitle="Total return including exit"
          icon={LineChart}
          explanationTitle="10-Year IRR"
          explanationItems={metricExplanations.irr}
        />
        <MetricTile
          title="Cash-on-Cash"
          value={pct(cashOnCash)}
          subtitle="Return on invested cash"
          icon={Wallet}
          explanationTitle="Cash-on-Cash Return"
          explanationItems={metricExplanations.cashOnCash}
          tone={cashOnCash >= 8 ? "good" : "warn"}
        />
        <MetricTile
          title="Debt Coverage"
          value={`${num(dcr)}x`}
          subtitle={`${debtHealth} coverage`}
          icon={ShieldCheck}
          explanationTitle="Debt Coverage Ratio (DSCR)"
          explanationItems={metricExplanations.dcr}
          tone={debtTone}
        />
      </section>

      {/* Data-to-decision strip */}
      <section className="rounded-2xl bg-card p-5 shadow-sm border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Database signals feeding this snapshot</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              This page updates from the same property, lease, and mortgage data used across the system.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            decision-ready context
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {decisionInputs.map((input) => {
            const Icon = input.icon;
            return (
              <div key={input.label} className="rounded-xl bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{input.label}</p>
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground border border-border">
                        {input.cue}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{input.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main body */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Investor Takeaway */}
        <div className="xl:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Investor Takeaway</h2>
              <p className="text-sm text-muted-foreground">
                Clear read of what is happening before you decide what to do.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              Health check
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {takeaways.map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Why this matters:</span> {item.why}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Model read</p>
                  <InfoModal
                    title="How the model read is determined"
                    intro="This is still deterministic, not magic. It reads the data you already loaded."
                    items={[
                      {
                        label: "Inputs used",
                        text: "Cash flow, DSCR, 10-year IRR, lease activity, mortgage payments, property value, and estimated equity.",
                      },
                      {
                        label: "Why this matters",
                        text: "The snapshot should explain the current condition before Portfolio Decisions ranks actions or Deal Underwriting analyzes a new purchase.",
                      },
                      {
                        label: "Confidence",
                        text: "Confidence improves when property, lease, mortgage, and expense data are all present for the selected scope.",
                      },
                    ]}
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  This page does not make the final decision. It explains the current portfolio condition.
                  Use Portfolio Decisions for asset ranking and capital allocation, and Deal Underwriting for new acquisitions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk panel */}
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Risk Watch</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Short explanations of the main portfolio health signals.
          </p>

          <div className="mt-5 space-y-3">
            {riskFlags.map((risk) => (
              <div key={risk.title} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{risk.title}</p>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      risk.tone === "good"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {risk.tone === "good" ? "OK" : "Watch"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{risk.detail}</p>
                <p className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Why this matters:</span> {risk.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operating + Equity */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold">Operating Reality</h2>
          <p className="text-sm text-muted-foreground">
            The simple income statement view investors should understand first.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Contracted Rent
                <InfoModal title="Contracted Monthly Rent" items={[
                  { label: "What it measures", text: "Total monthly rent expected from current leases before operating expenses." },
                  { label: "Why this matters", text: "It is the revenue base every NOI, DSCR, and cash-flow decision depends on." },
                ]} />
              </div>
              <p className="mt-2 text-2xl font-semibold">{money(expectedRent)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Top-line rent feeding NOI and coverage.</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Monthly NOI
                <InfoModal title="Monthly NOI" items={metricExplanations.noi} />
              </div>
              <p className="mt-2 text-2xl font-semibold">{money(noiMonthly)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Operating engine before debt service.</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Debt Service <InfoTip text="Total monthly mortgage payments loaded for the portfolio." />
              </div>
              <p className="mt-2 text-2xl font-semibold">{money(totalDebtService)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Fixed monthly loan pressure.</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Occupancy
                <InfoModal title="Occupancy Rate" items={metricExplanations.occupancy} />
              </div>
              <p className="mt-2 text-2xl font-semibold">{occupancyRate.toFixed(1)}%</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {activeLeases} active leases across {totalUnits || "-"} units.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold">Equity Visibility</h2>
          <p className="text-sm text-muted-foreground">
            Shows whether equity is available, trapped, or should stay protected.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Estimated Equity
                <InfoModal title="Estimated Equity" items={metricExplanations.equity} />
              </div>
              <p className="mt-2 text-3xl font-semibold">{shortMoney(estimatedEquity)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Portfolio value minus known mortgage balances, before costs and reserves.
              </p>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium">Refi capacity signal</p>
                    <InfoTip text="Directional amount that may be explored after preserving debt coverage. Not a lender quote." />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Directional amount that could be explored without treating the full equity balance as usable cash.
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Why this matters:</span> It prevents the app from implying that all visible equity should be pulled out.
                  </p>
                </div>
                <p className="text-2xl font-semibold">{shortMoney(refiCapacity)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="font-medium">Next best screen</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Move to Portfolio Decisions when you are ready to rank actions.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PortfolioSnapshot;
