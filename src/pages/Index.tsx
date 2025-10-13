import { useState, useEffect } from "react";
import { DollarSign, Home, TrendingUp, Wallet, LineChart, Percent, Calculator, Info} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PropertyFilter } from "@/components/PropertyFilter";
import { LeaseTable } from "@/components/LeaseTable";
import { LeaseUploader } from "@/components/LeaseUploader";
import { ExpensesForm } from "@/components/ExpensesForm";
import { IncomeAndSafetyChart } from "@/components/IncomeAndSafetyChart";
import { WealthBuildChart } from "@/components/WealthBuildChart";
import { MortgagesTable } from "@/components/MortgagesTable";
import { QuickActions } from "@/components/QuickActions";
import { ROISummaryCard } from "@/components/ROISummaryCard";
import { ScenarioToggle, Scenario } from "@/components/ScenarioToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [scenario, setScenario] = useState<Scenario>("base");
  const [leases, setLeases] = useState<any[]>([]);
  const [mortgages, setMortgages] = useState<any[]>([]);
  const [expenses, setExpenses] = useState({
    taxes: 0,
    insurance: 0,
    maintenance: 0,
    management: 0,
    utilities: 0,
    hoa: 0,
    misc: 0,
  });
  const [metrics, setMetrics] = useState({
    expectedRent: 0,
    occupancyRate: 0,
    activeLeases: 0,
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
  const [currentProperty, setCurrentProperty] = useState<any>(null);
  const { toast } = useToast();

  // ---- Derived totals for Property Financials ----
const totalMonthlyExpense = Object.values(expenses).reduce((sum, val) => sum + (Number(val) || 0), 0);

  // Get scenario-adjusted growth rates
  const getScenarioRates = () => {
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

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      loadData();
    }
  }, [selectedProperty]);

  const loadProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error("Error loading properties:", error);
      return;
    }
    setProperties(data || []);
    if (data && data.length > 0) {
      setSelectedProperty(data[0].id);
      setCurrentProperty(data[0]);
    }
  };

  const loadData = async () => {
    if (!selectedProperty) return;

    // Fetch leases for selected property
    const { data: leasesData, error: leasesError } = await supabase
      .from('leases')
      .select(`
        *,
        tenant:tenants(*),
        unit:units!inner(*)
      `)
      .eq('unit.property_id', selectedProperty);

    // Fetch mortgages for selected property
    const { data: mortgagesData } = await supabase
      .from('mortgages')
      .select('*')
      .eq('property_id', selectedProperty);

    if (leasesError) {
      console.error("Error loading leases:", leasesError);
    }

    // Fetch expenses for selected property
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('property_id', selectedProperty);

    // Fetch current property details
    const { data: propertyData } = await supabase
      .from('properties')
      .select('*')
      .eq('id', selectedProperty)
      .single();

    if (propertyData) {
      setCurrentProperty(propertyData);
      
      // Calculate expenses breakdown (OPEX only, excluding mortgage)
      const expensesByCategory = {
        taxes: 0,
        insurance: 0,
        maintenance: 0,
        management: 0,
        utilities: 0,
        hoa: 0,
        misc: 0,
      };

      expensesData?.forEach((exp: any) => {
        const amount = parseFloat(exp.amount.toString());
        const category = exp.category;
        if (category === 'tax') expensesByCategory.taxes += amount;
        else if (category === 'insurance') expensesByCategory.insurance += amount;
        else if (category === 'repairs') expensesByCategory.maintenance += amount;
        else if (category === 'management') expensesByCategory.management += amount;
        else if (category === 'utilities') expensesByCategory.utilities += amount;
        else if (category === 'hoa') expensesByCategory.hoa += amount;
        else expensesByCategory.misc += amount;
      });

      setExpenses(expensesByCategory);
    }

    // Process mortgages
    const processedMortgages = mortgagesData?.map((mtg: any) => ({
      id: mtg.id,
      loan_name: mtg.loan_name,
      principal: parseFloat(mtg.principal.toString()),
      interest_rate: parseFloat(mtg.interest_rate.toString()),
      term_months: mtg.term_months,
      start_date: new Date(mtg.start_date),
      monthly_payment: parseFloat(mtg.monthly_payment.toString()),
    })) || [];

    setMortgages(processedMortgages);

    // Calculate total debt service from mortgages
    const totalDebtService = processedMortgages.reduce((sum, mtg) => sum + mtg.monthly_payment, 0);

    // Calculate metrics
    let totalMRR = 0;
    let totalExpected = 0;
    let activeLeases = 0;

    const processedLeases = leasesData?.map((lease: any) => {
      const monthlyRent = parseFloat(lease.monthly_rent.toString());
      const vacancyRate = parseFloat((lease.vacancy_rate || 5).toString()) / 100;
      const adjustedRent = monthlyRent * (1 - vacancyRate);
      
      totalMRR += adjustedRent;
      totalExpected += monthlyRent;

      if (lease.status === 'active' || lease.status === 'expiring') {
        activeLeases++;
      }

      return {
        id: lease.id,
        tenant: lease.tenant?.name || "Unknown",
        unit: lease.unit?.unit_label || "Unknown",
        monthlyRent: parseFloat(lease.monthly_rent.toString()),
        vacancyRate: parseFloat((lease.vacancy_rate || 5).toString()),
        deposit: parseFloat((lease.deposit || 0).toString()),
        startDate: new Date(lease.start_date),
        leaseEnd: new Date(lease.end_date),
      };
    }) || [];

    // Calculate total OPEX (excluding mortgage - that's debt service)
    const totalMonthlyOpex = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    const noi = (totalMRR * 12) - (totalMonthlyOpex * 12);
    const cashFlow = noi - (totalDebtService * 12);
    const purchasePrice = parseFloat((propertyData?.purchase_price || 1).toString());
    const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
    const annualDebt = totalDebtService * 12;
    const dcr = annualDebt > 0 ? noi / annualDebt : 0;
    const totalUnits = propertyData?.total_units || 1;
    const occupancyRate = totalUnits > 0 ? (activeLeases / totalUnits) * 100 : 0;
    
    // Calculate ROI metrics
    const totalInvestment = purchasePrice + (processedMortgages.reduce((sum, m) => sum + m.principal, 0));
    const roi = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
    const cashOnCash = totalInvestment > 0 ? (cashFlow / totalInvestment) * 100 : 0;
    
    // Simple 10-year IRR approximation using compound growth
    const futureValue = purchasePrice * Math.pow(1.03, 10); // 3% appreciation
    const totalCashFlows = cashFlow * 10;
    const irr10Year = totalInvestment > 0 ? (Math.pow((futureValue + totalCashFlows) / totalInvestment, 1/10) - 1) * 100 : 0;

    setLeases(processedLeases);
    setMetrics({
      expectedRent: totalExpected,
      occupancyRate,
      activeLeases,
      arr: totalMRR * 12,
      mrr: totalMRR,
      noi: noi / 12,
      cashFlow: cashFlow / 12,
      capRate,
      dcr,
      roi,
      cashOnCash,
      irr10Year,
    });
  };

  const handleUpdateLease = async (id: string, data: Partial<any>) => {
    const { error } = await supabase
      .from('leases')
      .update({
        monthly_rent: data.monthlyRent,
        vacancy_rate: data.vacancyRate,
        deposit: data.deposit,
        start_date: data.startDate?.toISOString(),
        end_date: data.leaseEnd?.toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to update lease", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lease updated successfully" });
      loadData();
    }
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
    // First, get or create tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: data.tenant })
      .select()
      .single();

    if (tenantError) {
      toast({ title: "Error", description: "Failed to create tenant", variant: "destructive" });
      return;
    }

    // Get or create unit
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .insert({ unit_label: data.unit, property_id: selectedProperty })
      .select()
      .single();

    if (unitError) {
      toast({ title: "Error", description: "Failed to create unit", variant: "destructive" });
      return;
    }

    // Create lease
    const { error: leaseError } = await supabase.from('leases').insert({
      tenant_id: tenantData.id,
      unit_id: unitData.id,
      monthly_rent: data.monthlyRent,
      vacancy_rate: data.vacancyRate ?? 5,
      deposit: data.deposit,
      start_date: data.startDate.toISOString(),
      end_date: data.leaseEnd.toISOString(),
      status: 'active',
    });

    if (leaseError) {
      toast({ title: "Error", description: "Failed to create lease", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lease added successfully" });
      loadData();
    }
  };

  const handleSaveExpenses = async (expensesData: any) => {
    // Delete existing expenses and create new ones
    await supabase.from('expenses').delete().eq('property_id', selectedProperty);

    const expensesToInsert = [];
    if (expensesData.taxes > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'tax', amount: expensesData.taxes, date: new Date().toISOString() });
    }
    if (expensesData.insurance > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'insurance', amount: expensesData.insurance, date: new Date().toISOString() });
    }
    if (expensesData.maintenance > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'repairs', amount: expensesData.maintenance, date: new Date().toISOString() });
    }
    if (expensesData.management > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'management', amount: expensesData.management, date: new Date().toISOString() });
    }
    if (expensesData.utilities > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'utilities', amount: expensesData.utilities, date: new Date().toISOString() });
    }
    if (expensesData.hoa > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'hoa', amount: expensesData.hoa, date: new Date().toISOString() });
    }
    if (expensesData.misc > 0) {
      expensesToInsert.push({ property_id: selectedProperty, category: 'other', amount: expensesData.misc, date: new Date().toISOString() });
    }

    if (expensesToInsert.length > 0) {
      await supabase.from('expenses').insert(expensesToInsert);
    }

    toast({ title: "Success", description: "Expenses saved successfully" });
    loadData();
  };

  const handleUpdateMortgage = async (id: string, data: any) => {
    const { error } = await supabase
      .from('mortgages')
      .update({
        loan_name: data.loan_name,
        principal: data.principal,
        interest_rate: data.interest_rate,
        term_months: data.term_months,
        start_date: data.start_date instanceof Date ? data.start_date.toISOString() : data.start_date,
        monthly_payment: data.monthly_payment,
      })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to update mortgage", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Mortgage updated successfully" });
      loadData();
    }
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
    const { error } = await supabase.from('mortgages').insert({
      property_id: selectedProperty,
      loan_name: data.loan_name,
      principal: data.principal,
      interest_rate: data.interest_rate,
      term_months: data.term_months,
      start_date: data.start_date instanceof Date ? data.start_date.toISOString() : data.start_date,
      monthly_payment: data.monthly_payment,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add mortgage", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Mortgage added successfully" });
      loadData();
    }
  };


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
          <div>
            <h1 className="text-2xl font-bold leading-snug">Landlord Snapshot</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">Instant lease insights, zero tabs.</p>
          </div>
          <div className="flex items-center gap-4">
            {properties.length > 0 && (
              <PropertyFilter
                properties={properties}
                selectedProperty={selectedProperty}
                onPropertyChange={setSelectedProperty}
              />
            )}
            <ScenarioToggle scenario={scenario} onScenarioChange={setScenario} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
        {/* ---- Investment Performance ---- */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <MetricCard
              title="ROI"
              value={`${metrics.roi.toFixed(2)}%`}
              subtitle="Return on investment"
              icon={TrendingUp}
              variant="default"
            />
            <MetricCard
              title="Cap Rate"
              value={`${metrics.capRate.toFixed(2)}%`}
              subtitle="NOI ÷ Property Value"
              icon={Percent}
              variant="default"
            />
            <MetricCard
              title="10-Year IRR"
              value={`${metrics.irr10Year.toFixed(2)}%`}
              subtitle="Time-weighted return"
              icon={LineChart}
              variant="default"
            />
            <MetricCard
              title="Cash-on-Cash"
              value={`${metrics.cashOnCash.toFixed(2)}%`}
              subtitle="Cash return / cash invested"
              icon={DollarSign}xs
              variant="success"
            />
          </div>
        </section>

        {/* ---- Property Financials ---- */}
        <section className="mt-10">
          <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 p-8 shadow-sm border border-gray-100">
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Property Financials Summary</h2>

              {/* Standard info icon + tooltip */}
              <div className="relative group">
                <button
                  type="button"
                  aria-label="About Property Financials"
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
                >
                  <Info className="h-5 w-5" />
                </button>
                <div
                  className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition
                            absolute z-10 mt-2 w-[30rem] max-w-[90vw] rounded-xl border border-gray-200
                            bg-white p-4 text-[13px] shadow-lg"
                >
                  <p className="mb-2 font-medium text-gray-900">What these mean (and why they matter)</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li><strong>Contracted Monthly Rent</strong> — total rent due from current leases; your top-line rental revenue.</li>
                    <li><strong>Total Monthly Expense</strong> — all operating costs; tracking this keeps spending in check.</li>
                    <li><strong>Net Operating Income (NOI)</strong> — revenue minus operating expenses (no debt); core profitability metric.</li>
                    <li><strong>Monthly Cash Flow</strong> — money left after all expenses & debt; positive flow builds reserves.</li>
                    <li><strong>Occupancy Rate</strong> — % of units leased; steadier income at higher occupancy.</li>
                    <li><strong>DCR</strong> — debt coverage ratio (NOI ÷ debt payments); <em>healthy is typically ≥ 1.25</em>.</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t text-gray-500">
                    <p className="mb-1 font-medium text-gray-900">Samples (Investment Performance terms):</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>ROI</strong> — Return on Investment: profitability vs. total investment.</li>
                      <li><strong>Cap Rate</strong> — net income ÷ property value.</li>
                      <li><strong>10-Year IRR</strong> — Internal Rate of Return over ten years.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* P&L order: 3×2 grid (no mini cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
              {/* 1) Contracted Monthly Rent */}
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Contracted Monthly Rent</p>
                  <div className="text-2xl font-semibold leading-tight">
                    ${metrics.expectedRent.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 2) Total Monthly Expense */}
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                  <Calculator className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Operating Expenses (OPEX)</p>
                  <div className="text-2xl font-semibold leading-tight">
                    ${totalMonthlyExpense.toLocaleString()}
                  </div>
                    <p className="text-xs text-muted-foreground">*excludes debt</p>
                </div>
              </div>

              {/* 3) Net Operating Income (NOI) */}
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Net Operating Income (NOI)</p>
                  <div className="text-2xl font-semibold leading-tight">
                    ${metrics.noi.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 4) Monthly Cash Flow */}
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <LineChart className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Monthly Cash Flow</p>
                  <div className="text-2xl font-semibold leading-tight">
                    ${metrics.cashFlow.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                  </p>
                </div>
              </div>

              {/* 5) Occupancy Rate */}
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                  <Home className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Occupancy Rate</p>
                  <div className="text-2xl font-semibold leading-tight">
                    {metrics.occupancyRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeLeases} of {(currentProperty?.total_units || 0)} units filled
                  </p>
                </div>
              </div>

              {/* 6) DCR */}
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Calculator className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Debt Coverage Ratio (DCR)</p>
                  <div className="text-2xl font-semibold leading-tight">
                    {metrics.dcr.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.dcr >= 1.25 ? "Healthy coverage" : "Low coverage"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lease Table Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">
            Active Leases <span className="text-muted-foreground text-base">({leases.length})</span>
          </h2>
          {leases.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center space-y-4 shadow-sm animate-fade-in">
              <div className="text-muted-foreground">
                <p className="font-medium text-base mb-2">No leases yet</p>
                <p className="text-sm leading-relaxed">Add your first lease to start tracking rent and occupancy</p>
              </div>
            </div>
          ) : (
            <LeaseTable
              leases={leases}
              onUpdate={handleUpdateLease}
              onDelete={handleDeleteLease}
              onAdd={handleAddLease}
            />
          )}
        </div>

        {/* Mortgages Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">
            Mortgages <span className="text-muted-foreground text-base">({mortgages.length})</span>
          </h2>
          <MortgagesTable
            mortgages={mortgages}
            onUpdate={handleUpdateMortgage}
            onDelete={handleDeleteMortgage}
            onAdd={handleAddMortgage}
          />
        </div>

        {/* Expenses Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">Operating Expenses (OPEX)</h2>
          <p className="text-xs text-muted-foreground">
            Enter all operating expenses excluding mortgage principal & interest (debt service tracked separately)
          </p>
          <ExpensesForm
            propertyId={selectedProperty}
            initialData={expenses}
            onSave={handleSaveExpenses}
          />
        </div>

        {/* Income & Safety Chart */}
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold leading-snug">Cash Flow & Risk (10 Years)</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {scenario.charAt(0).toUpperCase() + scenario.slice(1)} scenario: Rent at {getScenarioRates().rentGrowth.toFixed(1)}% growth vs. OPEX at {getScenarioRates().opexInflation.toFixed(1)}% inflation
            </p>
          </div>
          <IncomeAndSafetyChart
            currentRent={metrics.mrr}
            rentGrowthRate={getScenarioRates().rentGrowth}
            noi={metrics.noi}
            opex={Object.values(expenses).reduce((sum, val) => sum + val, 0)}
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

      <QuickActions onUploadClick={() => setShowUploader(true)} />
    </div>
  );
};

export default Index;
