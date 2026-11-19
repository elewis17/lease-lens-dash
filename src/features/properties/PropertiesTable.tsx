import { useRef, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Check, X, Trash2, Info } from "lucide-react";
import { coverage, money } from "@/domain/finance/format";
import type { AssetMetrics } from "@/domain/finance/portfolio";

export type PropertyType = "Single-Family" | "Multi-Family" | "Commercial" | "Industrial";
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

  // OPEX inputs (some may be null/undefined)
  property_taxes: number | null;   // annual $
  insurance?: number | null;       // annual $
  hoa?: number | null;             // annual $
  misc?: number | null;            // annual $
  mgmt_pct: number | null;         // % of rent
  maintenance_pct: number | null;  // % of rent
  vacancy_pct: number | null;
};


export interface PropertiesTableProps {
  properties: Property[];
  metrics: readonly AssetMetrics[];
  readOnly?: boolean;
  renderName: (property: Property) => ReactNode;
  onAdd: (data: Partial<Property>) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<Property>) => Promise<boolean>;
  onDelete: (id: string) => void;
  escrowByProperty?: Record<string, boolean>; // NEW
}

export default function PropertiesTable({ properties, metrics, renderName, readOnly = false, onAdd, onUpdate, onDelete, escrowByProperty}: PropertiesTableProps) {
  const escrowMap = escrowByProperty ?? {}; // optional default
  const isEscrowed = (propertyId?: string | null) => !!(propertyId && escrowMap[propertyId]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<Partial<Property>>({});

  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const startEdit = (row: Property) => {
    setEditingId(row.id);
    setEditData({
      alias: row.alias,
      address: row.address ?? "",
      type: row.type,
      sale_price: row.sale_price ?? null,
      property_value: row.property_value ?? null,
      property_taxes: row.property_taxes ?? undefined,
      insurance: row.insurance ?? undefined,   // ✅ add
      mgmt_pct: row.mgmt_pct ?? null,
      vacancy_pct: row.vacancy_pct ?? null,
      maintenance_pct: row.maintenance_pct ?? null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setIsAdding(false);
  };

  const save = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const saved = editingId ? await onUpdate(editingId, editData) : await onAdd(editData);
      if (saved) cancelEdit();
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  if (!isAdding && editingId === null) {
    const byId = new Map(metrics.map(asset => [asset.property.id, asset]));
    return (
      <div className="space-y-3">
        {properties.length > 0 && <ul aria-label="Property summary" className="divide-y border-y">
          {properties.map(property => {
            const asset = byId.get(property.id);
            return (
              <li key={property.id} className="grid items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(9rem,1fr)_minmax(15rem,1.5fr)_auto]">
                <div>
                  {renderName(property)}
                  {asset && <p className="text-xs text-muted-foreground">{asset.verdict.label}</p>}
                </div>
                <dl className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                  <div><dt className="text-xs text-muted-foreground">Rent / mo · Contractual</dt><dd>{money(asset?.expectedRent)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Cash flow / mo · Estimate</dt><dd>{money(asset?.cashFlow)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">DSCR · Estimate</dt><dd>{asset ? coverage(asset) : "—"}</dd></div>
                </dl>
                {!readOnly && <div className="flex gap-1 sm:justify-end">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(property)} aria-label={`Edit property ${property.alias}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(property.id)} aria-label={`Delete property ${property.alias}`} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>}
              </li>
            );
          })}
        </ul>}
        {!readOnly && <Button variant="outline" onClick={() => { setIsAdding(true); setEditData({}); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Property
        </Button>}
      </div>
    );
  }

  return (
    <Card className="rounded-xl border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="px-4 py-2">Property</TableHead>
              <TableHead className="px-4 py-2">Address</TableHead>
              <TableHead className="px-4 py-2">Type</TableHead>
              <TableHead className="px-4 py-2">Purchase Price</TableHead>
              <TableHead className="px-4 py-2">Current Value Estimate</TableHead>

              {/* Non-OPEX: Vacancy */}
              <TableHead className="px-4 py-2">Vacancy %</TableHead>

              {/* OPEX #1: Taxes */}
              <TableHead className="px-4 py-2 bg-muted">
                <div className="flex items-center">
                  <span>Annual Taxes</span>
                  <span
                    className="inline-flex items-center ml-1 text-muted-foreground"
                    title="Defaults to 1.3% of Purchase Price unless overridden"
                  >
                    <Info className="h-3 w-3" />
                  </span>
                </div>
              </TableHead>

              {/* OPEX #2: Insurance */}
              <TableHead className="px-4 py-2 bg-muted">Insurance</TableHead>

              {/* OPEX #3: Mgmt % */}
              <TableHead className="px-4 py-2 bg-muted">Mgmt %</TableHead>

              {/* OPEX #4: Maint % */}
              <TableHead className="px-4 py-2 bg-muted">Maint %</TableHead>

              <TableHead className="px-4 py-2 text-center">Actions</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.filter(property => property.id === editingId).map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="px-4 py-2">
                  <Input autoFocus aria-label="Property name"
                    value={editData.alias ?? ""}
                    onChange={(e) => setEditData({ ...editData, alias: e.target.value })}
                    className="h-8"
                    placeholder="Property name (unique)"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input aria-label="Address"
                    value={(editData.address as string) ?? ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="h-8"
                    placeholder="123 Main St"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <select aria-label="Property type"
                    className="h-8 w-full rounded-md border border-input bg-background px-2"
                    value={editData.type ?? ""}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value || null })}
                  >
                    <option value="">Select type…</option>
                    {["Single-Family","Multi-Family","Commercial","Industrial"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input
                    type="number"
                    aria-label="Purchase price" value={editData.sale_price ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : undefined;
                      setEditData(ed => ({ ...ed, sale_price: v ?? null }));
                    }}
                    className="h-8"
                    placeholder="e.g., 450000"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input aria-label="Current value estimate" type="number" min="0" value={editData.property_value ?? ""}
                    onChange={event => setEditData({ ...editData, property_value: event.target.value === "" ? null : Number(event.target.value) })} className="h-8" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input type="number" aria-label="Vacancy percentage" value={editData.vacancy_pct ?? ""} onChange={(e)=>setEditData({ ...editData, vacancy_pct: e.target.value === "" ? null : Number(e.target.value) })} className="h-8" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const escrowed = isEscrowed(editingId);
                      return (
                        <Input
                          type="number"
                          aria-label="Annual taxes" value={escrowed ? "" : (editData.property_taxes ?? "")}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              property_taxes: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="h-8"
                          disabled={escrowed}
                          placeholder={escrowed ? "in mortgage" : ""}
                        />
                      );
                    })()}

                  </div>
                </TableCell>
                <TableCell className="px-4 py-2">
                  {(() => {
                    const escrowed = isEscrowed(editingId);
                    return (
                      <Input
                        type="number"
                        aria-label="Annual insurance" value={escrowed ? "" : (editData.insurance ?? "")}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            insurance: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="h-8"
                        disabled={escrowed}
                        placeholder={escrowed ? "in mortgage" : ""}
                      />
                    );
                  })()}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input type="number" aria-label="Management percentage" value={editData.mgmt_pct ?? ""} onChange={(e)=>setEditData({ ...editData, mgmt_pct: e.target.value === "" ? null : Number(e.target.value) })} className="h-8" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input type="number" aria-label="Maintenance percentage" value={editData.maintenance_pct ?? ""} onChange={(e)=>setEditData({ ...editData, maintenance_pct: e.target.value === "" ? null : Number(e.target.value) })} className="h-8" />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={save} aria-label="Save property" disabled={saving}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} aria-label="Cancel property edit" disabled={saving}><X className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {isAdding && (
              <TableRow className="bg-primary/5">
                <TableCell className="px-4 py-2">
                  <Input autoFocus aria-label="Property name"
                    placeholder="Property name (required)"
                    value={editData.alias ?? ""}
                    onChange={(e) => setEditData({ ...editData, alias: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input aria-label="Address"
                    placeholder="Address"
                    value={(editData.address as string) ?? ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <select aria-label="Property type"
                    className="h-8 w-full rounded-md border border-input bg-background px-2"
                    value={editData.type ?? ""}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value || null })}
                  >
                    <option value="">Select type…</option>
                        {["Single-Family","Multi-Family","Commercial","Industrial"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input aria-label="Purchase price"
                    type="number"
                    placeholder="Purchase price"
                    value={editData.sale_price ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : undefined;
                      setEditData(ed => ({ ...ed, sale_price: v ?? null }));
                    }}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                      <Input aria-label="Current value estimate" type="number" min="0" value={editData.property_value ?? ""}
                        onChange={event => setEditData({ ...editData, property_value: event.target.value === "" ? null : Number(event.target.value) })} className="h-8" />
                    </TableCell>
                    <TableCell className="px-4 py-2"><Input type="number" aria-label="Vacancy percentage" value={editData.vacancy_pct ?? ""} onChange={(e)=>setEditData({ ...editData, vacancy_pct: e.target.value === "" ? null : Number(e.target.value) })} className="h-8" /></TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      // if your add row selects a property first, use that id; else leave false
                      const escrowed = false;
                      return (
                        <Input
                          type="number"
                          aria-label="Annual taxes" value={escrowed ? "" : (editData.property_taxes ?? "")}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              property_taxes: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="h-8"
                          disabled={escrowed}
                          placeholder={escrowed ? "in mortgage" : ""}
                        />
                      );
                    })()}

                  </div>
                </TableCell>
                {/* ✅ NEW: Insurance (between Taxes and Mgmt %) */}
                <TableCell className="px-4 py-2">
                  <Input
                    type="number"
                    aria-label="Annual insurance" value={editData.insurance ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        insurance: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="h-8"
                    placeholder=""
                  />
                </TableCell>
                <TableCell className="px-4 py-2"><Input type="number" aria-label="Management percentage" value={editData.mgmt_pct ?? ""} onChange={(e)=>setEditData({ ...editData, mgmt_pct: e.target.value === "" ? null : Number(e.target.value) })} className="h-8" /></TableCell>
                <TableCell className="px-4 py-2"><Input type="number" aria-label="Maintenance percentage" value={editData.maintenance_pct ?? ""} onChange={(e)=>setEditData({ ...editData, maintenance_pct: e.target.value === "" ? null : Number(e.target.value) })} className="h-8" /></TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={save} aria-label="Save property" disabled={saving}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} aria-label="Cancel property edit" disabled={saving}><X className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
