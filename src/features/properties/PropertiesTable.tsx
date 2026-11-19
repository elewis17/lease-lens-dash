import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Check, X, Trash2, Info } from "lucide-react";

export type PropertyType = "Single-Family" | "Multi-Family" | "Commercial" | "Industrial";
export type Property = {
  id: string;
  alias: string;
  address: string | null;
  type: string | null;
  sale_price: number | null;
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
  onAdd: (data: Partial<Property>) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<Property>) => Promise<boolean>;
  onDelete: (id: string) => void;
  escrowByProperty?: Record<string, boolean>; // NEW
}

const fmtMoney = (n?: number | null) =>
  n == null || isNaN(n) ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const pct = (n?: number | null) => (n == null || isNaN(n) ? "—" : `${n}%`);

export default function PropertiesTable({ properties, onAdd, onUpdate, onDelete, escrowByProperty}: PropertiesTableProps) {
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

  return (
    <Card className="rounded-xl shadow-sm border-border overflow-hidden">
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
              <TableHead className="px-4 py-2 bg-rose-50/60">
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
              <TableHead className="px-4 py-2 bg-rose-50/60">Insurance</TableHead>

              {/* OPEX #3: Mgmt % */}
              <TableHead className="px-4 py-2 bg-rose-50/60">Mgmt %</TableHead>

              {/* OPEX #4: Maint % */}
              <TableHead className="px-4 py-2 bg-rose-50/60">Maint %</TableHead>

              <TableHead className="px-4 py-2 text-center">Actions</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                {editingId === p.id ? (
                  <>
                    <TableCell className="px-4 py-2">
                      <Input
                        value={editData.alias ?? ""}
                        onChange={(e) => setEditData({ ...editData, alias: e.target.value })}
                        className="h-8"
                        placeholder="Property name (unique)"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Input
                        value={(editData.address as string) ?? ""}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="h-8"
                        placeholder="123 Main St"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <select
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
                  </>
                ) : (
                  <>
                    <TableCell className="px-4 py-2 font-medium">{p.alias}</TableCell>
                    <TableCell className="px-4 py-2">{p.address ?? "—"}</TableCell>
                    <TableCell className="px-4 py-2">{p.type ?? "—"}</TableCell>
                    <TableCell className="px-4 py-2">{fmtMoney(p.sale_price ?? undefined)}</TableCell>
                    <TableCell className="px-4 py-2">{fmtMoney(p.property_value)}</TableCell>
                    <TableCell className="px-4 py-2">{pct(p.vacancy_pct ?? undefined)}</TableCell>
                    {(() => {
                      const escrowed = isEscrowed(p.id);
                      const value = fmtMoney(
                        p.property_taxes
                      );
                      return (
                        <TableCell className={`px-4 py-2 ${escrowed ? "text-muted-foreground" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span>{value}</span>
                            {escrowed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                in mortgage
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })()}
                    {(() => {
                      const escrowed = isEscrowed(p.id);
                      const value = fmtMoney(p.insurance ?? undefined);
                      return (
                        <TableCell className={`px-4 py-2 ${escrowed ? "text-muted-foreground" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span>{value}</span>
                            {escrowed && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                in mortgage
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })()}
                    <TableCell className="px-4 py-2">{pct(p.mgmt_pct ?? undefined)}</TableCell> 
                    <TableCell className="px-4 py-2">{pct(p.maintenance_pct ?? undefined)}</TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(p)} disabled={saving}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)} aria-label={`Delete property ${p.alias}`} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}

            {isAdding && (
              <TableRow className="bg-primary/5">
                <TableCell className="px-4 py-2">
                  <Input
                    placeholder="Property name (required)"
                    value={editData.alias ?? ""}
                    onChange={(e) => setEditData({ ...editData, alias: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Input
                    placeholder="Address"
                    value={(editData.address as string) ?? ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <select
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
      {/* Footer controls at the bottom, like other sections */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        {!isAdding && editingId === null && (
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => {
              setIsAdding(true) ;
              setEditData({});
            }}
            className="w-full hover:scale-105 transition-transform"//"shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Property
          </Button>
        )}
      </div>
    </Card>
  );
}
