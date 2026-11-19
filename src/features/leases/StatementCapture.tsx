import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Mortgage } from "@/components/MortgagesTable";
import { extractMortgageStatement, saveMortgageStatement } from "./leaseCaptureApi";

export function StatementCapture({ ownerId, mortgages, refresh }: {
  ownerId: string; mortgages: Mortgage[]; refresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [capture, setCapture] = useState<Awaited<ReturnType<typeof extractMortgageStatement>> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const changeOpen = (next: boolean) => {
    if (pending) return;
    setCapture(null);
    setError(null);
    if (next) setSaved(false);
    setOpen(next);
  };

  const read = async (file?: File) => {
    if (!file || pending) return;
    setPending(true);
    setError(null);
    try {
      setCapture(await extractMortgageStatement(file, ownerId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read the statement.");
    } finally {
      setPending(false);
    }
  };
  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capture || pending) return;
    const fields = new FormData(event.currentTarget);
    const mortgageId = String(fields.get("mortgageId") ?? "");
    const date = String(fields.get("date") ?? "");
    const principalText = String(fields.get("principal") ?? "");
    const principal = Number(principalText);
    if (!mortgages.some(mortgage => mortgage.id === mortgageId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !principalText.trim() || !Number.isFinite(principal) || principal < 0 || principal >= 1e12) {
      setError("Select a mortgage and confirm the date and outstanding principal.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await saveMortgageStatement(capture, { mortgageId, date, principal }, ownerId);
      await refresh();
      setCapture(null);
      setOpen(false);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the statement.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetTrigger asChild><Button variant="outline" disabled={!mortgages.length}>Upload mortgage statement</Button></SheetTrigger>
      {saved && <p role="status" className="mt-2 text-sm">Statement confirmed and loan balance updated.</p>}
      <SheetContent side="bottom" hideClose className="mx-auto max-h-[90dvh] max-w-xl overflow-y-auto">
        <SheetTitle>Mortgage statement</SheetTitle>
        <SheetDescription>Upload a PDF or photo. The extraction provider reads the document. Review the date and principal before saving.</SheetDescription>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!capture ? (
          <>
            <label className="block space-y-2 text-sm">
              <span>Mortgage statement file</span>
              <Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={pending}
                onChange={event => void read(event.target.files?.[0])} />
            </label>
            {pending && <p role="status" className="text-sm">Reading statement…</p>}
            <Button variant="outline" disabled={pending} onClick={() => changeOpen(false)}>Cancel</Button>
          </>
        ) : (
          <form onSubmit={confirm} className="space-y-3">
            <p className="text-sm text-muted-foreground">Estimate · Compare extracted fields with {capture.file.name}.</p>
            <label className="block space-y-1 text-sm">Mortgage
              <select name="mortgageId" className="block min-h-11 w-full rounded-md border bg-background px-2" required>
                <option value="">Select a mortgage</option>
                {mortgages.map(mortgage => <option key={mortgage.id} value={mortgage.id}>{mortgage.loan_name || mortgage.id}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-sm">Statement date<Input name="date" type="date" defaultValue={capture.statementDate ?? ""} required /></label>
            <label className="block space-y-1 text-sm">Outstanding principal ($)<Input name="principal" type="number" min="0" step="0.01" defaultValue={capture.principalBalance ?? ""} required /></label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => changeOpen(false)}>Cancel</Button>
              <Button disabled={pending}>Confirm statement and update balance</Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
