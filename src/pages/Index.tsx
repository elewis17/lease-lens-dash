import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, TrendingUp, Wallet, LineChart, Percent, Calculator, Info} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { MetricCardWithInfo } from "@/components/MetricCardWithInfo";   
import { PropertyFilter } from "@/components/PropertyFilter";
import PropertiesTable, { type Property } from "@/components/PropertiesTable";window.location.pathname.replace("/lease-lens-dash", "") || "/"
import { OpexCalculator } from "@/domain/finance/OpexCalculator";
import { MetricsCalculator } from "@/domain/finance/MetricsCalculator";
import { LeaseTable } from "@/components/LeaseTable";
import { LeaseUploader } from "@/components/LeaseUploader";
import { IncomeAndSafetyChart } from "@/components/IncomeAndSafetyChart";
import { WealthBuildChart } from "@/components/WealthBuildChart";
import { MortgagesTable } from "@/components/MortgagesTable";
import { QuickActions } from "@/components/QuickActions";
import { ROISummaryCard } from "@/components/ROISummaryCard";
import { ScenarioToggle, Scenario } from "@/components/ScenarioToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type ExpensesBreakdown = {
  taxes: number;
  insurance: number;
  maintenance: number;
  management: number;
  utilities: number;
  hoa: number;
  misc: number;
};

type PropertyRowLegacy = {
    id: string;
    address: string | null;
    created_at?: string | null;
    mortgage_payment?: number | null;
    opex_inflation_rate?: number | null;
    property_value?: number | null;
    purchase_price?: number | null;
    rent_growth_rate?: number | null;
    total_units?: number | null;
    updated_at?: string | null;
    // tolerate "new" columns if/when your migration is live
    alias?: string | null;
    type?: string | null;
    sale_price?: number | null;
    property_taxes?: number | null;
    mgmt_pct?: number | null;
    vacancy_pct?: number | null;
    maintenance_pct?: number | null;
    insurance?: number | null; 
  };

