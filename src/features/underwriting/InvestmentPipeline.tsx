import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { money, percent, ratio } from "@/domain/finance/format";
import { currentDeals, entrySchema, freezeAcquisition, modelComparison, type EntryPayload } from "@/features/decisions/entries";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { initialValues } from "./draft";

type Deal = ReturnType<typeof currentDeals>[number];
type Editor = { mode: "save" | "offer" | "pass"; deal?: Deal };

export function InvestmentPipeline() {
  const { entries, dealAssumptions, pathTo, draft, openDeal, activeDealId, policyFor } = useWorkspace();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [comparison, setComparison] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deals = currentDeals(entries.entries);
  const active = deals.find(deal => deal.payload.dealId === activeDealId);
  const activeMatchesDraft = !!(active && dealAssumptions && active.payload.propertyType === draft.propertyType &&
    Object.entries(active.payload.assumptions).every(([key, value]) => dealAssumptions[key as keyof typeof dealAssumptions] === value));
  const activePrice = activeMatchesDraft && active
    ? modelComparison(active.payload.assumptions, policyFor(active.payload.propertyType)).price : null;
  const canSave = Boolean(dealAssumptions) && !entries.isError && !entries.isPending;

  const start = (next: Editor) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setError(null);
    setEditor(next);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !editor) return;
    const fields = new FormData(event.currentTarget);
    const result = editor.mode === "save"
      ? entrySchema.safeParse({
          kind: "pipeline", dealId: editor.deal?.payload.dealId ?? crypto.randomUUID(),
          title: fields.get("title"), assumptions: dealAssumptions, propertyType: draft.propertyType,
        }) : null;
    const payload: EntryPayload | null = result?.success ? result.data
      : editor.mode === "save" || !editor.deal ? null
        : freezeAcquisition(editor.deal.payload, editor.mode, String(fields.get("reason") ?? ""), policyFor(editor.deal.payload.propertyType), String(fields.get("evidenceUrl") ?? "").trim() || undefined);
    if (!payload) {
      setError(editor.mode === "save" ? "Enter a deal name and valid underwriting assumptions." : "Enter the reason and verify the deal’s inputs.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await entries.append(payload);
      if (payload.kind === "pipeline") openDeal(payload.dealId, draft);
      setEditor(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The entry could not be saved.");
    } finally {
      setPending(false);
    }
  };

  const selected = deals.filter(deal => comparison.includes(deal.payload.dealId));
  return (
    <section className="space-y-4" aria-labelledby="pipeline-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pipeline-heading" tabIndex={-1} className="text-xl font-semibold">Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {active && <Button variant="ghost" onClick={() => openDeal(null, {})}>Start a new deal</Button>}
          <Button className="min-h-11" variant="outline" disabled={entries.isError || entries.isPending}
            onClick={() => start({ mode: "save", deal: active })}>
            {active ? "Save assumptions" : "Add a deal"}
          </Button>
        </div>
      </div>
      <div className="fixed inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
        {activePrice !== null && active
          ? <Button className="min-h-11 w-full" onClick={() => start({ mode: "offer", deal: active })}>Record offer at {money(activePrice)}</Button>
          : <Button className="min-h-11 w-full" disabled={!canSave} onClick={() => start({ mode: "save", deal: active })}>
              {active ? "Save assumptions" : "Save deal"}
            </Button>}
      </div>
      {entries.isError ? (
        <p role="alert">Could not load the pipeline. <button type="button" className="underline" onClick={() => void entries.refetch()}>Try again</button></p>
      ) : entries.isPending ? <p role="status">Loading pipeline…</p> : deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Complete underwriting assumptions and save them to start your pipeline.</p>
      ) : (
        <ul className="space-y-3">{deals.map(deal => {
          const { payload } = deal;
          const age = Math.max(0, Math.floor((Date.now() - new Date(deal.created_at).getTime()) / 86_400_000));
          const { asking, gates, price } = modelComparison(payload.assumptions, policyFor(payload.propertyType));
          const related = entries.entries.find(entry => entry.payload.kind === "acquisition" && entry.payload.dealId === payload.dealId);
          const decision = related?.payload.kind === "acquisition" ? related.payload : null;
          return (
            <li key={payload.dealId}>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{payload.title}</h3>
                  <p className="text-xs text-muted-foreground">Assumptions updated {age === 0 ? "today" : age + " days ago"}</p>
                </div>
                <p className="text-sm">{decision ? (decision.action === "pass" ? "Passed" : "Offer recorded") + " · " + decision.reason : gates.verdict}</p>
                {related && <Link className="text-sm underline" to={pathTo("/decisions/" + related.id + "/memo")}>Open decision memo</Link>}
                <dl className="grid grid-cols-2 gap-3 text-sm tabular-nums sm:grid-cols-3">
                  {[
                    ["Asking · Entered", money(payload.assumptions.price)], ["Max offer · Estimate", money(gates.maxOffer)],
                    ["Walk-away · Estimate", money(gates.walkAway)], ["DSCR · Estimate", ratio(asking?.dscr)],
                    ["IRR · Estimate", percent(asking?.irr)], ["Monthly cash flow · Estimate", money(asking?.cashFlow)],
                  ].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
                </dl>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => {
                    openDeal(payload.dealId, { ...initialValues(payload.assumptions), propertyType: payload.propertyType });
                    document.getElementById("underwriting-title")?.focus();
                  }}>Review assumptions</Button>
                  {price !== null && <Button variant="outline" onClick={() => start({ mode: "offer", deal })}>Record offer at {money(price)}</Button>}
                  <Button variant="ghost" onClick={() => start({ mode: "pass", deal })}>Pass</Button>
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" checked={comparison.includes(payload.dealId)}
                      disabled={comparison.length >= 2 && !comparison.includes(payload.dealId)}
                      onChange={event => setComparison(event.target.checked
                        ? [...comparison, payload.dealId] : comparison.filter(id => id !== payload.dealId))} />
                    Compare
                  </label>
                </div>
              </Card>
            </li>
          );
        })}</ul>
      )}
      {selected.length === 2 && <Comparison deals={selected} />}
      <Sheet open={editor !== null} onOpenChange={open => { if (!open && !pending) setEditor(null); }}>
        <SheetContent side="bottom" hideClose className="mx-auto max-w-xl"
          onCloseAutoFocus={event => {
            event.preventDefault();
            if (triggerRef.current?.isConnected) triggerRef.current.focus();
            else document.getElementById("pipeline-heading")?.focus();
          }}>
          {editor && <form onSubmit={save} className="space-y-3">
            <SheetTitle>{editor.mode === "save" ? "Save deal assumptions" : editor.mode === "offer" ? "Record offer" : "Record pass"}</SheetTitle>
            <SheetDescription>{editor.mode === "save" ? "The pipeline recomputes the gates when you review a deal." : "This records your decision and preserves the assumptions in a memo."}</SheetDescription>
            {editor.mode === "save" ? (
              <label className="block space-y-1 text-sm">Deal name<Input name="title" defaultValue={editor.deal?.payload.title ?? ""} required maxLength={120} /></label>
            ) : (
              <>
                <label className="block space-y-1 text-sm">Reason<Input name="reason" required maxLength={2000} /></label>
                <label className="block space-y-1 text-sm">Evidence link (optional)<Input name="evidenceUrl" type="url" /></label>
              </>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setEditor(null)}>Cancel</Button>
              <Button disabled={pending}>{editor.mode === "save" ? "Save deal" : "Confirm decision"}</Button>
            </div>
          </form>}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function Comparison({ deals }: { deals: Deal[] }) {
  const { policyFor } = useWorkspace();
  const results = deals.map(({ payload }) => ({ title: payload.title, ...modelComparison(payload.assumptions, policyFor(payload.propertyType)) }));
  const rank = (result: typeof results[number]) => Number(result.gates.verdict === "Buy");
  const [first, second] = [...results].sort((a, b) =>
    rank(b) - rank(a) || (b.modeled?.irr ?? -Infinity) - (a.modeled?.irr ?? -Infinity));
  return (
    <Card className="space-y-3 p-4">
      <h3 className="font-semibold">Compare deals</h3>
      <p className="text-sm text-muted-foreground">Compares at asking when both gates pass, otherwise at the estimated max offer. Asking price clearance takes priority, then modeled IRR.</p>
      <div className="grid grid-cols-2 gap-4">{results.map(({ title, modeled, price }, index) => (
        <div key={index} className="space-y-2 text-sm">
          <p className="font-semibold">{title}</p>
          <p>Test price {money(price)}</p>
          <p>DSCR {ratio(modeled?.dscr)} · IRR {percent(modeled?.irr)}</p>
          <p>Cash flow {money(modeled?.cashFlow)}/mo</p>
        </div>
      ))}</div>
      {first.modeled && (rank(first) !== rank(second) || first.modeled.irr !== second.modeled?.irr) && (
        <p className="text-sm font-medium">{first.title} ranks first on these inputs.</p>
      )}
    </Card>
  );
}
