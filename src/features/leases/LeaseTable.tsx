import { useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Save, X, Plus, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Constants, type Enums } from "@/integrations/supabase/types";

type LeaseStatus = Enums<"lease_status">;
const isLeaseStatus = (value: string): value is LeaseStatus =>
  Constants.public.Enums.lease_status.some((status) => value === status);

export interface LeaseData {
  id: string;
  tenant: string;
  documentPath?: string | null;
  monthlyRent: number;
  deposit: number | null;
  startDate: string | null;
  leaseEnd: string | null;
  property_id?: string;
  // NEW FIELDS
  status?: LeaseStatus | null;
  unit_id?: string | null;
  unit_label?: string | null; // from units table (joined in Index.tsx)
}

export type ManualLeaseInput = Partial<Omit<LeaseData, "id" | "monthlyRent" | "deposit" | "documentPath">> & {
  monthlyRent?: number | string;
  deposit?: number | string | null;
};

type PropertyOption = { id: string; name: string }; // NEW

interface LeaseTableProps {
  leases: LeaseData[];
  termsOnly?: boolean;
  selectedProperty?: string;
  onUpdate: (id: string, data: ManualLeaseInput) => Promise<boolean>;
  onDelete: (id: string) => void;
  onAdd: (id: string, data: ManualLeaseInput) => Promise<boolean>;
  propertyOptions: PropertyOption[]; 
}

