import { format } from "date-fns";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePortfolio } from "@/features/portfolio/usePortfolio";
import { Home, TrendingUp, Calculator, Database, FileText } from "lucide-react";
import { PropertyFilter } from "@/features/properties/PropertyFilter";
import type { Property } from "@/features/properties/PropertiesTable";
import type { MortgageInput } from "@/components/MortgagesTable";
import type { ManualLeaseInput } from "@/features/leases/LeaseTable";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { manualLeaseForm, mortgageEscrowChange, mortgageForm, propertyForm } from "@/features/portfolio/recordValidation";
import { useToast } from "@/hooks/use-toast";
import DealsScenarios from "@/pages/DealsScenarios";
import Memo from "@/pages/Memo";
import PortfolioDecisions from "@/pages/PortfolioDecisions";
import PortfolioSnapshot from "@/pages/PortfolioSnapshot";
import DataRoom from "@/pages/DataRoom";
import { modelPortfolio } from "@/domain/finance/portfolio";
import type { DealAssumptions } from "@/domain/finance/underwriting";

type RecordKind = "property" | "lease" | "mortgage";
const recordTable = { property: "properties", lease: "leases", mortgage: "mortgages" } as const;

type View = "snapshot" | "portfolio" | "database" | "deals" | "memo";

