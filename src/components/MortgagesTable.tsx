import { useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";

type PropertyOption = { id: string; name: string };

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

interface MortgagesTableProps {
  mortgages: Mortgage[];
  onUpdate: (id: string, data: MortgageInput) => Promise<boolean>;
  onDelete: (id: string) => void;
  onAdd: (data: MortgageInput) => Promise<boolean>;
  propertyOptions: PropertyOption[]; // NEW
}

export const MortgagesTable = ({ mortgages, onUpdate, onDelete, onAdd, propertyOptions}: MortgagesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<MortgageInput>({});
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const handleEdit = (mortgage: Mortgage) => {
    setEditingId(mortgage.id);
    setIsAdding(false);
    setEditData({
      property_id: mortgage.property_id ?? null,
      loan_name: mortgage.loan_name ?? "",
      principal: typeof mortgage.principal === "number" ? mortgage.principal : null,
      principal_original: mortgage.principal_original ?? mortgage.principal,
      current_balance: typeof mortgage.current_balance === "number" ? mortgage.current_balance : null,
      interest_rate: typeof mortgage.interest_rate === "number" ? mortgage.interest_rate : null,
      term_months: typeof mortgage.term_months === "number" ? mortgage.term_months : null,
      start_date: mortgage.start_date ?? null,
      monthly_payment: mortgage.monthly_payment,
      includes_escrow: mortgage.includes_escrow ?? undefined,
    });
  };


  const toApiDate = (value: MortgageInput["start_date"]) => value instanceof Date
    ? value.toISOString().slice(0, 10) : value ?? "";

  const save = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const saved = editingId ? await onUpdate(editingId, editData) : await onAdd(editData);
      if (!saved) return;
      setEditingId(null);
      setIsAdding(false);
      setEditData({});
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
              <TableHead className="px-4 py-3">Property</TableHead>
              <TableHead className="font-semibold px-4 py-3">Original Principal</TableHead> 
              <TableHead className="font-semibold px-4 py-3">Current Balance</TableHead>   
              <TableHead className="font-semibold px-4 py-3">Rate (%)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Term (months)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Start Date</TableHead>
              <TableHead className="px-4 py-2">Escrow (T&amp;I)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Monthly Payment</TableHead>
              <TableHead className="font-semibold px-4 py-3 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mortgages.map((mortgage) => {
              const originalPrincipal = mortgage.principal_original ?? mortgage.principal;
              return (
              <TableRow key={mortgage.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {editingId === mortgage.id ? (
                  <>
                    {/* NEW: Property select */}
                    <TableCell className="px-4 py-3">
                      <select
                        className="h-8 w-full rounded-md border border-input bg-background px-2"
                        value={editData.property_id ?? ""}
                        onChange={(e) => setEditData({ ...editData, property_id: e.target.value || undefined })}
                      >
                        <option value="">Select property…</option>
                        {propertyOptions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        placeholder="Original Principal"
                        value={editData.principal_original ?? ""}
                        onChange={(e) =>
                          setEditData({ ...editData, principal_original: e.target.value === "" ? null : Number(e.target.value) })
                        }
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        placeholder="Current Balance"
                        value={editData.current_balance ?? ""}
                        onChange={(e) =>
                          setEditData({ ...editData, current_balance: e.target.value === "" ? null : Number(e.target.value) })
                        }
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.interest_rate ?? ""}
                        onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={editData.term_months ?? ""}
                        onChange={(e) => setEditData({ ...editData, term_months: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="date" aria-label="Loan start date"
                        value={toApiDate(editData.start_date) ?? ""}
                        onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    {/* NEW: Escrow checkbox (edit mode) */}
                    <TableCell className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={!!editData.includes_escrow}
                          onChange={(e) => setEditData({ ...editData, includes_escrow: e.target.checked })}
                        />
                        In mortgage
                      </label>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={editData.monthly_payment ?? ""}
                        onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={save} aria-label="Save mortgage" disabled={saving} className="h-8 hover:scale-105 transition-transform">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel mortgage edit" disabled={saving} className="h-8 hover:scale-105 transition-transform">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                  {/* NEW: read-mode name */}
                    <TableCell className="px-4 py-3"> {propertyOptions.find(p => p.id === mortgage.property_id)?.name ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3">{originalPrincipal == null ? "—" : `$${originalPrincipal.toLocaleString()}`}</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.current_balance == null ? "—" : `$${mortgage.current_balance.toLocaleString()}`}</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.interest_rate}%</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.term_months}</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.start_date ? new Date(mortgage.start_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={!!mortgage.includes_escrow}
                          onChange={(e) => onUpdate(mortgage.id, { includes_escrow: e.target.checked })}
                        />
                        In mortgage
                      </label>
                    </TableCell>
                    <TableCell className="px-4 py-3">${mortgage.monthly_payment.toLocaleString()}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(mortgage)} disabled={saving} className="h-8 hover:scale-105 transition-transform">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(mortgage.id)} aria-label={`Delete mortgage ${mortgage.loan_name ?? ""}`} className="h-8 hover:scale-105 transition-transform text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
              );
            })}
            {isAdding && (
              <TableRow className="bg-muted/20 border-b border-border/50">
                <TableCell className="px-4 py-3">
                  <select
                    className="h-8 w-full rounded-md border border-input bg-background px-2"
                    value={editData.property_id ?? ""}
                    onChange={(e) => setEditData({ ...editData, property_id: e.target.value || undefined })}
                  >
                    <option value="">Select property…</option>
                    {propertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    placeholder="Original Principal"
                    value={editData.principal_original ?? ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      principal_original: e.target.value === "" ? null : Number(e.target.value)
                    })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    placeholder="Current Balance"
                    value={editData.current_balance ?? ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      current_balance: e.target.value === "" ? null : Number(e.target.value)
                    })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate %"
                    value={editData.interest_rate ?? ""}
                    onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    placeholder="Term"
                    value={editData.term_months ?? ""}
                    onChange={(e) => setEditData({ ...editData, term_months: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="date" aria-label="Loan start date"
                    value={toApiDate(editData.start_date) ?? ""}
                    onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                {/* NEW: Escrow toggle (add mode) */}
                <TableCell className="px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!editData.includes_escrow}
                      onChange={(e) => setEditData({ ...editData, includes_escrow: e.target.checked })}
                    />
                    In mortgage
                  </label>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    placeholder="Monthly payment"
                    value={editData.monthly_payment ?? ""}
                    onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={save} aria-label="Save mortgage" disabled={saving} className="h-8 hover:scale-105 transition-transform">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setEditData({}); }} aria-label="Cancel new mortgage" disabled={saving} className="h-8 hover:scale-105 transition-transform">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!isAdding && (
        <div className="p-4 border-t border-border">
          <Button
            disabled={saving}
            onClick={() => { setEditingId(null); setEditData({ includes_escrow: false }); setIsAdding(true); }}
            variant="outline"
            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Mortgage
          </Button>
        </div>
      )}
    </Card>
  );
};