export const LeaseTable = ({ leases, onUpdate, onDelete, onAdd, propertyOptions, termsOnly = false, selectedProperty }: LeaseTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ManualLeaseInput>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newLease, setNewLease] = useState<ManualLeaseInput>({});
  const [saving, setSaving] = useState(false);
  const draftId = useRef<string | null>(null);
  const inFlight = useRef(false);

  const handleEdit = (lease: LeaseData) => {
    setEditingId(lease.id);
    setEditData(lease);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const save = async (editing: boolean) => {
    if (inFlight.current) return;
    const id = editing ? editingId : draftId.current;
    if (!id) return;
    inFlight.current = true;
    setSaving(true);
    try {
      const saved = editing ? await onUpdate(id, editData) : await onAdd(id, newLease);
      if (!saved) return;
      if (editing) handleCancel();
      else {
        setNewLease({});
        setIsAdding(false);
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-sm sticky left-0 bg-muted/50 backdrop-blur-sm">Tenant</TableHead>
              <TableHead className="font-semibold text-sm">Property</TableHead>
              <TableHead className="font-semibold text-sm">Unit</TableHead>
              <TableHead className="font-semibold text-sm">Status</TableHead>
              <TableHead className="font-semibold text-sm">Monthly Rent</TableHead>
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
                    <Input aria-label="Tenant name" disabled={termsOnly}
                      value={editData.tenant || ""}
                      onChange={(e) => setEditData({ ...editData, tenant: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <select aria-label="Property" disabled={termsOnly}
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
                  {/* Unit */}
                  <TableCell>
                    <Input aria-label="Unit label" disabled={termsOnly}
                      placeholder="Unit"
                      value={editData.unit_label || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, unit_label: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  {/* Status */}
                  <TableCell>
                    <select aria-label="Lease status"
                      className="h-8 text-sm w-full rounded-md border border-input bg-background px-2"
                      value={editData.status ?? ""}
                      onChange={({ target: { value } }) => {
                        setEditData({ ...editData, status: isLeaseStatus(value) ? value : null });
                      }}
                    >
                      <option value="">Unspecified</option>
                      <option value="active">Active</option>
                      <option value="expiring">Expiring</option>
                      <option value="vacant">Vacant</option>
                      <option value="expired">Inactive</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      aria-label="Monthly rent" value={editData.monthlyRent ?? ""}
                      onChange={(e) => setEditData({ ...editData, monthlyRent: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date" aria-label="Lease start date"
                      value={editData.startDate ?? ""}
                      onChange={(e) => setEditData({ ...editData, startDate: e.target.value || null })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date" aria-label="Lease end date"
                      value={editData.leaseEnd ?? ""}
                      onChange={(e) => setEditData({ ...editData, leaseEnd: e.target.value || null })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      aria-label="Deposit" value={editData.deposit ?? ""}
                      onChange={(e) => setEditData({ ...editData, deposit: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => void save(true)} aria-label="Save lease" disabled={saving} className="hover:scale-105 transition-transform">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancel} aria-label="Cancel lease edit" disabled={saving} className="hover:scale-105 transition-transform">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-medium text-sm sticky left-0 bg-card backdrop-blur-sm">{lease.tenant}</TableCell>
                  <TableCell className="text-sm">{propertyOptions.find(p => p.id === lease.property_id)?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{lease.unit_label ?? "—"}</TableCell>
                  <TableCell className="text-sm capitalize">{lease.status ?? "—"}</TableCell>
                  <TableCell className="text-sm font-semibold">${lease.monthlyRent.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lease.startDate ? format(parseISO(lease.startDate), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lease.leaseEnd ? format(parseISO(lease.leaseEnd), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-sm">{lease.deposit == null ? "—" : `$${lease.deposit.toLocaleString()}`}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(lease)} aria-label={termsOnly ? `Edit lease · ${lease.unit_label}` : `Edit lease for ${lease.tenant}`} disabled={saving} className="hover:scale-105 transition-transform">
                        <Pencil className="h-3 w-3 mr-1" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(lease.id)} aria-label={termsOnly ? `Delete lease · ${lease.unit_label}` : `Delete lease for ${lease.tenant}`} disabled={saving} className="hover:scale-105 transition-transform">
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
                <Input autoFocus aria-label="Tenant name"
                  placeholder="Tenant name"
                  value={newLease.tenant ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, tenant: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <select aria-label="Property"
                  className="h-8 text-sm w-full rounded-md border border-input bg-background px-2"
                  value={newLease.property_id ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, property_id: e.target.value || undefined })}>
                  <option value="">Select property…</option>
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </TableCell>
               {/* Unit */}
              <TableCell>
                <Input aria-label="Unit label"
                  placeholder="Unit"
                  value={newLease.unit_label || ""}
                  onChange={(e) =>
                    setNewLease({ ...newLease, unit_label: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </TableCell>

              {/* Status */}
              <TableCell>
                <select aria-label="Lease status"
                  className="h-8 text-sm w-full rounded-md border border-input bg-background px-2"
                  value={newLease.status ?? ""}
                  onChange={({ target: { value } }) => {
                    setNewLease({ ...newLease, status: isLeaseStatus(value) ? value : null });
                  }}
                >
                  <option value="">Unspecified</option>
                      <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                  <option value="vacant">Vacant</option>
                  <option value="expired">Inactive</option>
                </select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Rent"
                  aria-label="Monthly rent" value={newLease.monthlyRent ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, monthlyRent: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date" aria-label="Lease start date"
                  value={newLease.startDate ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, startDate: e.target.value || null })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date" aria-label="Lease end date"
                  value={newLease.leaseEnd ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, leaseEnd: e.target.value || null })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Deposit"
                  aria-label="Deposit" value={newLease.deposit ?? ""}
                  onChange={(e) => setNewLease({ ...newLease, deposit: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => void save(false)} aria-label="Save lease" disabled={saving} className="hover:scale-105 transition-transform">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} aria-label="Cancel new lease" disabled={saving} className="hover:scale-105 transition-transform">
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
          <Button variant="outline" size="sm" disabled={saving || !propertyOptions.length} onClick={() => {
            draftId.current = crypto.randomUUID();
            setNewLease({ property_id: selectedProperty || (propertyOptions.length === 1 ? propertyOptions[0].id : undefined), status: "active" });
            handleCancel();
            setIsAdding(true);
          }} className="w-full hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            Add New Lease
          </Button>
        </div>
      )}
    </div>
  );
};
