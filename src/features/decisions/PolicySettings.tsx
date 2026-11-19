import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { propertyTypes, strategyPresets, type Strategy, type ThresholdPolicy } from "@/domain/finance/thresholds";
import type { useWorkspaceEntries } from "./useWorkspaceEntries";
import { currentPolicies, entrySchema } from "./entries";

const targets = ["Portfolio", ...propertyTypes] as const;
type Target = typeof targets[number];
const ruleLabels = { hold: "Hold", distress: "Distress", sell: "Sell candidate", refinance: "Refinance candidate", buy: "Buy gates", lender: "Lender floor" };
const fieldLabels: Record<string, string> = {
  minimumDscr: "Minimum DSCR", dscrBelow: "DSCR below", cashFlowAbove: "Monthly cash flow above ($)",
  cashFlowBelow: "Monthly cash flow below ($)", distressQuarters: "Quarters of distress",
  dscrBelowWithoutCredibleFix: "DSCR below with no credible fix", rateSpreadPercentagePoints: "Rate spread (percentage points)",
  minimumIrr: "Minimum IRR (%)",
};
export function PolicySettings({ store }: { store: ReturnType<typeof useWorkspaceEntries> }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target>("Portfolio");
  const [preset, setPreset] = useState<Strategy | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = currentPolicies(store.entries);
  const policy = saved.get(target) ?? saved.get("Portfolio");
  const strategy = preset ?? policy?.strategy ?? "Balanced";
  const fields: ThresholdPolicy = preset ? strategyPresets[preset] : policy?.policy ?? strategyPresets.Balanced;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    const updated = Object.fromEntries(Object.entries(fields).map(([group, rules]) => [group,
      Object.fromEntries(Object.keys(rules).map(key => [
        key, Number(values.get(group + "." + key)) / (key === "minimumIrr" ? 100 : 1),
      ])),
    ]));
    const parsed = entrySchema.safeParse({ kind: "policy", title: "Threshold policy · " + target,
      strategy, target, policy: updated, reason: values.get("reason") });
    if (!parsed.success) {
      setError("Check the threshold values and describe the reason for the change.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await store.append(parsed.data);
      setOpen(false);
      setPreset(null);
    } catch {
      setError("Could not save the threshold policy.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={next => { if (!pending) setOpen(next); }}>
      <SheetTrigger asChild><Button variant="outline" disabled={store.isPending || store.isError}>Policies</Button></SheetTrigger>
      <SheetContent side="bottom" className="mx-auto flex max-h-[90dvh] max-w-2xl flex-col gap-3">
        <header>
          <SheetTitle>Threshold policies</SheetTitle>
          <SheetDescription>Rules guide verdicts. Confirm changes to preserve them in the Decision Log.</SheetDescription>
        </header>
        <label className="text-sm">Applies to
          <select className="ml-3 rounded-md border bg-background p-2" value={target}
            onChange={event => { setTarget(event.target.value as Target); setPreset(null); }}>
            {targets.map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Strategy presets">
          {Object.keys(strategyPresets).map(name => (
            <Button key={name} aria-pressed={name === strategy} variant="outline" onClick={() => setPreset(name as Strategy)}>{name}</Button>
          ))}
        </div>
        <form key={target + ":" + (preset ?? "saved")} onSubmit={submit} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-1">
          {Object.entries(fields).map(([group, rules]) => (
            <fieldset key={group} className="grid gap-2 border-t pt-2 sm:grid-cols-2">
              <legend className="text-sm font-medium">{ruleLabels[group as keyof ThresholdPolicy]}</legend>
              {Object.entries(rules as Record<string, number>).map(([key, value]) => (
                <label key={key} className="space-y-1 text-sm">
                  <span>{fieldLabels[key]}</span>
                  <Input type="number" step="any" name={group + "." + key} required defaultValue={key === "minimumIrr" ? value * 100 : value} />
                </label>
              ))}
            </fieldset>
          ))}
          <label className="space-y-1 text-sm"><span>Reason for change</span><Input name="reason" required maxLength={2000} /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button disabled={pending}>Confirm policy change</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
