import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Save, X, Plus } from "lucide-react";
import { format } from "date-fns";

interface LeaseData {
  id: string;
  tenant: string;
  unit: string;
  monthlyRent: number;
  deposit: number;
  startDate: Date;
  leaseEnd: Date;
}

interface LeaseTableProps {
  leases: LeaseData[];
  onUpdate: (id: string, data: Partial<LeaseData>) => void;
  onDelete: (id: string) => void;
  onAdd: (data: Omit<LeaseData, "id">) => void;
}

export const LeaseTable = ({ leases, onUpdate, onDelete, onAdd }: LeaseTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LeaseData>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newLease, setNewLease] = useState<Omit<LeaseData, "id">>({
    tenant: "",
    unit: "",
    monthlyRent: 0,
    deposit: 0,
    startDate: new Date(),
    leaseEnd: new Date(),
  });

  const handleEdit = (lease: LeaseData) => {
    setEditingId(lease.id);
    setEditData(lease);
  };

  const handleSave = () => {
    if (editingId && editData) {
      onUpdate(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAddNew = () => {
    if (newLease.tenant && newLease.unit) {
      onAdd(newLease);
      setNewLease({
        tenant: "",
        unit: "",
        monthlyRent: 0,
        deposit: 0,
        startDate: new Date(),
        leaseEnd: new Date(),
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Tenant</TableHead>
            <TableHead className="font-semibold">Unit</TableHead>
            <TableHead className="font-semibold">Monthly Rent</TableHead>
            <TableHead className="font-semibold">Lease Start</TableHead>
            <TableHead className="font-semibold">Lease End</TableHead>
            <TableHead className="font-semibold">Deposit</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leases.map((lease) => (
            <TableRow key={lease.id} className="hover:bg-muted/30 transition-colors">
              {editingId === lease.id ? (
                <>
                  <TableCell>
                    <Input
                      value={editData.tenant || ""}
                      onChange={(e) => setEditData({ ...editData, tenant: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editData.unit || ""}
                      onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editData.monthlyRent || 0}
                      onChange={(e) => setEditData({ ...editData, monthlyRent: parseFloat(e.target.value) })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={editData.startDate ? format(editData.startDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => setEditData({ ...editData, startDate: new Date(e.target.value) })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={editData.leaseEnd ? format(editData.leaseEnd, "yyyy-MM-dd") : ""}
                      onChange={(e) => setEditData({ ...editData, leaseEnd: new Date(e.target.value) })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editData.deposit || 0}
                      onChange={(e) => setEditData({ ...editData, deposit: parseFloat(e.target.value) })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-medium">{lease.tenant}</TableCell>
                  <TableCell>{lease.unit}</TableCell>
                  <TableCell>${lease.monthlyRent.toLocaleString()}</TableCell>
                  <TableCell>{format(lease.startDate, "MMM d, yyyy")}</TableCell>
                  <TableCell>{format(lease.leaseEnd, "MMM d, yyyy")}</TableCell>
                  <TableCell>${lease.deposit.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(lease)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(lease.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {isAdding && (
            <TableRow className="bg-primary-light/10">
              <TableCell>
                <Input
                  placeholder="Tenant name"
                  value={newLease.tenant}
                  onChange={(e) => setNewLease({ ...newLease, tenant: e.target.value })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Unit"
                  value={newLease.unit}
                  onChange={(e) => setNewLease({ ...newLease, unit: e.target.value })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Rent"
                  value={newLease.monthlyRent}
                  onChange={(e) => setNewLease({ ...newLease, monthlyRent: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={format(newLease.startDate, "yyyy-MM-dd")}
                  onChange={(e) => setNewLease({ ...newLease, startDate: new Date(e.target.value) })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={format(newLease.leaseEnd, "yyyy-MM-dd")}
                  onChange={(e) => setNewLease({ ...newLease, leaseEnd: new Date(e.target.value) })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Deposit"
                  value={newLease.deposit}
                  onChange={(e) => setNewLease({ ...newLease, deposit: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleAddNew}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!isAdding && (
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Lease
          </Button>
        </div>
      )}
    </div>
  );
};
