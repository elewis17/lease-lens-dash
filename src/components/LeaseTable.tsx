import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Save, X, Plus, Edit } from "lucide-react";
import { format } from "date-fns";

interface LeaseData {
  id: string;
  tenant: string;
  unit: string;
  monthlyRent: number;
  vacancyRate?: number;
  deposit: number;
  startDate: Date;
  leaseEnd: Date;
  property_id?: string; // ✅ NEW
}

type PropertyOption = { id: string; name: string }; // NEW

interface LeaseTableProps {
  leases: LeaseData[];
  onUpdate: (id: string, data: Partial<LeaseData>) => void;
  onDelete: (id: string) => void;
  onAdd: (data: Omit<LeaseData, "id">) => void;
  propertyOptions: PropertyOption[]; // NEW
}

export const LeaseTable = ({ leases, onUpdate, onDelete, onAdd, propertyOptions}: LeaseTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LeaseData>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newLease, setNewLease] = useState<Omit<LeaseData, "id">>({
    tenant: "",
    unit: "",
    monthlyRent: 0,
    vacancyRate: 5,
    deposit: 0,
    startDate: new Date(),
    leaseEnd: new Date(),
    property_id: undefined, // ✅ NEW
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
        vacancyRate: 5,
        deposit: 0,
        startDate: new Date(),
        leaseEnd: new Date(),
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-sm sticky left-0 bg-muted/50 backdrop-blur-sm">Tenant</TableHead>
              <TableHead className="font-semibold text-sm">Property</TableHead> {/* ✅ NEW */}
              <TableHead className="font-semibold text-sm">Unit</TableHead>
              <TableHead className="font-semibold text-sm">Monthly Rent</TableHead>
              <TableHead className="font-semibold text-sm">Vacancy %</TableHead>
              <TableHead className="font-semibold text-sm">Lease Start</TableHead>
              <TableHead className="font-semibold text-sm">Lease End</TableHead>
              <TableHead className="font-semibold text-sm">Deposit</TableHead>
              <TableHead className="font-semibold text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {leases.map((lease) => (
            <TableRow key={lease.id} className="hover:bg-muted/30 transition-colors">
              {editingId === lease.id ? (
                <>
                  <TableCell className="sticky left-0 bg-card backdrop-blur-sm">
                    <Input
                      value={editData.tenant || ""}
                      onChange={(e) => setEditData({ ...editData, tenant: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-8 text-sm w-full rounded-md border border-input bg-background px-2"
                      value={editData.property_id ?? ""}
                      onChange={(e) => setEditData({ ...editData, property_id: e.target.value || undefined })}
                    >
                      <option value="">Select property…</option>
                      {propertyOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editData.unit || ""}
                      onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editData.monthlyRent || 0}
                      onChange={(e) => setEditData({ ...editData, monthlyRent: parseFloat(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={editData.vacancyRate ?? 5}
                      onChange={(e) => setEditData({ ...editData, vacancyRate: parseFloat(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={editData.startDate ? format(editData.startDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => setEditData({ ...editData, startDate: new Date(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={editData.leaseEnd ? format(editData.leaseEnd, "yyyy-MM-dd") : ""}
                      onChange={(e) => setEditData({ ...editData, leaseEnd: new Date(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editData.deposit || 0}
                      onChange={(e) => setEditData({ ...editData, deposit: parseFloat(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handleSave} className="hover:scale-105 transition-transform">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancel} className="hover:scale-105 transition-transform">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-medium text-sm sticky left-0 bg-card backdrop-blur-sm">{lease.tenant}</TableCell>
                  <TableCell className="text-sm">{propertyOptions.find(p => p.id === lease.property_id)?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{lease.unit}</TableCell>
                  <TableCell className="text-sm font-semibold">${lease.monthlyRent.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{lease.vacancyRate ?? 5}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(lease.startDate, "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(lease.leaseEnd, "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-sm">${lease.deposit.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(lease)} className="hover:scale-105 transition-transform">
                        <Edit className="h-3 w-3 mr-1" />
                        <span className="text-xs">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(lease.id)} className="hover:scale-105 transition-transform">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {isAdding && (
            <TableRow className="bg-primary/5 animate-fade-in">
              <TableCell className="sticky left-0 bg-primary/5 backdrop-blur-sm">
                <Input
                  placeholder="Tenant name"
                  value={newLease.tenant}
                  onChange={(e) => setNewLease({ ...newLease, tenant: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <select
                  className="h-8 text-sm w-full rounded-md border border-input bg-background px-2"
                  value={newLease.property_id ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, property_id: e.target.value || undefined })}
                >mo
                  <option value="">Select property…</option>
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Unit"
                  value={newLease.unit}
                  onChange={(e) => setNewLease({ ...newLease, unit: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Rent"
                  value={newLease.monthlyRent}
                  onChange={(e) => setNewLease({ ...newLease, monthlyRent: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Vacancy %"
                  value={newLease.vacancyRate ?? 5}
                  onChange={(e) => setNewLease({ ...newLease, vacancyRate: parseFloat(e.target.value) || 5 })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={format(newLease.startDate, "yyyy-MM-dd")}
                  onChange={(e) => setNewLease({ ...newLease, startDate: new Date(e.target.value) })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={format(newLease.leaseEnd, "yyyy-MM-dd")}
                  onChange={(e) => setNewLease({ ...newLease, leaseEnd: new Date(e.target.value) })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Deposit"
                  value={newLease.deposit}
                  onChange={(e) => setNewLease({ ...newLease, deposit: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleAddNew} className="hover:scale-105 transition-transform">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="hover:scale-105 transition-transform">
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
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            Add New Lease
          </Button>
        </div>
      )}
    </div>
  );
};
