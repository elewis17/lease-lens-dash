import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";

type PropertyOption = { id: string; name: string };

interface Mortgage {
  id: string;
  property_id?: string; // NEW
  loan_name: string;
  principal: number;
  principal_original?: number | null;  
  current_balance?: number | null;   
  interest_rate: number;
  term_months: number;
  start_date: Date;
  monthly_payment: number;
  includes_escrow?: boolean;  // NEW
}

interface MortgagesTableProps {
  mortgages: Mortgage[];
  onUpdate: (id: string, data: Partial<Mortgage>) => void;
  onDelete: (id: string) => void;
  onAdd: (data: Omit<Mortgage, "id">) => void;
  propertyOptions: PropertyOption[]; // NEW
}

export const MortgagesTable = ({ mortgages, onUpdate, onDelete, onAdd, propertyOptions}: MortgagesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const handleEdit = (mortgage: Mortgage) => {
    setEditingId(mortgage.id);
    setEditData({
      property_id: mortgage.property_id ?? null,
      loan_name: mortgage.loan_name ?? "",
      principal: typeof mortgage.principal === "number" ? mortgage.principal : null,
      principal_original: typeof mortgage.principal_original === "number" ? mortgage.principal_original : null,
      current_balance: typeof mortgage.current_balance === "number" ? mortgage.current_balance : null,
      interest_rate: typeof mortgage.interest_rate === "number" ? mortgage.interest_rate : null,
      term_months: typeof mortgage.term_months === "number" ? mortgage.term_months : null,
      start_date: mortgage.start_date ?? null,
      monthly_payment: typeof mortgage.monthly_payment === "number" ? mortgage.monthly_payment : null,
    });
  };


    // helpers
    const numOrNull = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));
    const intOrNull = (v: any) => (v === "" || v === undefined || v === null ? null : parseInt(v));
    const toApiDate = (d: string | Date | null | undefined): string | null => {
      if (!d) return null;
      if (d instanceof Date) return d.toISOString().slice(0, 10);  // YYYY-MM-DD
      // if already a string, pass through (assume YYYY-MM-DD)
      return d;
    };

    const handleSave = () => {
      if (!editingId) return;

      const payload: any = {
        property_id: editData.property_id || null,
        loan_name: (editData.loan_name ?? "").toString().trim() || null,

        // balances
        principal_original: numOrNull(editData.principal_original),
        current_balance:   numOrNull(editData.current_balance),
        principal:         numOrNull(editData.principal), // legacy

        // terms
        interest_rate:  numOrNull(editData.interest_rate),
        term_months:    intOrNull(editData.term_months),
        start_date:     toApiDate(editData.start_date),   // ✅ handles Date or string
        monthly_payment: numOrNull(editData.monthly_payment),
        includes_escrow: !!editData.includes_escrow,  
      };

      // drop undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      onUpdate(editingId, payload);
      setEditingId(null);
    };

  const handleAddNew = () => {
    onAdd({
      property_id: editData.property_id,
      loan_name: editData.loan_name || "Primary Mortgage",
      // keep "principal" for legacy if your backend expects it; else set null
      principal: editData.principal ? Number(editData.principal) : 0,
      principal_original: editData.principal_original ?? null, // ✅ NEW
      current_balance: editData.current_balance ?? null,       // ✅ NEW
      interest_rate: parseFloat(editData.interest_rate) || 0,
      term_months: parseInt(editData.term_months) || 360,
      start_date: new Date(editData.start_date || new Date()),
      monthly_payment: parseFloat(editData.monthly_payment) || 0,
      includes_escrow: !!editData.includes_escrow,
    } as Omit<Mortgage, "id">);
    setIsAdding(false);
    setEditData({});
  };

  return (
    <Card className="rounded-xl shadow-sm border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="px-4 py-3">Property</TableHead> {/* NEW */}
              <TableHead className="font-semibold px-4 py-3">Original Principal</TableHead> 
              <TableHead className="font-semibold px-4 py-3">Current Balance</TableHead>   
              <TableHead className="font-semibold px-4 py-3">Rate (%)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Term (months)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Start Date</TableHead>
              <TableHead className="px-4 py-2">Escrow (T&amp;I)</TableHead> {/* NEW */}
              <TableHead className="font-semibold px-4 py-3">Monthly Payment</TableHead>
              <TableHead className="font-semibold px-4 py-3 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mortgages.map((mortgage) => (
              <TableRow key={mortgage.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {editingId === mortgage.id ? (
                  <>
                    {/* NEW: Property select */}
                    <TableCell className="px-4 py-3">
                      <select
                        className="h-8 w-full rounded-md border border-input bg-background px-2"
                        value={editData.property_id ?? mortgage.property_id ?? ""}
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
                        value={editData.interest_rate}
                        onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={editData.term_months}
                        onChange={(e) => setEditData({ ...editData, term_months: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="date"
                        value={editData.start_date instanceof Date ? editData.start_date.toISOString().split('T')[0] : editData.start_date}
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
                        value={editData.monthly_payment}
                        onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 hover:scale-105 transition-transform">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 hover:scale-105 transition-transform">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                  {/* NEW: read-mode name */}
                    <TableCell className="px-4 py-3"> {propertyOptions.find(p => p.id === mortgage.property_id)?.name ?? "—"}</TableCell>
                    <TableCell className="font-medium px-4 py-3">{mortgage.loan_name}</TableCell>
                    <TableCell className="px-4 py-3">${ (mortgage.principal_original ?? mortgage.principal ?? 0).toLocaleString() }</TableCell>
                    <TableCell className="px-4 py-3">${ (mortgage.current_balance ?? mortgage.principal ?? 0).toLocaleString() }</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.interest_rate}%</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.term_months}</TableCell>
                    <TableCell className="px-4 py-3">{new Date(mortgage.start_date).toLocaleDateString()}</TableCell>
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
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(mortgage)} className="h-8 hover:scale-105 transition-transform">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(mortgage.id)} className="h-8 hover:scale-105 transition-transform text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
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
                    value={editData.interest_rate || ""}
                    onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    placeholder="Term"
                    value={editData.term_months || ""}
                    onChange={(e) => setEditData({ ...editData, term_months: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="date"
                    value={editData.start_date || ""}
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
                    value={editData.monthly_payment || ""}
                    onChange={(e) => setEditData({ ...editData, monthly_payment: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={handleAddNew} className="h-8 hover:scale-105 transition-transform">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setEditData({}); }} className="h-8 hover:scale-105 transition-transform">
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
            onClick={() => setIsAdding(true)}
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