const Index = ({ userId }: { userId: string }) => {
  const query = usePortfolio(userId);
  const { properties, leases, mortgages, record } = query.portfolio;
  const [propertySelection, setSelectedProperty] = useState("");
  const selectedProperty = properties.some(property => property.id === propertySelection) ? propertySelection : "";
  const refresh = query.refresh;
  const [marketRate, setMarketRate] = useState("");
  const [dealAssumptions, setDealAssumptions] = useState<DealAssumptions | null>(null);
  const { toast } = useToast();
  const propertyOptions = properties.map(property => ({ id: property.id, name: property.alias }));
  const filteredProperties = selectedProperty ? properties.filter(property => property.id === selectedProperty) : properties;
  const filteredLeases = selectedProperty ? leases.filter(lease => lease.property_id === selectedProperty) : leases;
  const filteredMortgages = selectedProperty ? mortgages.filter(loan => loan.property_id === selectedProperty) : mortgages;
  const escrowByProperty = new Map(mortgages.flatMap(loan => loan.property_id && loan.includes_escrow ? [[loan.property_id, true] as const] : []));
  const asOf = format(new Date(), "yyyy-MM-dd");
  const marketRatePct = marketRate.trim() !== "" && Number.isFinite(Number(marketRate)) && Number(marketRate) >= 0 ? Number(marketRate) : null;
  const metrics = modelPortfolio(filteredProperties, record, asOf, marketRatePct);
  const rentScenario = (increase: number) => modelPortfolio(filteredProperties, {
    ...record,
    leases: record.leases?.map(lease => ({ ...lease, monthly_rent: lease.monthly_rent * (1 + increase / 100) })) ?? null,
  }, asOf, marketRatePct);

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
  const requestDelete = (kind: RecordKind, id: string, name: string) => {
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
      if (kind === "property" && selectedProperty === id) setSelectedProperty("");
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

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [view, setView] = useState<View>("snapshot");
  const openDataRoom = () => setView("database");
  const isPortfolioView = view === "snapshot" || view === "portfolio" || view === "database";

const LeftNav = ({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) => {
  const items: { key: View; label: string; icon: typeof Home }[] = [
    { key: "snapshot", label: "Portfolio Snapshot", icon: Home },
    { key: "portfolio", label: "Portfolio Decisions", icon: TrendingUp },
    { key: "deals", label: "Deal Underwriting", icon: Calculator },
    { key: "memo", label: "Investment Memo", icon: FileText },
    { key: "database", label: "Data Room", icon: Database },
    
  ];

  return (
    <aside
      className={[
        "hidden lg:flex shrink-0 flex-col border-r border-border bg-background/70 backdrop-blur-sm transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      ].join(" ")}

    >

      {/* Nav items */}
      <nav className="px-2 pt-1 pb-3 space-y-1">
        {/* Collapse toggle (separate row) */}
        <div className="flex justify-end px-2">
          <button
            type="button"
            onClick={onToggle}
            className="h-8 w-8 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground grid place-items-center"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => setView(it.key)}
              className={[
                "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                view === it.key
                  ? "bg-primary/10 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                collapsed ? "justify-center" : "",
              ].join(" ")}
              title={collapsed ? it.label : undefined}
            >
              <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              {!collapsed && <span className="truncate">{it.label}</span>}
            </button>

            
          );
        })}
      </nav>

    </aside>
  );
};

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background flex">
      <LeftNav collapsed={navCollapsed} onToggle={() => setNavCollapsed(v => !v)} />

    <div className="flex-1 min-w-0">

      <main className="container mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
        
        {isPortfolioView && query.isSuccess && properties.length > 0 && (
          <PropertyFilter properties={propertyOptions.map(property => ({
            id: property.id,
            alias: property.name,
            address: properties.find(row => row.id === property.id)?.address ?? "",
          }))} selectedProperty={selectedProperty} onPropertyChange={setSelectedProperty} />
        )}
        {isPortfolioView && query.isPending && <p role="status" className="text-sm text-muted-foreground">Loading portfolio records…</p>}
        {isPortfolioView && query.isError && (
          <section className="space-y-3">
            <p role="alert">{query.error.message} Try loading the portfolio again.</p>
            <Button onClick={() => void query.refetch()} disabled={query.isFetching}>Retry loading portfolio</Button>
          </section>
        )}
        {query.isSuccess && view === "snapshot" && <PortfolioSnapshot metrics={metrics} onAddData={openDataRoom} />}

        {query.isSuccess && view === "database" && (
          <DataRoom ownerId={userId} selectedProperty={selectedProperty} onLeaseCaptured={refresh}
            filteredProperties={filteredProperties}
            filteredLeases={filteredLeases}
            filteredMortgages={filteredMortgages}
            mortgages={mortgages}
            properties={properties}
            propertyOptions={propertyOptions}
            escrowByProperty={escrowByProperty}
            onAddProperty={saveProperty}
            onUpdateProperty={(id, input) => saveProperty(input, id)}
            onDeleteProperty={(id) => requestDelete("property", id, properties.find(property => property.id === id)?.alias ?? "Property")}
            onAddLease={(id, input) => saveManualLease(id, input, false)}
            onUpdateLease={(id, input) => saveManualLease(id, input, true)}
            onDeleteLease={(id) => requestDelete("lease", id, leases.find(lease => lease.id === id)?.tenant ?? "Lease")}
            onAddMortgage={saveMortgage}
            onUpdateMortgage={(id, input) => saveMortgage(input, id)}
            onDeleteMortgage={(id) => requestDelete("mortgage", id, mortgages.find(mortgage => mortgage.id === id)?.loan_name ?? "Mortgage")}
          />
        )}

        {view === "deals" && <DealsScenarios initialAssumptions={dealAssumptions} onAssumptionsChange={setDealAssumptions} />}

        {view === "memo" && <Memo assumptions={dealAssumptions} onOpenUnderwriting={() => setView("deals")} />}

        {query.isSuccess && view === "portfolio" && (
          <PortfolioDecisions metrics={metrics} onAddData={openDataRoom} marketRate={marketRate}
            onMarketRateChange={setMarketRate} rentScenario={rentScenario} />
        )}
        <AlertDialog open={deleteTarget !== null} onOpenChange={open => {
          if (!open && !deleteInFlight.current) setDeleteTarget(null);
        }}>
          {deleteTarget && <AlertDialogContent>
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
      </main>

    </div>

    </div>

  );
};

export default Index;
