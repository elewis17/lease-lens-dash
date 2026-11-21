import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export function RecordSheet({ open, title, description, saving, onClose, onSave, returnFocus, children }: {
  open: boolean;
  title: string;
  description: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  returnFocus: RefObject<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={next => { if (!next && !saving) onClose(); }}>
      <SheetContent side="bottom" hideClose className="mx-auto max-h-[90dvh] max-w-2xl rounded-t-xl border p-0"
        onOpenAutoFocus={event => {
          event.preventDefault();
          const heading = event.currentTarget instanceof HTMLElement
            ? event.currentTarget.querySelector<HTMLElement>("[data-record-title]") : null;
          heading?.focus();
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (returnFocus.current?.isConnected) returnFocus.current.focus();
        }}
        onInteractOutside={event => event.preventDefault()}>
        <form noValidate className="flex max-h-[90dvh] flex-col" onSubmit={event => { event.preventDefault(); void onSave(); }}>
          <header className="border-b px-5 py-4 sm:px-8">
            <SheetTitle data-record-title tabIndex={-1} className="text-xl tracking-tight">{title}</SheetTitle>
            <SheetDescription className="mt-1">{description}</SheetDescription>
          </header>
          <fieldset disabled={saving} className="grid min-h-0 gap-x-5 gap-y-4 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-8">
            {children}
          </fieldset>
          <footer className="flex justify-end gap-2 border-t bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function RecordField({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "grid gap-1.5 sm:col-span-2" : "grid min-w-0 gap-1.5"}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const recordSelectClass = "h-11 min-w-0 w-full rounded-md border border-input bg-background px-3 text-base sm:text-sm";