const Index = () => {
  const { user } = useAuth();
  const DEMO_USER_ID = "b9551384-9050-42c3-b750-b43c676dcf9d";
  const effectiveUserId: string = (user?.id as string) ?? DEMO_USER_ID;
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>(""); // property_id
  const [scenario, setScenario] = useState<Scenario>("base");
  const [leases, setLeases] = useState<any[]>([]);
  const [mortgages, setMortgages] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<ExpensesBreakdown>({ 
    taxes: 0,
    insurance: 0,
    maintenance: 0,
    management: 0,
    utilities: 0,
    hoa: 0,
    misc: 0,
  });
  const [escrowByProperty, setEscrowByProperty] = useState<Map<string, boolean>>(new Map());
  const [metrics, setMetrics] = useState({
    expectedRent: 0,
    occupancyRate: 0,
    activeLeases: 0,
    totalUnits: 0, 
    arr: 0,
    mrr: 0,
    noi: 0,
    cashFlow: 0,
    capRate: 0,
    dcr: 0,
    roi: 0,
    cashOnCash: 0,
    irr10Year: 0,
  });
  const [opexMonthly, setOpexMonthly] = useState(0);
  const [currentProperty, setCurrentProperty] = useState<any>(null);
  const { toast } = useToast();
  const propertyOptions = (properties ?? []).map(p => ({ id: p.id, name: p.alias || "Property" }));
  const propertyFilterList = (properties ?? []).map(p => ({ id: p.id, address: p.address ?? p.alias ?? "Property" }));
  const filteredProperties = selectedProperty ? properties.filter(p => p.id === selectedProperty) : properties;
  const filteredLeases = selectedProperty ? leases.filter(l => l.property_id === selectedProperty) : leases;
  const filteredMortgages = selectedProperty ? mortgages.filter(m => m.property_id === selectedProperty) : mortgages;
  const totalMonthlyExpense = Object.values(expenses).reduce((sum, val) => sum + (Number(val) ?? 0), 0); // ---- Derived totals for Property Financials ----
  const getScenarioRates = () => {   // Get scenario-adjusted growth rates
  const baseRent = currentProperty?.rent_growth_rate || 3;
  const baseOpex = currentProperty?.opex_inflation_rate || 2.5;
    
    switch (scenario) {
      case "conservative":
        return { rentGrowth: baseRent - 1, opexInflation: baseOpex + 0.5 };
      case "optimistic":
        return { rentGrowth: baseRent + 1.5, opexInflation: baseOpex - 0.5 };
      default:
        return { rentGrowth: baseRent, opexInflation: baseOpex };
    }
  };
  const [newProperty, setNewProperty] = useState<{ name: string; address: string }>({
  name: "",
  address: "",
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (properties.length === 0) return;  // nothing to load yet
    loadData();
  }, [selectedProperty, properties]);

  // sets default only once on mount
  useEffect(() => {
    if (selectedProperty === undefined) setSelectedProperty(""); // "" = All
  }, []);

  const loadProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", effectiveUserId);
      
    if (error) {
      console.error("Error loading properties:", error);
      setProperties([]);
      setSelectedProperty("");
      setCurrentProperty(null);
      return;
    }

    const rows = (data ?? []) as any[];

    // normalize to PropertiesTable’s shape
    const list: Property[] = rows.map((p: any) => ({
      id: p.id,
      alias: p.alias ?? p.name ?? p.address ?? "Property",
      address: p.address ?? null,
      type: p.type ?? null,
      sale_price: p.purchase_price ?? p.sale_price ?? null,
      property_taxes: p.property_taxes ?? null,
      mgmt_pct: p.mgmt_pct ?? null,
      vacancy_pct: p.vacancy_pct ?? null,
      maintenance_pct: p.maintenance_pct ?? null,
    }));

    setProperties(list);
    // Default to "All" so leases/mortgages with null property_id still show
    if (!selectedProperty) {
      setSelectedProperty("");
      setCurrentProperty(null);
      }

  };

  const loadData = async () => {
    // Build once per loadData run
    const vacancyPctByProperty = new Map<string, number>(
      (properties ?? []).map(p => [p.id, Number(p.vacancy_pct ?? 0)])
    );
    const getPropVacancy = (pid?: string) => vacancyPctByProperty.get(pid ?? "") ?? 0;
    
    // LEASES (directly by property_id, no units)
    let leasesQuery: any = supabase
      .from("leases")
      .select(`
        id, monthly_rent, status, start_date, end_date, deposit,
        tenant:tenants(*),
        property_id, 
        unit_id
      `);

    let unitsQuery = supabase
      .from("units")
      .select("id, unit_label, property_id");

    if (selectedProperty) {
      unitsQuery = unitsQuery.eq("property_id", selectedProperty);
    }

    const { data: unitsData, error: unitsError } = await unitsQuery;
    if (unitsError) console.error("Error loading units:", unitsError);

    // Build quick lookup map
    const unitLabelById = new Map<string, string>();

    if (unitsError) {
      console.error("Error loading units:", unitsError);
    } else if (unitsData) {
      setUnitOptions(unitsData);

      unitsData.forEach((u) => {
        unitLabelById.set(u.id, u.unit_label); // we'll update 'label' once you confirm correct column
      });
    }

      
    if (selectedProperty) {
      // Single property selected
      leasesQuery = leasesQuery.eq("property_id", selectedProperty as string);
    } else {
      // All properties for this user/demo
      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length > 0) {
        leasesQuery = leasesQuery.in("property_id", propertyIds);
      } else {
        // No properties → no leases to load
        leasesQuery = null;
      }
    }

    // run query only if we actually built one
    let leasesData: any[] | null = [];
    let leasesError: any = null;

    if (leasesQuery) {
      const { data, error } = await leasesQuery;
      leasesData = data ?? [];
      leasesError = error;
      if (leasesError) console.error("Error loading leases:", leasesError);
    }

    // MORTGAGES
    let mortgagesQuery: any = supabase.from('mortgages').select('*');

    if (selectedProperty) {
      mortgagesQuery = mortgagesQuery.eq('property_id', selectedProperty);
    } else {
      // all properties for this user/demo
      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length > 0) {
        mortgagesQuery = mortgagesQuery.in("property_id", propertyIds);
      } else {
        // No properties → no mortgages to load
        mortgagesQuery = null;
      }
    }

    let mortgagesData: any[] | null = [];
    let mortgagesError: any = null;

    if (mortgagesQuery) {
      const { data, error } = await mortgagesQuery;
      mortgagesData = data ?? [];
      mortgagesError = error;
      if (mortgagesError) console.error("Error loading mortgages:", mortgagesError);
    }

    // EXPENSES + CURRENT PROPERTY (single-property mode only)
    let expensesData: any[] | null = null;
    let propertyData: any | null = null;

    if (selectedProperty) {
      const { data: eData } = await supabase.from('expenses').select('*').eq('property_id', selectedProperty);
      expensesData = eData ?? null;

      const { data: pData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', selectedProperty)
        .single();
      propertyData = pData ?? null;
    } else {
      //expensesData = [];   // all-mode: no single-property expenses context
      const { data: eAll } = await supabase.from('expenses').select('*'); // ✅ all properties
      expensesData = eAll ?? [];
      propertyData = null; // all-mode: no current property
    }

    // Build expenses breakdown (typed) for UI + metrics
    const expensesByCategory: ExpensesBreakdown = {
      taxes: 0,
      insurance: 0,
      maintenance: 0,
      management: 0,
      utilities: 0,
      hoa: 0,
      misc: 0,
    };
    (expensesData ?? []).forEach((exp: any) => {
      const amount = Number(exp?.amount) || 0;
      const category = exp?.category;
      if (category === 'tax') expensesByCategory.taxes += amount;
      else if (category === 'insurance') expensesByCategory.insurance += amount;
      else if (category === 'repairs') expensesByCategory.maintenance += amount;
      else if (category === 'management') expensesByCategory.management += amount;
      else if (category === 'utilities') expensesByCategory.utilities += amount;
      else if (category === 'hoa') expensesByCategory.hoa += amount;
      else expensesByCategory.misc += amount;
    });

    const rentByProperty = new Map<string, number>(); // adjusted (vacancy) monthly rent per property

    setExpenses(expensesByCategory);
    setCurrentProperty(propertyData);


    // Process mortgages
    const processedMortgages = (mortgagesData ?? []).map((mtg:any)=>({
      id: mtg.id,
      property_id: mtg.property_id,
      loan_name: mtg.loan_name,
      principal_original: mtg.principal_original === null || mtg.principal_original === undefined
        ? null : Number(mtg.principal_original),
      current_balance: mtg.current_balance === null || mtg.current_balance === undefined
        ? null : Number(mtg.current_balance),
      principal: mtg.principal === null || mtg.principal === undefined
        ? null : Number(mtg.principal), // legacy, but independent
      interest_rate: Number(mtg.interest_rate ?? 0),
      term_months: Number(mtg.term_months ?? 0),
      start_date: mtg.start_date ? new Date(mtg.start_date) : null,
      monthly_payment: Number(mtg.monthly_payment ?? 0),
      includes_escrow: Boolean(mtg.includes_escrow ?? false),   // NEW
    }));

    // Build a quick lookup: does this property have any escrowed mortgage?
    const escrowMap = new Map<string, boolean>();
      processedMortgages.forEach((m) => {
        if (!m.property_id) return;
        const current = escrowMap.get(m.property_id) ?? false;
        escrowMap.set(m.property_id, current || !!m.includes_escrow);
      });
      setEscrowByProperty(escrowMap);

    setMortgages(processedMortgages);

    // Calculate total debt service from mortgages
    const totalDebtService = processedMortgages.reduce((sum, mtg) => sum + mtg.monthly_payment, 0);

    // Calculate metrics
    let totalMRR = 0;
    let totalExpected = 0;

    // ✅ use a set to count unique active unit IDs
    const now = new Date();

    const processedLeases = (leasesData ?? []).map((lease: any) => {
      const monthlyRent = Number(lease?.monthly_rent ?? 0);
      const pid = lease?.property_id as string | undefined;
      const propVacancyPct = getPropVacancy(pid);
      const adjustedRent = monthlyRent * (1 - propVacancyPct / 100);
      // AFTER: track adjusted rent per property
      if (pid) rentByProperty.set(pid, (rentByProperty.get(pid) ?? 0) + adjustedRent);

      totalMRR += adjustedRent;
      totalExpected += monthlyRent;

      // ----- active check (status OR dates) -----
      const status = String(lease?.status ?? "").toLowerCase();
      const start = lease?.start_date ? new Date(lease.start_date) : null;
      const end   = lease?.end_date ? new Date(lease.end_date) : null;

      const isActiveByStatus = status === "active" || status === "expiring";
      const isActiveByDates  = !!(start && end && start <= now && now <= end);
      const isActive = isActiveByStatus || isActiveByDates;

      // ----- property filter -----
      const matchesSelection = selectedProperty ? pid === selectedProperty : true;

      return {
        id: lease.id,
        property_id: pid ?? "Unknown",
        tenant: lease.tenant?.name || "Unknown",
        monthlyRent,
        //vacancyRate: vacancyRatePct, --- to be removed
        deposit: Number(lease?.deposit ?? 0),
        startDate: start ?? new Date(),
        leaseEnd: end ?? new Date(),

        status: lease.status ?? null,
  
        // NEW
        unit_id: lease.unit_id ?? null,
        unit_label: lease.unit_id ? unitLabelById.get(lease.unit_id) ?? "—" : "—",
      };
    });

        // ACTIVE LEASES = leases with valid active date window OR active status
    const activeLeaseCount = (leasesData ?? []).filter((l: any) => {
      const status = String(l.status ?? "").toLowerCase();
      const start = l.start_date ? new Date(l.start_date) : null;
      const end = l.end_date ? new Date(l.end_date) : null;
      const now = new Date();

      const isActiveStatus = status === "active" || status === "expiring";
      const isActiveDates  = !!(start && end && start <= now && now <= end);

      return isActiveStatus || isActiveDates;
    }).length;

    // use unique active units as the numerator
    const activeLeases = activeLeaseCount;

    // ----- Value basis (selected property vs All) -----
    const propertyValue = Number(
      selectedProperty
        ? (propertyData?.sale_price ?? propertyData?.purchase_price ?? 0)
        : (properties ?? []).reduce((s, p: any) => s + Number(p?.sale_price ?? p?.purchase_price ?? 0), 0)
    );

    // --- OPEX & Metrics via domain calculators ---
    const annualDebt = totalDebtService * 12;

    // (A) Compute OPEX/NOI in single vs portfolio mode
    let noiAnnual = 0;
    let opexMonthlyCalc = 0;

    if (selectedProperty && propertyData) {
      const pid = selectedProperty;
      const rentThisProperty = rentByProperty.get(pid) ?? 0;
      const escrow = escrowByProperty.get(selectedProperty) ?? false;

      opexMonthlyCalc = OpexCalculator.monthlyForProperty(propertyData, {
        monthlyRent: rentThisProperty,
        mortgageIncludesEscrow: escrow,
      });

      noiAnnual = MetricsCalculator.noiAnnual(rentThisProperty, propertyData, {
        monthlyRent: rentThisProperty,
        mortgageIncludesEscrow: escrow,
      });

    } else {
      // "All properties" – sum per-property OPEX and NOI
      opexMonthlyCalc = (properties ?? []).reduce((sum, p) => {
        const rent = rentByProperty.get(p.id) ?? 0;
        const escrow = escrowByProperty.get(p.id) ?? false;
        return sum + OpexCalculator.monthlyForProperty(p, {
          monthlyRent: rent,
          mortgageIncludesEscrow: escrow,
        });
      }, 0);

      // "All properties" – sum per-property NOI
      noiAnnual = (properties ?? []).reduce((sum, p) => {
        const rent = rentByProperty.get(p.id) ?? 0;
        const escrow = escrowByProperty.get(p.id) ?? false;
        return sum + MetricsCalculator.noiAnnual(rent, p, {
          monthlyRent: rent,
          mortgageIncludesEscrow: escrow,
        });
      }, 0);
    }

    // Cash flow (annual) = NOI - debt service
    const cashFlowAnnual = noiAnnual - annualDebt;

    // Estimate equity (same approach you had)
    const totalOriginalPrincipal = processedMortgages.reduce((s, m) => s + Number(m.principal || 0), 0);
    let equityEstimate = propertyValue - totalOriginalPrincipal;
    if (equityEstimate <= 0) equityEstimate = propertyValue * 0.25;

    // KPIs via MetricsCalculator
    const capRate     = MetricsCalculator.capRate(noiAnnual, propertyValue);
    const dcr         = MetricsCalculator.dcr(noiAnnual, annualDebt);
    const roi         = MetricsCalculator.roiAnnual(cashFlowAnnual, propertyValue);
    const cashOnCash  = MetricsCalculator.cashOnCash(cashFlowAnnual, equityEstimate);
    const irr10Year   = MetricsCalculator.irr10Year(propertyValue, cashFlowAnnual, equityEstimate);
    const { totalUnits, activeUnits, occupancyRate } = MetricsCalculator.occupancyRate(leasesData, unitsData, selectedProperty, properties.map(p=>p.id));

    // Guard helper
    const safe = (n: number) => (Number.isFinite(n) ? n : 0);

    setOpexMonthly(opexMonthlyCalc);
    setLeases(processedLeases);
    setMetrics({
      expectedRent: totalExpected,
      occupancyRate,
      activeLeases: activeLeaseCount,
      totalUnits,
      arr: totalMRR * 12,
      mrr: totalMRR,
      noi: noiAnnual / 12,
      cashFlow: cashFlowAnnual / 12,
      capRate,
      dcr,
      roi,
      cashOnCash,
      irr10Year,  
    });
  };

  //LEASE HANDLERS
  const handleUpdateLease = async (leaseId: string, data: any) => {
    // 1. Load existing lease so we can update tenant/unit
    const { data: lease, error: fetchErr } = await supabase
      .from("leases")
      .select("tenant_id, unit_id")
      .eq("id", leaseId)
      .single();

    if (fetchErr || !lease) {
      toast({ title: "Error", description: "Lease not found", variant: "destructive" });
      return;
    }

    const { tenant_id, unit_id } = lease;

    // 2. Update tenant name
    if (data.tenant) {
      await supabase
        .from("tenants")
        .update({ name: data.tenant })
        .eq("id", tenant_id);
    }

    // 3. Update unit label
    if (data.unit_label) {
      await supabase
        .from("units")
        .update({ unit_label: data.unit_label })
        .eq("id", unit_id);
    }

    // 4. Update lease fields
    const leasePayload: any = {};

    if (data.monthlyRent !== undefined) leasePayload.monthly_rent = data.monthlyRent;
    if (data.deposit !== undefined) leasePayload.deposit = data.deposit;

    if (data.startDate) {
      leasePayload.start_date =
        data.startDate instanceof Date
          ? data.startDate.toISOString()
          : data.startDate;
    }

    if (data.leaseEnd) {
      leasePayload.end_date =
        data.leaseEnd instanceof Date
          ? data.leaseEnd.toISOString()
          : data.leaseEnd;
    }

    if (data.status) leasePayload.status = data.status;

    // Optional: if UI lets you change property/unit
    if (data.unit_id) leasePayload.unit_id = data.unit_id;
    if (data.property_id) leasePayload.property_id = data.property_id;

    const { error: leaseError } = await supabase
      .from("leases")
      .update(leasePayload)
      .eq("id", leaseId);

    if (leaseError) {
      toast({ title: "Error", description: "Failed to update lease", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Lease updated successfully" });
    loadData();
  };

  const handleDeleteLease = async (id: string) => {
    const { error } = await supabase.from('leases').delete().eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete lease", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lease deleted successfully" });
      loadData();
    }
  };

  const handleAddLease = async (data: any) => {
    // 1) Resolve target property
    const targetPropertyId = data.property_id ?? selectedProperty;
    if (!targetPropertyId) {
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
    let tenantId: string | null = null;

    if (tenantName) {
      // Try to reuse an existing tenant with the same name
      const { data: existingTenant, error: tenantLookupError } = await supabase
        .from("tenants")
        .select("id")
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
          .insert({ name: tenantName })
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
    const unitLabel = (data.unit_label ?? "").trim();
    let unitId: string | null = null;

    if (unitLabel) {
      // Try to reuse an existing unit with same label on this property
      const { data: existingUnit, error: unitLookupError } = await supabase
        .from("units")
        .select("id")
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
    const payload = {
      tenant_id: tenantId,
      property_id: targetPropertyId,
      unit_id: unitId,
      monthly_rent: Number(data.monthlyRent ?? 0),
      deposit: Number(data.deposit ?? 0),
      start_date: data.startDate?.toISOString?.() ?? data.startDate,
      end_date: data.leaseEnd?.toISOString?.() ?? data.leaseEnd,
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
  const handleUpdateMortgage = async (id: string, data: any) => {
    const payload: any = {};

    if (data.loan_name !== undefined) payload.loan_name = data.loan_name;
    if (data.principal !== undefined) payload.principal = Number(data.principal);
    if (data.principal_original !== undefined) payload.principal_original = Number(data.principal_original);
    if (data.current_balance !== undefined) payload.current_balance = Number(data.current_balance);
    if (data.interest_rate !== undefined) payload.interest_rate = Number(data.interest_rate);
    if (data.term_months !== undefined) payload.term_months = Number(data.term_months);

    if (data.start_date !== undefined)
      payload.start_date = data.start_date instanceof Date 
        ? data.start_date.toISOString() 
        : data.start_date;

    if (data.monthly_payment !== undefined) payload.monthly_payment = Number(data.monthly_payment);
    if (data.includes_escrow !== undefined) payload.includes_escrow = Boolean(data.includes_escrow);
    if (data.property_id !== undefined) payload.property_id = data.property_id;

    const { data: rows, error } = await supabase
      .from("mortgages")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) {
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
        start_date: updated.start_date ? new Date(updated.start_date) : m.start_date,
      } : m)
    );

    loadData();
  };

  const handleDeleteMortgage = async (id: string) => {
    const { error } = await supabase.from('mortgages').delete().eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete mortgage", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Mortgage deleted successfully" });
      loadData();
    }
  };

  const handleAddMortgage = async (data: any) => {
    const payload = {
      property_id: data.property_id ?? selectedProperty,
      loan_name: data.loan_name ?? null,
      principal: data.principal !== "" ? Number(data.principal) : null,
      principal_original: data.principal_original !== "" ? Number(data.principal_original) : null,
      current_balance: data.current_balance !== "" ? Number(data.current_balance) : null,
      interest_rate: data.interest_rate !== "" ? Number(data.interest_rate) : null,
      term_months: data.term_months !== "" ? Number(data.term_months) : null,
      start_date: data.start_date instanceof Date 
        ? data.start_date.toISOString() 
        : data.start_date ?? null,
      monthly_payment: data.monthly_payment !== "" ? Number(data.monthly_payment) : null,
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
    const payload = {
      alias: data.alias,
      address: data.address ?? null,
      type: data.type ?? null,
      sale_price: data.sale_price ?? null,
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
        user_id: effectiveUserId
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
    const payload: any = {};
    if (patch.address !== undefined) payload.address = patch.address ?? null;
    if (patch.sale_price !== undefined) payload.purchase_price = patch.sale_price;

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
      .eq("id", id)
      .select("id, address, purchase_price, alias, name, type, sale_price, property_taxes, mgmt_pct, vacancy_pct, maintenance_pct, insurance")
      .single<PropertyRowLegacy>();

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
              sale_price: Number(updated.purchase_price ?? updated.sale_price ?? 0),
              property_taxes: Number(updated.property_taxes ?? p.property_taxes ?? 0),
              mgmt_pct: Number(updated.mgmt_pct ?? p.mgmt_pct ?? 0),
              vacancy_pct: Number(updated.vacancy_pct ?? p.vacancy_pct ?? 0),
              maintenance_pct: Number(updated.maintenance_pct ?? p.maintenance_pct ?? 0),
              insurance: Number(updated.insurance ?? p.insurance ?? 0),
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

  // Helper to format a property label from the selected/current property
  const formatPropertyLabel = (p: any | null) => String(p?.alias ?? p?.name ?? "Property");

  if (showUploader) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Upload New Lease</h1>
            <button onClick={() => setShowUploader(false)} className="text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </button>
          </div>
          <LeaseUploader onUploadComplete={() => {
            setShowUploader(false);
            loadData();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-sm bg-background/80">
      <div className="container mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Left side — now empty but preserves structure */}
        <div className="flex-1" />

        {/* Right side — Property selector left-aligned relative to container */}
        <div className="flex items-center gap-4">
          {properties.length > 0 && (
            <PropertyFilter
              properties={properties.map(p => ({
                id: p.id,
                address: p.address ?? "",
                alias: p.alias,
              }))}
              selectedProperty={selectedProperty}
              onPropertyChange={setSelectedProperty}
            />
          )}
        </div>

      </div>
    </header>

      <main className="container mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
        {/* ---- Investment Performance ---- */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* ROI with centered, mobile-friendly popover beside title */}
            <MetricCard
              title={
                <div className="flex items-center gap-1.5">
                  <span>ROI</span>

                  {/* Click/tap to open; ESC or click backdrop to close */}
                  <details className="relative">
                    <summary
                      className="list-none inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 cursor-pointer"
                      aria-label="About ROI"
                    >
                      <Info className="h-4 w-4" />
                    </summary>

                    {/* Backdrop + centered sheet (prevents cutoff) */}
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
                      {/* Backdrop */}
                      <button
                        aria-label="Close"
                        className="absolute inset-0 bg-black/20"
                        onClick={(e) => {
                          const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                          if (d) d.open = false;
                        }}
                      />
                      {/* Sheet */}
                      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/10 text-[13px]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">ROI (Return on Investment)</p>
                          <button
                            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-700"
                            aria-label="Close"
                            onClick={(e) => {
                              const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                              if (d) d.open = false;
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-700">
                          <li><strong>What it measures:</strong> ROI shows your total return compared to what you’ve invested. It includes income, appreciation, and costs, giving a snapshot of your overall profitability.</li>
                          <li><strong>Why you see what you see:</strong> A lower ROI often means you’ve recently spent on upgrades, had high upfront costs, or are early in ownership. As rents rise and expenses stabilize, ROI typically improves.</li>
                          <li><strong>When to look at it:</strong> Use ROI to evaluate your overall performance or to compare your property against other types of investments.</li>
                          <li><strong>How to improve it:</strong> Increase income, reduce expenses, or refinance to lower financing costs.</li>
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              }
              value={`${metrics.roi.toFixed(2)}%`}
              subtitle="short-term snapshot"
              icon={TrendingUp}
              variant="default"
            />
            {/* Cap Rate with centered, mobile-friendly popover beside title */}
            <MetricCard
              title={
                <div className="flex items-center gap-1.5">
                  <span>Cap Rate</span>

                  {/* Click/tap to open; ESC or click backdrop to close */}
                  <details className="relative">
                    <summary
                      className="list-none inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 cursor-pointer"
                      aria-label="About Cap Rate"
                    >
                      <Info className="h-4 w-4" />
                    </summary>

                    {/* Backdrop + centered sheet (prevents cutoff) */}
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
                      {/* Backdrop */}
                      <button
                        aria-label="Close"
                        className="absolute inset-0 bg-black/20"
                        onClick={(e) => {
                          const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                          if (d) d.open = false;
                        }}
                      />
                      {/* Sheet */}
                      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/10 text-[13px]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">Cap Rate (Capitalization Rate)</p>
                          <button
                            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-700"
                            aria-label="Close"
                            onClick={(e) => {
                              const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                              if (d) d.open = false;
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-700">
                          <li><strong>Formula:</strong> NOI/Property Value</li>
                          <li><strong>What it measures:</strong> Cap Rate = Net Operating Income ÷ Property Value. It measures how efficiently a property generates income relative to its value, ignoring financing or debt structure.</li>
                          <li><strong>Why you see what you see:</strong> A higher cap rate can mean stronger income potential or higher market risk. A lower one means a more stable property or a higher-value area where prices outpace rent.</li>
                          <li><strong>When to look at it:</strong> Check the cap rate when comparing properties or evaluating how effective your property is at producing income at its market value.</li>
                          <li><strong>How to improve it:</strong> Increase rent, reduce operating expenses, or acquire properties below market value to raise your cap rate.</li>
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              }
              value={`${metrics.capRate.toFixed(2)}%`}
              subtitle="property efficiency"
              icon={Percent}
              variant="default"
            />
            {/* 10-Year IRR with centered, mobile-friendly popover beside title */}
            <MetricCard
              title={
                <div className="flex items-center gap-1.5">
                  <span>10-Year IRR</span>

                  {/* Click/tap to open; ESC or click backdrop to close */}
                  <details className="relative">
                    <summary
                      className="list-none inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 cursor-pointer"
                      aria-label="About 10-Year IRR"
                    >
                      <Info className="h-4 w-4" />
                    </summary>

                    {/* Backdrop + centered sheet (prevents cutoff) */}
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
                      {/* Backdrop */}
                      <button
                        aria-label="Close"
                        className="absolute inset-0 bg-black/20"
                        onClick={(e) => {
                          const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                          if (d) d.open = false;
                        }}
                      />
                      {/* Sheet */}
                      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/10 text-[13px]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">10-Year IRR (Internal Rate of Return)</p>
                          <button
                            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-700"
                            aria-label="Close"
                            onClick={(e) => {
                              const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                              if (d) d.open = false;
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-700">
                          <li><strong>Formula:</strong> IRR=Discount rate where NPV(10-year cash flows + sale proceeds)=0</li>
                          <li><strong>What it measures:</strong> IRR shows your average annual return over time, factoring in both cash flow and appreciation. It accounts for when money goes in and when it comes back — through rent, loan paydown, or eventual sale.</li>
                          <li><strong>Why you see what you see:</strong> A higher IRR usually means the property is benefiting from appreciation, equity growth, or strong long-term performance. It combines all return sources into one time-weighted rate.</li>
                          <li><strong>When to look at it:</strong> Use IRR to evaluate long-term investment performance or compare potential returns across different properties and hold periods.</li>
                          <li><strong>How to improve it:</strong> Add value through renovations, increase equity by paying down principal faster, or time your sale to capture peak market appreciation.</li>
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              }
              value={`${metrics.irr10Year.toFixed(2)}%`}
              subtitle="full long-term wealth picture"
              icon={LineChart}
              variant="default"
            />
            {/* Cash-on-Cash Return with centered, mobile-friendly popover beside title */}
            <MetricCard
              title={
                <div className="flex items-center gap-1.5">
                  <span>Cash-on-Cash Return</span>

                  {/* Click/tap to open; ESC or click backdrop to close */}
                  <details className="relative">
                    <summary
                      className="list-none inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 cursor-pointer"
                      aria-label="About Cash-on-Cash Return"
                    >
                      <Info className="h-4 w-4" />
                    </summary>

                    {/* Backdrop + centered sheet (prevents cutoff) */}
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
                      {/* Backdrop */}
                      <button
                        aria-label="Close"
                        className="absolute inset-0 bg-black/20"
                        onClick={(e) => {
                          const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                          if (d) d.open = false;
                        }}
                      />
                      {/* Sheet */}
                      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/10 text-[13px]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">Cash-on-Cash Return</p>
                          <button
                            className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-700"
                            aria-label="Close"
                            onClick={(e) => {
                              const d = (e.currentTarget.closest('details') as HTMLDetailsElement | null);
                              if (d) d.open = false;
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-700">
                          <li><strong>Formula:</strong> Cash Return/Cash Invested</li>
                          <li><strong>What it measures:</strong> Cash-on-cash return shows how much annual cash flow you earn compared to the cash you invested. It reflects the property’s actual cash performance after financing.</li>
                          <li><strong>Why you see what you see:</strong> This number changes with loan terms, rent levels, and expenses. A lower return may mean high upfront costs or conservative leverage, while a higher one signals stronger cash flow efficiency.</li>
                          <li><strong>When to look at it:</strong> Use cash-on-cash return to assess short-term income performance or compare how different properties perform when leverage is involved.</li>
                          <li><strong>How to improve it:</strong> Increase rent, lower expenses, refinance for better loan terms, or reduce vacancy to improve annual cash flow.</li>
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              }
              value={`${metrics.cashOnCash.toFixed(2)}%`}
              subtitle="current cash flow health"
              icon={DollarSign}
              variant="success"
            />
          </div>
        </section>

        {/* ---- Property Financials ---- */}
        <section className="mt-10">
          <div className="rounded-2xl bg-card p-8 shadow-sm border border-border transition-colors">
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-card-foreground">
                Property Financials Summary
              </h2>
            </div>

            {/* P&L order: 3×2 grid (no mini cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
              {/* 1) Contracted Monthly Rent */}
              <MetricCardWithInfo
                icon={DollarSign}
                title="Contracted Monthly Rent"
                value={`$${metrics.expectedRent.toLocaleString()}`}
                tooltip="Total rent due from current leases; your top-line rental revenue."
              />

              {/* 2) Operating Expenses (OPEX) */}
              <MetricCardWithInfo
                icon={Calculator}
                title="Operating Expenses (OPEX)"
                value={`$${opexMonthly.toLocaleString()}`}
                tooltip="All monthly operating costs excluding debt; uses property-level rules (taxes, insurance, mgmt %, maintenance %, escrow)."
              />

              {/* 3) Net Operating Income (NOI) */}
              <MetricCardWithInfo
                icon={Wallet}
                title="Net Operating Income (NOI)"
                value={`$${metrics.noi.toLocaleString()}`}
                tooltip="NOI = Rent − Operating Expenses; excludes debt service."
              />

              {/* 4) Monthly Cash Flow */}
              <MetricCardWithInfo
                icon={LineChart}
                title="Monthly Cash Flow"
                value={`$${metrics.cashFlow.toLocaleString()}`}
                tooltip="Cash Flow = NOI − Debt Service; positive means surplus after paying mortgages."
              />

              {/* 5) Occupancy Rate */}
              <MetricCardWithInfo
                icon={Home}
                title="Occupancy Rate"
                value={`${metrics.occupancyRate.toFixed(1)}%`}
                tooltip={`${metrics.activeLeases} of ${metrics.totalUnits} units filled.`}
              />
              {/* 6) DCR */}
              <MetricCardWithInfo
                icon={Calculator}
                title="Debt Coverage Ratio (DCR)"
                value={metrics.dcr.toFixed(2)}
                tooltip="NOI ÷ Annual Debt Service; ≥ 1.25 is typically considered safe."
              />
            </div>
          </div>
        </section>
        
        {/* Properties Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">
            Properties <span className="text-muted-foreground text-base">({filteredProperties.length})</span>
          </h2>
          {/* Floating OPEX pill aligned over the Taxes column (left aligned) */}
          {(() => {
            const OpexOverTaxes = () => {
              const wrapRef = useRef<HTMLDivElement | null>(null);
              const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

              useEffect(() => {
                const el = wrapRef.current;
                if (!el) return;

                const compute = () => {
                  // Grab the Taxes header only (first rose-colored column)
                  const th = el.querySelector<HTMLElement>('th.bg-rose-50\\/60, th.bg-rose-50\\/40');
                  if (!th) return;

                  const thRect = th.getBoundingClientRect();
                  const containerRect = el.getBoundingClientRect();

                  // Align left edge of the Taxes column
                  const left = thRect.left - containerRect.left + 4; // +4 for a little padding
                  const top = thRect.top - containerRect.top - 6;   // hover slightly above header

                  setPos({ left, top });
                };

                compute();
                window.addEventListener("resize", compute);
                return () => window.removeEventListener("resize", compute);
              }, [filteredProperties.length]);

              return (
                <div ref={wrapRef} className="relative">
                  {pos && (
                    <span
                      className="absolute -translate-y-full z-20 inline-flex items-center rounded-t-lg bg-rose-100 text-rose-700 px-3 py-0.5 text-xs font-medium shadow-sm pointer-events-none"
                      style={{ left: pos.left, top: pos.top }}
                    >
                      OPEX
                    </span>
                  )}

                  <PropertiesTable
                    properties={filteredProperties}
                    onAdd={handleAddProperty}
                    onUpdate={handleUpdateProperty}
                    onDelete={handleDeleteProperty}
                    escrowByProperty={Object.fromEntries(escrowByProperty ?? new Map())}
                  />
                </div>
              );
            };
            return <OpexOverTaxes />;
          })()}
        </div>

        {/* Lease Table Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">
            Active Leases <span className="text-muted-foreground text-base">({filteredLeases.length})</span>
          </h2>
          <LeaseTable
              leases={filteredLeases}
              onUpdate={handleUpdateLease}
              onDelete={handleDeleteLease}
              onAdd={handleAddLease}
              propertyOptions={properties.map((p: any) => ({id: p.id, 
                   name: p.alias || p.address || "Untitled Property"
                                                            }))}
              unitOptions={unitOptions}
            />
        </div>

        {/* Mortgages Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">
            Mortgages <span className="text-muted-foreground text-base">({mortgages.length})</span>
          </h2>
          <MortgagesTable
            mortgages={filteredMortgages}
            onUpdate={handleUpdateMortgage}
            onDelete={handleDeleteMortgage}
            onAdd={handleAddMortgage}
            propertyOptions={propertyOptions}
          />
        </div>

        {/* Income & Safety Chart */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Left side: Title + Scenario description */}
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                Cash Flow & Risk <span className="text-muted-foreground font-normal">(10 Years)</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug sm:whitespace-normal whitespace-pre-wrap">
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)} scenario: Rent at{" "}
                {getScenarioRates().rentGrowth.toFixed(1)}% growth vs. OPEX at{" "}
                {getScenarioRates().opexInflation.toFixed(1)}% inflation
              </p>
            </div>

            {/* Right side: Scenario Toggle */}
            <div className="mt-2 sm:mt-0">
              <ScenarioToggle scenario={scenario} onScenarioChange={setScenario} />
            </div>
          </div>

          <IncomeAndSafetyChart
            currentRent={metrics.mrr}
            rentGrowthRate={getScenarioRates().rentGrowth}
            noi={metrics.noi}
            opex={opexMonthly}
            opexInflationRate={getScenarioRates().opexInflation}
            debtService={mortgages.reduce((sum, m) => sum + m.monthly_payment, 0)}
          />
        </div>

        {/* Wealth Build Chart */}
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold leading-snug">Equity Growth Engine (10 Years)</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Long-term wealth building through appreciation and debt paydown
            </p>
          </div>
          <WealthBuildChart
            noi={metrics.noi}
            capRate={metrics.capRate}
            mortgages={mortgages}
          />
        </div>
      </main>

      {/*<QuickActions onUploadClick={() => setShowUploader(true)} /> //Floating footer with buttons*/}
    </div>
  );
};

export default Index;
