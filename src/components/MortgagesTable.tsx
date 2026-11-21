import { useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { money } from "@/domain/finance/format";
import { RecordField, RecordSheet, recordSelectClass } from "@/features/portfolio/RecordSheet";

export interface Mortgage {
  id: string;
  property_id?: string | null;
  loan_name: string | null;
  principal: number | null;
  principal_original?: number | null;
  current_balance?: number | null;
  interest_rate: number;
  term_months: number;
  start_date: Date | null;
  monthly_payment: number;
  includes_escrow?: boolean | null;
}

type NumericInput = number | string | null;
export type MortgageInput = {
  property_id?: string | null;
  loan_name?: string | null;
  principal?: NumericInput;
  principal_original?: NumericInput;
  current_balance?: NumericInput;
  interest_rate?: NumericInput;
  term_months?: NumericInput;
  monthly_payment?: NumericInput;
  start_date?: Date | string | null;
  includes_escrow?: boolean;
};

type MortgagesTableProps = {
  mortgages: Mortgage[];
  selectedProperty?: string;
  onUpdate: (id: string, data: MortgageInput) => Promise<boolean>;
  onDelete: (id: string) => void;
  onAdd: (data: MortgageInput) => Promise<boolean>;
  propertyOptions: { id: string; name: string }[];
};

const numericFields = [
  ["principal_original", "Original principal", "0.01"],
  ["current_balance", "Current balance", "0.01"],
  ["interest_rate", "Interest rate (%)", "0.01"],
  ["term_months", "Loan term (months)", "1"],
  ["monthly_payment", "Monthly payment", "0.01"],
] as const;
const toApiDate = (value: MortgageInput["start_date"]) => value instanceof Date
  ? value.toISOString().slice(0, 10) : value ?? "";

export function MortgagesTable({ mortgages, onUpdate, onDelete, onAdd, propertyOptions, selectedProperty }: MortgagesTableProps) {
  const [editor, setEditor] = useState<{ id?: string; data: MortgageInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const byProperty = new Map(propertyOptions.map(option => [option.id, option.name]));
  const data = editor?.data ?? {};
  const close = () => setEditor(null);
  const change = (patch: MortgageInput) => setEditor(previous => previous && { ...previous, data: { ...previous.data, ...patch } });

  const save = async () => {
    if (!editor || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const saved = editor.id ? await onUpdate(editor.id, editor.data) : await onAdd(editor.data);
      if (saved) close();
    } finally {
      setSaving(false);
      inFlight.current = false;
    }
  };

  return (
    <div className="space-y-3">
      {mortgages.length ? <Table className="record-table">
        <TableHeader><TableRow>
          <TableHead>Property / loan</TableHead>
          <TableHead className="hidden lg:table-cell text-right">Original principal</TableHead>
          <TableHead className="text-right">Current balance</TableHead>
          <TableHead className="hidden md:table-cell text-right">Rate</TableHead>
          <TableHead className="hidden lg:table-cell text-right">Term</TableHead>
          <TableHead className="hidden lg:table-cell">Start date</TableHead>
          <TableHead className="hidden md:table-cell text-right">Payment / mo</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow></TableHeader>
        <TableBody>{mortgages.map(mortgage => {
          const propertyName = (mortgage.property_id && byProperty.get(mortgage.property_id)) || "—";
          const name = mortgage.loan_name && mortgage.loan_name !== propertyName ? mortgage.loan_name : null;
          const rate = `${mortgage.interest_rate}%`;
          return (
            <TableRow key={mortgage.id}>
              <TableCell className="min-w-0">
                <p className="break-words font-semibold">{propertyName}</p>
                {name && <p className="mt-1 break-words text-xs text-muted-foreground">{name}</p>}
                <p className="mt-1 text-xs text-muted-foreground md:hidden">{rate} · {money(mortgage.monthly_payment)} / mo</p>
                {mortgage.includes_escrow != null && <p className="mt-1 text-xs text-muted-foreground">{mortgage.includes_escrow ? "Includes escrow" : "No escrow"}</p>}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right">{money(mortgage.principal_original ?? mortgage.principal)}</TableCell>
              <TableCell className="text-right font-semibold">{money(mortgage.current_balance)}</TableCell>
              <TableCell className="hidden md:table-cell text-right">{rate}</TableCell>
              <TableCell className="hidden lg:table-cell text-right">{mortgage.term_months} mo</TableCell>
              <TableCell className="hidden lg:table-cell">{mortgage.start_date ? format(parseISO(toApiDate(mortgage.start_date)), "MMM d, yyyy") : "—"}</TableCell>
              <TableCell className="hidden md:table-cell text-right">{money(mortgage.monthly_payment)}</TableCell>
              <TableCell className="w-0">
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" aria-label={`Edit mortgage ${name ?? propertyName}`}
                    onClick={event => {
                      opener.current = event.currentTarget;
                      setEditor({ id: mortgage.id, data: {
                        ...mortgage, principal_original: mortgage.principal_original ?? mortgage.principal,
                        includes_escrow: mortgage.includes_escrow ?? undefined,
                      } });
                    }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete mortgage ${name ?? propertyName}`} onClick={() => onDelete(mortgage.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}</TableBody>
      </Table> : <p className="border-y py-4 text-sm text-muted-foreground">No mortgages on record for this selection.</p>}
      <Button variant="outline" disabled={!propertyOptions.length} onClick={event => {
        opener.current = event.currentTarget;
        setEditor({ data: { property_id: selectedProperty || (propertyOptions.length === 1 ? propertyOptions[0].id : undefined) } });
      }}><Plus className="mr-2 h-4 w-4" />Add Mortgage</Button>
      <RecordSheet open={editor !== null} title={editor?.id ? "Edit mortgage" : "Add mortgage"}
        description="Use the balance and payment from your mortgage statement." saving={saving} onSave={save} onClose={close} returnFocus={opener}>
        <RecordField label="Property">
          <select className={recordSelectClass} value={data.property_id ?? ""} onChange={event => change({ property_id: event.target.value })}>
            <option value="">Select property…</option>
            {propertyOptions.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select>
        </RecordField>
        <RecordField label="Loan name"><Input value={data.loan_name ?? ""} onChange={event => change({ loan_name: event.target.value })} /></RecordField>
        {numericFields.map(([key, label, step]) => <RecordField key={key} label={label} compact>
          <Input type="number" inputMode="decimal" min="0" step={step} value={data[key] ?? ""} onChange={event => change({ [key]: event.target.value })} />
        </RecordField>)}
        <RecordField compact label="Loan start date"><Input className="min-w-0" type="date" value={toApiDate(data.start_date)} onChange={event => change({ start_date: event.target.value })} /></RecordField>
        <RecordField label="Escrow">
          <select className={recordSelectClass} value={data.includes_escrow === undefined ? "" : String(data.includes_escrow)}
            onChange={event => change({ includes_escrow: event.target.value === "" ? undefined : event.target.value === "true" })}>
            <option value="">Unspecified</option>
            <option value="true">Includes taxes and insurance</option>
            <option value="false">Paid separately</option>
          </select>
        </RecordField>
      </RecordSheet>
    </div>
  );
}
