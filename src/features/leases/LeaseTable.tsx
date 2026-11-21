import { useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Constants, type Enums } from "@/integrations/supabase/types";
import { RecordField, RecordSheet, recordSelectClass } from "@/features/portfolio/RecordSheet";
import { money } from "@/domain/finance/format";

type LeaseStatus = Enums<"lease_status">;
const isLeaseStatus = (value: string): value is LeaseStatus =>
  Constants.public.Enums.lease_status.some(status => value === status);
const leaseStatusLabels: Record<LeaseStatus, string> = {
  active: "Active", expiring: "Expiring", vacant: "Vacant", expired: "Expired",
};

export interface LeaseData {
  id: string;
  tenant: string;
  documentPath?: string | null;
  monthlyRent: number;
  deposit: number | null;
  startDate: string | null;
  leaseEnd: string | null;
  property_id?: string;
  status?: LeaseStatus | null;
  unit_id?: string | null;
  unit_label?: string | null;
}

export type ManualLeaseInput = Partial<Omit<LeaseData, "id" | "monthlyRent" | "deposit" | "documentPath">> & {
  monthlyRent?: number | string;
  deposit?: number | string | null;
};

type LeaseTableProps = {
  leases: LeaseData[];
  selectedProperty?: string;
  onUpdate: (id: string, data: ManualLeaseInput) => Promise<boolean>;
  onDelete: (id: string) => void;
  onAdd: (id: string, data: ManualLeaseInput) => Promise<boolean>;
  propertyOptions: { id: string; name: string }[];
};

export function LeaseTable({ leases, onUpdate, onDelete, onAdd, propertyOptions, selectedProperty }: LeaseTableProps) {
  const [editor, setEditor] = useState<{ id: string; editing: boolean; data: ManualLeaseInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const byProperty = new Map(propertyOptions.map(option => [option.id, option.name]));
  const data = editor?.data ?? {};
  const change = (patch: ManualLeaseInput) => setEditor(previous => previous && { ...previous, data: { ...previous.data, ...patch } });
  const close = () => setEditor(null);

  const save = async () => {
    if (!editor || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const action = editor.editing ? onUpdate : onAdd;
      if (await action(editor.id, editor.data)) close();
    } finally {
      setSaving(false);
      inFlight.current = false;
    }
  };

  return (
    <div className="space-y-3">
      {leases.length ? <Table className="record-table">
        <TableHeader><TableRow>
          <TableHead>Tenant</TableHead>
          <TableHead className="hidden md:table-cell">Property/Unit</TableHead>
          <TableHead className="text-right">Rent / mo</TableHead>
          <TableHead className="hidden lg:table-cell">Lease start</TableHead>
          <TableHead className="hidden md:table-cell">Lease end</TableHead>
          <TableHead className="hidden lg:table-cell text-right">Deposit</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow></TableHeader>
        <TableBody>{leases.map(lease => {
          const property = (lease.property_id && byProperty.get(lease.property_id)) || "—";
          const unit = lease.unit_label;
          const ends = lease.leaseEnd ? format(parseISO(lease.leaseEnd), "MMM d, yyyy") : "—";
          const status = lease.status ? leaseStatusLabels[lease.status] : "Unspecified";
          return (
            <TableRow key={lease.id}>
              <TableCell className="min-w-0">
                <p className="break-words font-semibold">{lease.tenant}</p>
                <p className="mt-1 text-xs text-muted-foreground md:hidden">{property}{unit && ` · Unit ${unit}`}</p>
                <p className="mt-1 text-xs text-muted-foreground">{status}<span className="md:hidden">{lease.leaseEnd && ` · Ends ${ends}`}</span></p>
              </TableCell>
              <TableCell className="hidden md:table-cell">{property}{unit && <span className="block text-xs text-muted-foreground">Unit {unit}</span>}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{money(lease.monthlyRent)}</TableCell>
              <TableCell className="hidden lg:table-cell">{lease.startDate ? format(parseISO(lease.startDate), "MMM d, yyyy") : "—"}</TableCell>
              <TableCell className="hidden md:table-cell">{ends}</TableCell>
              <TableCell className="hidden lg:table-cell text-right">{money(lease.deposit)}</TableCell>
              <TableCell className="w-0">
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" aria-label={`Edit lease for ${lease.tenant}`} onClick={event => {
                    opener.current = event.currentTarget;
                    setEditor({ id: lease.id, editing: true, data: lease });
                  }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete lease for ${lease.tenant}`} onClick={() => onDelete(lease.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}</TableBody>
      </Table> : <p className="border-y py-4 text-sm text-muted-foreground">No leases on record for this selection.</p>}
      <Button variant="outline" disabled={!propertyOptions.length} onClick={event => {
        opener.current = event.currentTarget;
        setEditor({ id: crypto.randomUUID(), editing: false, data: {
          property_id: selectedProperty || (propertyOptions.length === 1 ? propertyOptions[0].id : undefined), status: "active",
        } });
      }}><Plus className="mr-2 h-4 w-4" />Add New Lease</Button>
      <RecordSheet open={editor !== null} title={editor?.editing ? "Edit lease" : "Add lease"}
        description={editor?.editing ? "Changing the unit reassigns this lease. The previous unit stays on record." : "Review the property, tenant, and signed terms before saving."}
        saving={saving} onSave={save} onClose={close} returnFocus={opener}>
        <RecordField label="Property">
          <select className={recordSelectClass} value={data.property_id ?? ""} onChange={event => change({ property_id: event.target.value })}>
            <option value="">Select property…</option>
            {propertyOptions.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select>
        </RecordField>
        <RecordField label="Unit label"><Input value={data.unit_label ?? ""} onChange={event => change({ unit_label: event.target.value })} /></RecordField>
        <RecordField label="Tenant name"><Input value={data.tenant ?? ""} onChange={event => change({ tenant: event.target.value })} /></RecordField>
        <RecordField label="Lease status">
          <select className={recordSelectClass} value={data.status ?? ""} onChange={event => {
            const value = event.target.value;
            change({ status: isLeaseStatus(value) ? value : null });
          }}>
            <option value="">Unspecified</option>
            {Object.entries(leaseStatusLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
          </select>
        </RecordField>
        <RecordField compact label="Lease start date"><Input className="min-w-0" type="date" value={data.startDate ?? ""} onChange={event => change({ startDate: event.target.value })} /></RecordField>
        <RecordField compact label="Lease end date"><Input className="min-w-0" type="date" value={data.leaseEnd ?? ""} onChange={event => change({ leaseEnd: event.target.value })} /></RecordField>
        <RecordField compact label="Monthly rent"><Input type="number" inputMode="decimal" step="0.01" min="0" value={data.monthlyRent ?? ""} onChange={event => change({ monthlyRent: event.target.value })} /></RecordField>
        <RecordField compact label="Deposit"><Input type="number" inputMode="decimal" step="0.01" min="0" value={data.deposit ?? ""} onChange={event => change({ deposit: event.target.value })} /></RecordField>
      </RecordSheet>
    </div>
  );
}
