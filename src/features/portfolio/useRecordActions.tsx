import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Property } from "@/features/properties/PropertiesTable";
import type { MortgageInput } from "@/components/MortgagesTable";
import type { ManualLeaseInput } from "@/features/leases/LeaseTable";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { manualLeaseForm, mortgageEscrowChange, mortgageForm, propertyForm } from "@/features/portfolio/recordValidation";
import { useToast } from "@/hooks/use-toast";

type RecordKind = "property" | "lease" | "mortgage";
const recordTable = { property: "properties", lease: "leases", mortgage: "mortgages" } as const;

export function useRecordActions({ userId, properties, refresh, selectedProperty, clearProperty }: {
  userId: string;
  properties: Property[];
  refresh: () => Promise<void>;
  selectedProperty: string;
  clearProperty: () => void;
}) {
  const { toast } = useToast();
  const showWriteError = (title: string, description: string) => {
    toast({ title, description, variant: "destructive" });
    return false;
  };

  const saveManualLease = async (id: string, data: ManualLeaseInput, editing: boolean) => {
    const result = manualLeaseForm.safeParse(data);
    if (!result.success) return showWriteError("Check the lease", result.error.issues[0].message);
    const lease = result.data;
    if (!properties.some(property => property.id === lease.property_id)) {
      return showWriteError("Select a property", "Choose a property from this portfolio.");
    }

    const { data: saved, error } = await supabase.rpc("save_manual_lease", {
      p_lease_id: id,
      p_edit: editing,
      p_property_id: lease.property_id,
      p_unit_label: lease.unit_label,
      p_tenant_name: lease.tenant,
      p_start_date: lease.startDate,
      p_end_date: lease.leaseEnd,
      p_monthly_rent: lease.monthlyRent,
      p_deposit: lease.deposit,
      p_status: lease.status ?? null,
    });
    if (error || saved !== id) return showWriteError("Lease save failed", "Check the lease details and try again.");
    await refresh();
    toast({ title: editing ? "Lease updated" : "Lease added" });
    return true;
  };

  const saveMortgage = async (input: MortgageInput, id?: string) => {
    const escrowOnly = mortgageEscrowChange.safeParse(input);
    let payload: TablesUpdate<"mortgages">;
    if (id && escrowOnly.success) {
      payload = escrowOnly.data;
    } else {
      const result = mortgageForm.safeParse(input);
      if (!result.success) return showWriteError("Check the mortgage", result.error.issues[0].message);
      const mortgage = result.data;
      if (!properties.some(property => property.id === mortgage.property_id)) {
        return showWriteError("Select a property", "Choose a property from this portfolio.");
      }
      payload = {
        ...mortgage,
        loan_name: mortgage.loan_name || undefined,
        principal: mortgage.principal_original,
      };

      if (!id) {
        const { error } = await supabase.from("mortgages").insert({
          ...mortgage,
          loan_name: mortgage.loan_name || undefined,
          principal: mortgage.principal_original,
          user_id: userId,
        });
        if (error) return showWriteError("Mortgage save failed", "Check the mortgage details and try again.");
        await refresh();
        toast({ title: "Mortgage added" });
        return true;
      }
    }

    const { error } = await supabase.from("mortgages").update(payload)
      .eq("user_id", userId).eq("id", id!).select("id").single();
    if (error) return showWriteError("Mortgage save failed", "Check the mortgage details and try again.");
    await refresh();
    toast({ title: "Mortgage updated" });
    return true;
  };

  const saveProperty = async (input: Partial<Property>, id?: string) => {
    const result = propertyForm.safeParse(input);
    if (!result.success) return showWriteError("Check the property", result.error.issues[0].message);
    const { sale_price, ...property } = result.data;
    const payload = { ...property, purchase_price: sale_price };
    const { error } = id
      ? await supabase.from("properties").update(payload).eq("user_id", userId).eq("id", id).select("id").single()
      : await supabase.from("properties").insert({ ...payload, user_id: userId }).select("id").single();
    if (error) {
      return showWriteError("Property save failed", error.code === "23505"
        ? "Use a property name that is unique in this portfolio."
        : "Check the property details and try again.");
    }

    await refresh();
    toast({ title: id ? "Property updated" : "Property added" });
    return true;
  };

  const [deleteTarget, setDeleteTarget] = useState<{ kind: RecordKind; id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteInFlight = useRef(false);
  const deleteTrigger = useRef<HTMLElement | null>(null);
  const requestDelete = (kind: RecordKind, id: string, name: string) => {
    deleteTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDeleteError(false);
    setDeleteTarget({ kind, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeleting(true);
    setDeleteError(false);
    const { kind, id } = deleteTarget;
    try {
      const { error } = await supabase.from(recordTable[kind]).delete()
        .eq("user_id", userId).eq("id", id).select("id").single();
      if (error) {
        setDeleteError(true);
        return;
      }
      if (kind === "property" && selectedProperty === id) clearProperty();
      deleteTrigger.current = null;
      setDeleteTarget(null);
      await refresh();
      toast({ title: "Record deleted" });
    } catch {
      setDeleteError(true);
    } finally {
      deleteInFlight.current = false;
      setDeleting(false);
    }
  };


  const deleteDialog = (
    <AlertDialog open={deleteTarget !== null} onOpenChange={open => {
          if (!open && !deleteInFlight.current) setDeleteTarget(null);
        }}>
          {deleteTarget && <AlertDialogContent onCloseAutoFocus={event => {
            event.preventDefault();
            const trigger = deleteTrigger.current;
            if (trigger?.isConnected && !trigger.matches(":disabled")) trigger.focus();
            else document.getElementById("holdings-title")?.focus();
          }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteTarget.kind}?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget.name} will be permanently deleted.
                {deleteTarget.kind === "property" && " Its linked units, leases, mortgages, and other dependent records will also be deleted."}
                {deleteTarget.kind === "lease" && " Its linked payment records will also be deleted."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && <p role="alert" className="text-sm text-destructive">The record could not be deleted. Try again.</p>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
                {deleting ? "Deleting…" : `Delete ${deleteTarget.kind}`}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>}
        </AlertDialog>
  );
  return { saveProperty, saveManualLease, saveMortgage, requestDelete, deleteDialog };
}
