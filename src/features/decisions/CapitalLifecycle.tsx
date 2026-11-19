import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { entrySchema, lifecycle, type CapitalEntry } from "./entries";

export function CapitalLifecycle({ current, onSaved }: { current: Omit<CapitalEntry, "status"> & { status: CapitalEntry["status"] | "identified" }; onSaved?: () => void }) {
  const { entries } = useWorkspace();
  const [pending, setPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = lifecycle[lifecycle.indexOf(current.status) + 1];
  if (!next || next === "identified") return null;
  const action = next === "investigating" ? "Begin investigation" : next === "decided" ? "Record decision" : next === "executing" ? "Mark executing" : "Record actual outcome";
  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    const actual = String(fields.get("actual") ?? "").trim();
    const payload = entrySchema.safeParse({
      ...current, status: next, notes: fields.get("notes"), evidenceUrl: String(fields.get("evidenceUrl") ?? "").trim() || undefined,
      actualAnnualCashChange: next === "completed" && actual !== "" ? Number(actual) : null,
    });
    if (!payload.success) {
      setError("Enter the evidence for this step and any required actual result.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await entries.append(payload.data);
      setFormOpen(false);
      onSaved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The entry could not be saved.");
    } finally {
      setPending(false);
    }
  };

  return formOpen ? (
    <form onSubmit={confirm} className="w-full space-y-3">
      <label className="block space-y-1 text-sm">
        <span>{next === "decided" ? "Reason and evidence" : "Date and evidence"}</span>
        <Input name="notes" required maxLength={2000} />
      </label>
      <label className="block space-y-1 text-sm"><span>Evidence link (optional)</span><Input name="evidenceUrl" type="url" /></label>
      {next === "completed" && (
        <label className="block space-y-1 text-sm">
          <span>Actual annual cash change ($)</span>
          <Input name="actual" type="number" step="any" required />
        </label>
      )}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => setFormOpen(false)}>Cancel</Button>
        <Button type="submit" disabled={pending}>Confirm {next === "decided" ? "decision" : "update"}</Button>
      </div>
    </form>
  ) : <Button disabled={entries.isError || entries.isPending} onClick={() => setFormOpen(true)}>{action}</Button>;
}
