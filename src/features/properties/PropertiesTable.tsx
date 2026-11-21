import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { coverage, money } from "@/domain/finance/format";
import type { AssetMetrics } from "@/domain/finance/portfolio";
import { RecordField, RecordSheet, recordSelectClass } from "@/features/portfolio/RecordSheet";

const propertyTypes = ["Single-Family", "Multi-Family", "Commercial", "Industrial"] as const;
export type PropertyType = typeof propertyTypes[number];
export type Property = {
  id: string;
  alias: string;
  address: string | null;
  type: string | null;
  sale_price: number | null;
  purchase_price?: number | null;
  property_value?: number | null;
  rent_growth_rate?: number | null;
  opex_inflation_rate?: number | null;
  property_taxes: number | null;
  insurance?: number | null;
  hoa?: number | null;
  misc?: number | null;
  mgmt_pct: number | null;
  maintenance_pct: number | null;
  vacancy_pct: number | null;
};

export interface PropertiesTableProps {
  properties: Property[];
  metrics: readonly AssetMetrics[];
  renderName: (property: Property) => ReactNode;
  onAdd: (data: Partial<Property>) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<Property>) => Promise<boolean>;
  onDelete: (id: string) => void;
  escrowByProperty?: Record<string, boolean>;
}

const fields = [
  ["sale_price", "Purchase price"],
  ["property_value", "Current value estimate"],
  ["vacancy_pct", "Vacancy (%)"],
  ["property_taxes", "Annual taxes"],
  ["insurance", "Annual insurance"],
  ["mgmt_pct", "Management (%)"],
  ["maintenance_pct", "Maintenance (%)"],
] as const;

export default function PropertiesTable({ properties, metrics, renderName, onAdd, onUpdate, onDelete, escrowByProperty }: PropertiesTableProps) {
  const [editor, setEditor] = useState<{ id?: string; data: Partial<Property> } | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const data = editor?.data ?? {};
  const close = () => setEditor(null);
  const change = (patch: Partial<Property>) => setEditor(previous => previous && { ...previous, data: { ...previous.data, ...patch } });
  const byId = new Map(metrics.map(asset => [asset.property.id, asset]));

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
      {properties.length ? <ul aria-label="Property summary" className="divide-y border-y">
        {properties.map(property => {
          const asset = byId.get(property.id);
          return (
            <li key={property.id} className="relative grid min-w-0 items-center gap-x-3 gap-y-2 py-3 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,1.6fr)_auto]">
              <div className="min-w-0 pr-24 xl:pr-0">
                {renderName(property)}
                {asset && <p className="mt-1 text-xs text-muted-foreground">{asset.verdict.label}</p>}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                <div><dt className="text-xs text-muted-foreground">Rent / mo</dt><dd className="font-semibold">{money(asset?.expectedRent)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Cash flow / mo</dt><dd className="font-semibold">{money(asset?.cashFlow)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">DSCR</dt><dd className="font-semibold">{asset ? coverage(asset) : "—"}</dd></div>
              </dl>
              <div className="absolute right-0 top-2 flex xl:static">
                <Button variant="ghost" size="icon" onClick={event => {
                  opener.current = event.currentTarget;
                  setEditor({ id: property.id, data: property });
                }} aria-label={`Edit property ${property.alias}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(property.id)} aria-label={`Delete property ${property.alias}`}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          );
        })}
      </ul> : <p className="border-y py-4 text-sm text-muted-foreground">No properties on record.</p>}
      <Button variant="outline" onClick={event => {
        opener.current = event.currentTarget;
        setEditor({ data: {} });
      }}><Plus className="mr-2 h-4 w-4" />Add Property</Button>
      <RecordSheet open={editor !== null} title={editor?.id ? "Edit property" : "Add property"}
        description="Record your purchase basis, current valuation, and operating assumptions." saving={saving} onSave={save} onClose={close} returnFocus={opener}>
        <RecordField label="Property name"><Input value={data.alias ?? ""} onChange={event => change({ alias: event.target.value })} /></RecordField>
        <RecordField label="Property type">
          <select className={recordSelectClass} value={data.type ?? ""} onChange={event => change({ type: event.target.value || null })}>
            <option value="">Select type…</option>
            {data.type && !propertyTypes.some(type => type === data.type) && <option value={data.type}>{data.type}</option>}
            {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </RecordField>
        <RecordField label="Address" wide><Input value={data.address ?? ""} onChange={event => change({ address: event.target.value })} /></RecordField>
        {fields.map(([key, label]) => {
          const inEscrow = !!editor?.id && escrowByProperty?.[editor.id] && (key === "property_taxes" || key === "insurance");
          return <RecordField key={key} label={inEscrow ? `${label} · In mortgage escrow` : label}>
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={inEscrow ? "" : data[key] ?? ""} disabled={inEscrow}
              onChange={event => change({ [key]: event.target.value === "" ? null : Number(event.target.value) })} />
          </RecordField>;
        })}
      </RecordSheet>
    </div>
  );
}
