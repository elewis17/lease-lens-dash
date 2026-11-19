import { format } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";
import { Home, TrendingUp, Calculator, Database, FileText } from "lucide-react";
import { PropertyFilter } from "@/features/properties/PropertyFilter";
import type { Property } from "@/features/properties/PropertiesTable";
import type { Mortgage, MortgageInput } from "@/components/MortgagesTable";
import type { LeaseData } from "@/features/leases/LeaseTable";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DealsScenarios from "@/pages/DealsScenarios";
import Memo from "@/pages/Memo";
import PortfolioDecisions from "@/pages/PortfolioDecisions";
import PortfolioSnapshot from "@/pages/PortfolioSnapshot";
import DataRoom from "@/pages/DataRoom";
import { modelPortfolio, type PortfolioRecord } from "@/domain/finance/portfolio";
import type { DealAssumptions } from "@/domain/finance/underwriting";

const emptyRecord: PortfolioRecord = { units: null, leases: null, loans: null, expenses: null };
type View = "snapshot" | "portfolio" | "database" | "deals" | "memo";

const Index = ({ userId }: { userId: string }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [record, setRecord] = useState(emptyRecord);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const loadVersion = useRef(0);
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

  const loadProperties = useCallback(async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", userId);
      
    setLoadError(Boolean(error));
    setLoaded(true);
    if (error) {
      setProperties([]);
      setSelectedProperty("");
      return;
    }

    const list: Property[] = (data ?? []).map(property => ({
      id: property.id,
      alias: property.alias ?? property.name ?? property.address,
      address: property.address,
      type: property.type,
      sale_price: property.purchase_price ?? property.sale_price,
      property_value: property.property_value,
      property_taxes: property.property_taxes,
      insurance: property.insurance,
      mgmt_pct: property.mgmt_pct,
      vacancy_pct: property.vacancy_pct,
      maintenance_pct: property.maintenance_pct,
      rent_growth_rate: property.rent_growth_rate,
      opex_inflation_rate: property.opex_inflation_rate,
    }));

    setProperties(list);
    setSelectedProperty(current => list.some(property => property.id === current) ? current : "");
  }, [userId]);

  const loadData = useCallback(async () => {
    const version = ++loadVersion.current;
    const propertyIds = properties.map(property => property.id);
    if (propertyIds.length === 0) {
      setRecord(emptyRecord);
      setLeases([]);
      setMortgages([]);
      return;
    }

    const [unitsResult, mortgagesResult, expensesResult] = await Promise.all([
      supabase.from("units").select("id, unit_label, property_id").eq("user_id", userId).in("property_id", propertyIds),
      supabase.from("mortgages").select("*").eq("user_id", userId).in("property_id", propertyIds),
      supabase.from("expenses").select("property_id, unit_id, date, amount, category").eq("user_id", userId),
    ]);
    const units = unitsResult.data;
    const unitById = new Map(units?.map(unit => [unit.id, unit]));
    const leasesResult = unitById.size > 0
      ? await supabase.from("leases").select("id, monthly_rent, status, start_date, end_date, deposit, tenant:tenants(name), unit_id")
        .eq("user_id", userId).in("unit_id", [...unitById.keys()])
      : { data: units ? [] : null, error: unitsResult.error };
    const leaseIds = leasesResult.data?.map(lease => lease.id) ?? [];
    const paymentsResult = leaseIds.length
      ? await supabase.from("payments").select("lease_id, due_date, amount_due, paid_date, paid_amount")
        .eq("user_id", userId).in("lease_id", leaseIds)
      : { data: null };
    if (version !== loadVersion.current) return;

    setRecord({ units, leases: leasesResult.data, loans: mortgagesResult.data, expenses: expensesResult.data, payments: paymentsResult.data });
    setLeases((leasesResult.data ?? []).map(lease => ({
      id: lease.id,
      property_id: unitById.get(lease.unit_id)?.property_id,
      tenant: lease.tenant?.name ?? "Unknown",
      monthlyRent: lease.monthly_rent,
      deposit: lease.deposit ?? 0,
      startDate: lease.start_date,
      leaseEnd: lease.end_date,
      status: lease.status,
      unit_id: lease.unit_id,
      unit_label: unitById.get(lease.unit_id)?.unit_label ?? "—",
    })));
    setMortgages((mortgagesResult.data ?? []).map(loan => ({
      ...loan,
      start_date: loan.start_date ? new Date(loan.start_date) : null,
    })));
  }, [properties, userId]);

  useEffect(() => { void loadProperties(); }, [loadProperties]);
  useEffect(() => { void loadData(); }, [loadData]);

  const handleUpdateLease = async (leaseId: string, data: Partial<LeaseData>) => {
    // 1. Load existing lease so we can update tenant/unit
    const { data: lease, error: fetchErr } = await supabase
      .from("leases")
      .select("tenant_id, unit_id")
      .eq("user_id", userId)
      .eq("id", leaseId)
      .single();

    if (fetchErr || !lease) {
      toast({ title: "Error", description: "Lease not found", variant: "destructive" });
      return;
    }

    const { tenant_id, unit_id } = lease;

    // 2. Update tenant name
    if (data.tenant && tenant_id) {
      await supabase
        .from("tenants")
        .update({ name: data.tenant })
        .eq("user_id", userId)
        .eq("id", tenant_id);
    }

    // 3. Update unit label
    if (data.unit_label && unit_id) {
      await supabase
        .from("units")
        .update({ unit_label: data.unit_label })
        .eq("user_id", userId)
        .eq("id", unit_id);
    }

    // 4. Update lease fields
    const leasePayload: TablesUpdate<"leases"> = {};

    if (data.monthlyRent !== undefined) leasePayload.monthly_rent = data.monthlyRent;
    if (data.deposit !== undefined) leasePayload.deposit = data.deposit;

    if (data.startDate) leasePayload.start_date = data.startDate;
    if (data.leaseEnd) leasePayload.end_date = data.leaseEnd;

    if (data.status) leasePayload.status = data.status;

    // Optional: if UI lets you change property/unit
    if (data.unit_id) leasePayload.unit_id = data.unit_id;
    if (data.property_id) leasePayload.property_id = data.property_id;

    const { error: leaseError } = await supabase
      .from("leases")
      .update(leasePayload)
      .eq("user_id", userId)
      .eq("id", leaseId)
      .select("id")
      .single();

    if (leaseError) {
      toast({ title: "Error", description: "Failed to update lease", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Lease updated successfully" });
    loadData();
  };

  const handleDeleteLease = async (id: string) => {
    const { error } = await supabase.from('leases').delete().eq("user_id", userId).eq("id", id).select("id").single();

    if (error) {
      toast({ title: "Error", description: "Failed to delete lease", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lease deleted successfully" });
      loadData();
    }
  };

  const handleAddLease = async (data: Omit<LeaseData, "id">) => {
    const { startDate, leaseEnd: endDate } = data;
    if (!startDate || !endDate || endDate < startDate) return;

    // 1) Resolve target property
    const targetPropertyId = data.property_id ?? selectedProperty;
    if (!properties.some((property) => property.id === targetPropertyId)) {
      toast({
        title: "Select a property",
        description: "Pick a property before adding a lease.",
        variant: "destructive",
      });
      return;
    }

    // -------------------------------
    // 2) TENANT: find or create by name
    // -------------------------------
    const tenantName = (data.tenant ?? "").trim();
    const unitLabel = (data.unit_label ?? "").trim();
    if (!tenantName || !unitLabel) {
      toast({ title: "Tenant and unit required", description: "Enter a tenant and unit before saving the lease.", variant: "destructive" });
      return;
    }

    let tenantId: string | null = null;

    if (tenantName) {
      // Try to reuse an existing tenant with the same name
      const { data: existingTenant, error: tenantLookupError } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", userId)
        .eq("name", tenantName)
        .maybeSingle();

      if (tenantLookupError && tenantLookupError.code !== "PGRST116") {
        console.error("Error looking up tenant:", tenantLookupError);
      }

      if (existingTenant) {
        tenantId = existingTenant.id;
      } else {
        // Create a new tenant row
        const { data: insertedTenant, error: tenantInsertError } = await supabase
          .from("tenants")
          .insert({ name: tenantName, user_id: userId })
          .select("id")
          .single();

        if (tenantInsertError || !insertedTenant) {
          console.error("Error creating tenant:", tenantInsertError);
          toast({
            title: "Error",
            description: "Failed to create tenant",
            variant: "destructive",
          });
          return;
        }

        tenantId = insertedTenant.id;
      }
    }

    // -------------------------------
    // 3) UNIT: find or create by (property_id + unit_label)
    // -------------------------------
    let unitId: string | null = null;

    if (unitLabel) {
      // Try to reuse an existing unit with same label on this property
      const { data: existingUnit, error: unitLookupError } = await supabase
        .from("units")
        .select("id")
        .eq("user_id", userId)
        .eq("property_id", targetPropertyId)
        .eq("unit_label", unitLabel)
        .maybeSingle();

      if (unitLookupError && unitLookupError.code !== "PGRST116") {
        console.error("Error looking up unit:", unitLookupError);
      }

      if (existingUnit) {
        unitId = existingUnit.id;
      } else {
        // Create new unit row
        const { data: insertedUnit, error: unitInsertError } = await supabase
          .from("units")
          .insert({
            user_id: userId,
            property_id: targetPropertyId,
            unit_label: unitLabel,
          })
          .select("id")
          .single();

        if (unitInsertError || !insertedUnit) {
          console.error("Error creating unit:", unitInsertError);
          toast({
            title: "Error",
            description: "Failed to create unit",
            variant: "destructive",
          });
          return;
        }

        unitId = insertedUnit.id;
      }
    }

    // -------------------------------
    // 4) LEASE: write the foreign keys into leases
    // -------------------------------
    if (!tenantId || !unitId) return;

    const payload: TablesInsert<"leases"> = {
      user_id: userId,
      tenant_id: tenantId,
      property_id: targetPropertyId,
      unit_id: unitId,
      monthly_rent: Number(data.monthlyRent ?? 0),
      deposit: Number(data.deposit ?? 0),
      start_date: startDate,
      end_date: endDate,
      status: data.status ?? "active",
    };

    const { error: leaseError } = await supabase.from("leases").insert(payload);

    if (leaseError) {
      console.error("Error creating lease:", leaseError);
      toast({
        title: "Error",
        description: "Failed to create lease",
        variant: "destructive",
      });
      return;
    }

    await supabase.rpc("update_property_unit_count", {
      target_property: targetPropertyId,
    });

    toast({ title: "Success", description: "Lease added successfully" });
    await loadData();
  };

  //MORTGAGE HANDLERS
  const mortgageNumberMissing = (value: string | number | null | undefined) =>
    value == null || value === "" || !Number.isFinite(Number(value));

  const handleUpdateMortgage = async (id: string, data: MortgageInput) => {
    const { property_id, loan_name, start_date, principal, interest_rate, term_months, monthly_payment } = data;
    if ([property_id, loan_name, start_date].some((field) => field === null || field === "") ||
        [principal, interest_rate, term_months, monthly_payment].some((value) =>
          value !== undefined && mortgageNumberMissing(value))) {
      toast({ title: "Required mortgage details missing", description: "Enter the property, loan name, principal, terms, start date and payment.", variant: "destructive" });
      return;
    }

    const payload: TablesUpdate<"mortgages"> = {};

    if (data.loan_name != null) payload.loan_name = data.loan_name;
    if (data.principal !== undefined) payload.principal = Number(data.principal);
    if (data.principal_original !== undefined) payload.principal_original = Number(data.principal_original);
    if (data.current_balance !== undefined) payload.current_balance = Number(data.current_balance);
    if (data.interest_rate !== undefined) payload.interest_rate = Number(data.interest_rate);
    if (data.term_months !== undefined) payload.term_months = Number(data.term_months);

    if (data.start_date != null)
      payload.start_date = data.start_date instanceof Date 
        ? data.start_date.toISOString() 
        : data.start_date;

    if (data.monthly_payment !== undefined) payload.monthly_payment = Number(data.monthly_payment);
    if (data.includes_escrow !== undefined) payload.includes_escrow = Boolean(data.includes_escrow);
    if (data.property_id != null) payload.property_id = data.property_id;

    const { data: rows, error } = await supabase
      .from("mortgages")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select();

    if (error || !rows?.length) {
      toast({
        title: "Error",
        description: "Failed to update mortgage",
        variant: "destructive",
      });
      return;
    }

    // Update UI with server truth
    const updated = rows?.[0];
    setMortgages(prev =>
      prev.map(m => m.id === id ? {
        ...m,
        ...updated,
        interest_rate: Number(updated.interest_rate ?? 0),
        term_months: Number(updated.term_months ?? 0),
        monthly_payment: Number(updated.monthly_payment ?? 0),
        start_date: updated.start_date ? new Date(updated.start_date) : m.start_date,
      } : m)
    );

    loadData();
  };

  const handleDeleteMortgage = async (id: string) => {
    const { error } = await supabase.from('mortgages').delete().eq("user_id", userId).eq("id", id).select("id").single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete mortgage", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Mortgage deleted successfully" });
      loadData();
    }
  };

  const handleAddMortgage = async (data: MortgageInput) => {
    const propertyId = data.property_id ?? selectedProperty;
    const startDate = data.start_date instanceof Date
      ? data.start_date.toISOString()
      : data.start_date;
    if (!propertyId || !startDate ||
        [data.principal, data.interest_rate, data.term_months, data.monthly_payment].some(mortgageNumberMissing)) {
      toast({ title: "Required mortgage details missing", description: "Enter the property, principal, terms, start date and payment.", variant: "destructive" });
      return;
    }

    const payload: TablesInsert<"mortgages"> = {
      user_id: userId,
      property_id: propertyId,
      loan_name: data.loan_name ?? undefined,
      principal: Number(data.principal),
      principal_original: data.principal_original !== "" ? Number(data.principal_original) : null,
      current_balance: data.current_balance !== "" ? Number(data.current_balance) : null,
      interest_rate: Number(data.interest_rate),
      term_months: Number(data.term_months),
      start_date: startDate,
      monthly_payment: Number(data.monthly_payment),
      includes_escrow: Boolean(data.includes_escrow),
    };

    const { error } = await supabase.from("mortgages").insert(payload);

    if (error) {
      toast({ title: "Error", description: "Failed to add mortgage", variant: "destructive" });
      return;
    } 

    toast({ title: "Success", description: "Mortgage added successfully" });
    loadData();
    
  };

  //PROPERTY HANDLERS
  const handleAddProperty = async (data: Omit<Property, "id">) => {
    if (!data.address?.trim()) {
      toast({ title: "Address required", description: "Enter a property address before saving.", variant: "destructive" });
      return;
    }

    const payload: TablesInsert<"properties"> = {
      alias: data.alias,
      address: data.address,
      type: data.type ?? null,
      purchase_price: data.sale_price ?? null,
      property_value: data.property_value ?? null,
      property_taxes: data.property_taxes ?? null,
      mgmt_pct: data.mgmt_pct ?? null,
      vacancy_pct: data.vacancy_pct ?? null,
      maintenance_pct: data.maintenance_pct ?? null,
      insurance: data.insurance ?? null,    
    };

    const { data: inserted, error } = await supabase
      .from("properties")
      .insert({
        ...payload, 
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add property", variant: "destructive" });
      return;
    }

    // append to list so UI updates immediately
    //setProperties((prev) => [...prev, inserted as Property]);
    //toast({ title: "Success", description: "Property added" });
    //loadProperties();
    toast({ title: "Success", description: "Property added" });
    await loadProperties(); // rely on normalized loader; no TypeScript cast needed

  };

  const handleUpdateProperty = async (id: string, patch: Partial<Property>) => {
    // Build a payload your current DB actually accepts:
    // - Always allow address
    // - Map sale_price -> purchase_price (legacy column) if provided
    // - Only include fields that are not undefined (avoid sending unknown keys)
    const payload: TablesUpdate<"properties"> = {};
    if (patch.address !== undefined) {
      if (!patch.address?.trim()) {
        toast({ title: "Address required", description: "Enter a property address before saving.", variant: "destructive" });
        return;
      }
      payload.address = patch.address;
    }
    if (patch.sale_price !== undefined) payload.purchase_price = patch.sale_price;
    if (patch.property_value !== undefined) payload.property_value = patch.property_value;

    // If your migration with the new columns is applied, these will also succeed (harmless if ignored by types)
    if (patch.alias !== undefined) payload.alias = patch.alias ?? null;
    if (patch.type !== undefined) payload.type = patch.type ?? null;
    if (patch.property_taxes !== undefined) payload.property_taxes = patch.property_taxes ?? null;
    if (patch.mgmt_pct !== undefined) payload.mgmt_pct = patch.mgmt_pct ?? null;
    if (patch.vacancy_pct !== undefined) payload.vacancy_pct = patch.vacancy_pct ?? null;
    if (patch.maintenance_pct !== undefined) payload.maintenance_pct = patch.maintenance_pct ?? null;
    if (patch.insurance !== undefined) payload.insurance = patch.insurance ?? null;  

    const prev = properties;

    const { data: updated, error } = await supabase
      .from("properties")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select("id, address, purchase_price, alias, name, type, sale_price, property_value, property_taxes, mgmt_pct, vacancy_pct, maintenance_pct, insurance")
      .single();

    if (error || !updated) {
      // rollback optimistic change
      setProperties(prev);
      console.error("[update property] error:", error);
      toast({ title: "Update failed", description: String(error?.message ?? error ?? "Unknown error"), variant: "destructive" });
      return;
    }

    // normalize the returned row back into your UI shape
    setProperties((list) =>
      list.map((p) =>
        p.id === id
          ? {
              ...p,
              alias: updated.alias ?? p.alias ?? updated.address ?? "Property",
              address: updated.address ?? p.address ?? null,
              sale_price: updated.purchase_price ?? updated.sale_price,
              property_value: updated.property_value,
              property_taxes: updated.property_taxes,
              mgmt_pct: updated.mgmt_pct,
              vacancy_pct: updated.vacancy_pct,
              maintenance_pct: updated.maintenance_pct,
              insurance: updated.insurance,
            }
          : p
      )
    );

    toast({ title: "Property updated" });
  };

  const handleDeleteProperty = async (id: string) => {
    const prev = [...properties];

    // Optimistic UI update
    setProperties(list => list.filter(p => p.id !== id));

    // Ask Supabase to return deleted rows so we can see if anything matched
    const { data, error } = await supabase
      .from("properties")
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Failed to delete property:", error);
      setProperties(prev);

      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });

      return;
    }

    // RLS or missing policy → 0 rows deleted, no error
    if (!data || data.length === 0) {
      console.warn("Delete matched 0 rows. RLS is probably blocking deletes.");
      setProperties(prev);

      toast({
        title: "Delete blocked",
        description: "No rows were deleted – check RLS policies on the properties table.",
        variant: "destructive",
      });

      return;
    }

    toast({
      title: "Deleted",
      description: "Property removed successfully.",
    });
  };

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [view, setView] = useState<View>("snapshot");
  const openDataRoom = () => setView("database");

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
        
        {["snapshot", "portfolio", "database"].includes(view) && properties.length > 0 && (
          <PropertyFilter properties={propertyOptions.map(property => ({
            id: property.id,
            alias: property.name,
            address: properties.find(row => row.id === property.id)?.address ?? "",
          }))} selectedProperty={selectedProperty} onPropertyChange={setSelectedProperty} />
        )}
        {!loaded && <p role="status" className="text-sm text-muted-foreground">Loading portfolio records…</p>}
        {loadError && <p role="alert" className="text-sm">Property records could not be loaded.</p>}
        {loaded && !loadError && view === "snapshot" && <PortfolioSnapshot metrics={metrics} onAddData={openDataRoom} />}

        {view === "database" && (
          <DataRoom
            filteredProperties={filteredProperties}
            filteredLeases={filteredLeases}
            filteredMortgages={filteredMortgages}
            mortgages={mortgages}
            properties={properties}
            propertyOptions={propertyOptions}
            escrowByProperty={escrowByProperty}
            onAddProperty={handleAddProperty}
            onUpdateProperty={handleUpdateProperty}
            onDeleteProperty={handleDeleteProperty}
            onAddLease={handleAddLease}
            onUpdateLease={handleUpdateLease}
            onDeleteLease={handleDeleteLease}
            onAddMortgage={handleAddMortgage}
            onUpdateMortgage={handleUpdateMortgage}
            onDeleteMortgage={handleDeleteMortgage}
          />
        )}

        {view === "deals" && <DealsScenarios initialAssumptions={dealAssumptions} onAssumptionsChange={setDealAssumptions} />}

        {view === "memo" && <Memo assumptions={dealAssumptions} onOpenUnderwriting={() => setView("deals")} />}

        {loaded && !loadError && view === "portfolio" && (
          <PortfolioDecisions metrics={metrics} onAddData={openDataRoom} marketRate={marketRate}
            onMarketRateChange={setMarketRate} rentScenario={rentScenario} />
        )}
      </main>

    </div>

    </div>

  );
};

export default Index;
