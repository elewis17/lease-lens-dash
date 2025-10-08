import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Mortgage {
  id: string;
  loan_name: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: Date;
  monthly_payment: number;
}

interface MortgagesTableProps {
  mortgages: Mortgage[];
  onUpdate: (id: string, data: Partial<Mortgage>) => void;
  onDelete: (id: string) => void;
  onAdd: (data: Omit<Mortgage, "id">) => void;
}

export const MortgagesTable = ({ mortgages, onUpdate, onDelete, onAdd }: MortgagesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const handleEdit = (mortgage: Mortgage) => {
    setEditingId(mortgage.id);
    setEditData({
      loan_name: mortgage.loan_name,
      principal: mortgage.principal,
      interest_rate: mortgage.interest_rate,
      term_months: mortgage.term_months,
      start_date: mortgage.start_date,
      monthly_payment: mortgage.monthly_payment,
    });
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, editData);
      setEditingId(null);
    }
  };

  const handleAddNew = () => {
    onAdd({
      loan_name: editData.loan_name || "Primary Mortgage",
      principal: parseFloat(editData.principal) || 0,
      interest_rate: parseFloat(editData.interest_rate) || 0,
      term_months: parseInt(editData.term_months) || 360,
      start_date: new Date(editData.start_date || new Date()),
      monthly_payment: parseFloat(editData.monthly_payment) || 0,
    });
    setIsAdding(false);
    setEditData({});
  };

  return (
    <Card className="rounded-xl shadow-sm border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="font-semibold px-4 py-3">Loan Name</TableHead>
              <TableHead className="font-semibold px-4 py-3">Principal</TableHead>
              <TableHead className="font-semibold px-4 py-3">Rate (%)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Term (months)</TableHead>
              <TableHead className="font-semibold px-4 py-3">Start Date</TableHead>
              <TableHead className="font-semibold px-4 py-3">Monthly Payment</TableHead>
              <TableHead className="font-semibold px-4 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mortgages.map((mortgage) => (
              <TableRow key={mortgage.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {editingId === mortgage.id ? (
                  <>
                    <TableCell className="px-4 py-3">
                      <Input
                        value={editData.loan_name}
                        onChange={(e) => setEditData({ ...editData, loan_name: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        type="number"
                        value={editData.principal}
                        onChange={(e) => setEditData({ ...editData, principal: e.target.value })}
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
                    <TableCell className="font-medium px-4 py-3">{mortgage.loan_name}</TableCell>
                    <TableCell className="px-4 py-3">${mortgage.principal.toLocaleString()}</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.interest_rate}%</TableCell>
                    <TableCell className="px-4 py-3">{mortgage.term_months}</TableCell>
                    <TableCell className="px-4 py-3">{new Date(mortgage.start_date).toLocaleDateString()}</TableCell>
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
                  <Input
                    placeholder="Loan name"
                    value={editData.loan_name || ""}
                    onChange={(e) => setEditData({ ...editData, loan_name: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Input
                    type="number"
                    placeholder="Principal"
                    value={editData.principal || ""}
                    onChange={(e) => setEditData({ ...editData, principal: e.target.value })}
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
