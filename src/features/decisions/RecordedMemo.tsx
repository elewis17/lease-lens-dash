import { Skeleton } from "@/components/ui/skeleton";
import { exportDecision } from "./entries";
import { CapitalMemo } from "./CapitalMemo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { money, percent, ratio } from "@/domain/finance/format";
import { fields, initialValues } from "@/features/underwriting/draft";
import { useWorkspace } from "@/features/portfolio/useWorkspace";

export function RecordedMemo({ id }: { id: string }) {
  const { entries, pathTo } = useWorkspace();
  const entry = entries.entries.find(row => row.id === id);
  if (entries.isPending) return <div role="status" aria-label="Loading decision memo" className="space-y-4"><Skeleton className="h-10 w-4/5" /><Skeleton className="h-32 w-full" /></div>;
  if (entries.isError) return <h1 className="view-title">The decision memo could not load.</h1>;
  if (!entry || entry.payload.kind === "pipeline" || (entry.payload.kind === "capital" && entry.payload.status !== "decided")) return <h1 className="view-title">This decision memo is unavailable.</h1>;
  const { payload } = entry;

  const download = () => {
    const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(exportDecision(entry, entries.entries), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "dealstack-decision-" + entry.id + ".json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <Button variant="outline" onClick={download}>Export structured record</Button>
      <Button variant="outline" onClick={() => window.print()}>Print memo</Button>
      <Link className="text-sm underline" to={pathTo("/decisions")}>Decision Log</Link>
    </div>
  );
  if (payload.kind === "policy") return (
    <section className="space-y-4">
      <h1 className="view-title">Use {payload.strategy} thresholds for {payload.target}.</h1>
      <p>{payload.strategy} · {new Date(entry.created_at).toLocaleDateString()}</p>
      <p>{payload.reason}</p>
      <p className="text-sm text-muted-foreground">The export includes the thresholds as confirmed.</p>
      {actions}
    </section>
  );
  if (payload.kind === "capital") return <section className="space-y-4"><CapitalMemo entry={{ ...entry, payload }} />{actions}</section>;
  const { projection } = payload;
  const draft = initialValues(payload.assumptions);

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm text-muted-foreground">Decision memo · {new Date(entry.created_at).toLocaleDateString()}</p>
        <h1 className="view-title">{payload.action === "offer"
          ? `Offer ${money(payload.price)} for ${payload.title}.`
          : payload.projection.verdict === "Do not pursue" ? `Do not pursue ${payload.title}.` : `Declined ${payload.title}.`}</h1>
      </header>
      <Card className="space-y-4 p-4">
        <h2 className="text-xl font-semibold">{payload.action === "offer" ? "Offer recorded at " + money(payload.price) : "Price reviewed · " + money(payload.price)}</h2>
        <p className="whitespace-pre-wrap break-words text-sm">{payload.reason}</p>
        {payload.evidenceUrl && <a className="text-sm underline" href={payload.evidenceUrl} target="_blank" rel="noreferrer">Open decision evidence</a>}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["DSCR · Estimate", ratio(projection.dscr)], ["Modelled IRR · Estimate", percent(projection.irr)],
            ["Monthly cash flow · Estimate", money(projection.cashFlow)], ["Max offer · Estimate", money(projection.maxOffer)],
            ["Walk-away · Estimate", money(projection.walkAway)], ["Actual outcome", "Pending"],
          ].filter(([, value]) => value !== "—").map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">Frozen assumptions</h2>
        <p className="text-sm text-muted-foreground">
          Buy gates were {ratio(projection.buyDscr)} DSCR and {percent(projection.buyIrr)} modelled IRR. The lender floor was {ratio(projection.lenderDscr)}.
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {fields.map(({ key, label }) => <div key={key}><dt className="text-muted-foreground">{label}</dt><dd>{draft[key]}</dd></div>)}
        </dl>
      </Card>
      {actions}
    </section>
  );
}
