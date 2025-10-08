import { useState, useEffect } from "react";
import { DollarSign, Home, TrendingUp, Wallet, LineChart, Percent, Calculator } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PropertyFilter } from "@/components/PropertyFilter";
import { LeaseTable } from "@/components/LeaseTable";
import { LeaseUploader } from "@/components/LeaseUploader";
import { ExpensesForm } from "@/components/ExpensesForm";
import { IncomeAndSafetyChart } from "@/components/IncomeAndSafetyChart";
import { WealthBuildChart } from "@/components/WealthBuildChart";
import { MortgagesTable } from "@/components/MortgagesTable";
import { QuickActions } from "@/components/QuickActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("All");
  const [leases, setLeases] = useState<any[]>([]);
  const [mortgages, setMortgages] = useState<any[]>([]);
  const [expenses, setExpenses] = useState({
    mortgage: 0,
    taxes: 0,
    insurance: 0,
    maintenance: 0,
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
  });
  const [currentProperty, setCurrentProperty] = useState<any>(null);
  const { toast } = useToast();

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
      
      // Calculate expenses breakdown
      const mortgage = parseFloat((propertyData.mortgage_payment || 0).toString());
      const expensesByCategory = {
        mortgage,
        taxes: 0,
        insurance: 0,
        maintenance: 0,
        misc: 0,
      };

      expensesData?.forEach((exp: any) => {
        const amount = parseFloat(exp.amount.toString());
        const category = exp.category;
        if (category === 'tax') expensesByCategory.taxes += amount;
        else if (category === 'insurance') expensesByCategory.insurance += amount;
        else if (category === 'repairs') expensesByCategory.maintenance += amount;
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

    const totalOperatingExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0) - expenses.mortgage;
    const noi = (totalMRR * 12) - (totalOperatingExpenses * 12);
    const cashFlow = noi - (totalDebtService * 12);
    const purchasePrice = parseFloat((propertyData?.purchase_price || 1).toString());
    const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
    const annualDebt = totalDebtService * 12;
    const dcr = annualDebt > 0 ? noi / annualDebt : 0;
    const totalUnits = propertyData?.total_units || 1;
    const occupancyRate = totalUnits > 0 ? (activeLeases / totalUnits) * 100 : 0;

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

  // Filter leases based on selected unit
  const filteredLeases = selectedUnit === "All" 
    ? leases 
    : leases.filter(lease => lease.unit.toLowerCase() === selectedUnit.toLowerCase());

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
            <h1 className="text-2xl font-bold leading-snug">Landlord Dashboard</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">Instant lease insights, zero tabs.</p>
          </div>
          {leases.length > 0 && (
            <PropertyFilter
              units={[...new Set(leases.map(l => l.unit))]}
              selectedUnit={selectedUnit}
              onUnitChange={setSelectedUnit}
            />
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <MetricCard
            title="Expected Rent"
            value={`$${metrics.expectedRent.toLocaleString()}`}
            subtitle="Per month"
            icon={DollarSign}
            variant="default"
          />
          <MetricCard
            title="Occupancy Rate"
            value={`${metrics.occupancyRate.toFixed(1)}%`}
            subtitle={`${metrics.activeLeases} of ${currentProperty?.total_units || 0} units filled`}
            icon={Home}
            variant="success"
          />
          <MetricCard
            title="ARR"
            value={`$${metrics.arr.toLocaleString()}`}
            subtitle={`MRR: $${metrics.mrr.toLocaleString()}`}
            icon={TrendingUp}
            variant="default"
          />
          <MetricCard
            title="NOI"
            value={`$${metrics.noi.toLocaleString()}`}
            subtitle="Net Operating Income"
            icon={Wallet}
            variant="success"
          />
          <MetricCard
            title="Cash Flow"
            value={`$${metrics.cashFlow.toLocaleString()}`}
            subtitle={metrics.cashFlow >= 0 ? "Positive monthly flow" : "Negative monthly flow"}
            icon={LineChart}
            variant={metrics.cashFlow >= 0 ? "success" : "warning"}
          />
          <MetricCard
            title="Cap Rate"
            value={`${metrics.capRate.toFixed(2)}%`}
            subtitle="Return on investment"
            icon={Percent}
            variant="default"
          />
          <MetricCard
            title="DCR"
            value={metrics.dcr.toFixed(2)}
            subtitle={metrics.dcr >= 1.25 ? "Healthy coverage" : "Low coverage"}
            icon={Calculator}
            variant={metrics.dcr >= 1.25 ? "success" : "warning"}
          />
        </div>

        {/* Lease Table Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">
            Active Leases <span className="text-muted-foreground text-base">({filteredLeases.length})</span>
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
              leases={filteredLeases}
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
          <h2 className="text-xl font-semibold leading-snug">Property Expenses</h2>
          <ExpensesForm
            propertyId={selectedProperty}
            initialData={expenses}
            onSave={handleSaveExpenses}
          />
        </div>

        {/* Income & Safety Chart */}
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold leading-snug">Income & Safety View (10 Years)</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Projected rent at {currentProperty?.rent_growth_rate || 3}% growth vs. expenses at {currentProperty?.opex_inflation_rate || 2.5}% inflation
            </p>
          </div>
          <IncomeAndSafetyChart
            currentRent={metrics.mrr}
            rentGrowthRate={currentProperty?.rent_growth_rate || 3}
            noi={metrics.noi}
            opex={metrics.mrr - metrics.noi}
            opexInflationRate={currentProperty?.opex_inflation_rate || 2.5}
            debtService={mortgages.reduce((sum, m) => sum + m.monthly_payment, 0)}
          />
        </div>

        {/* Wealth Build Chart */}
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold leading-snug">Wealth Build View (10 Years)</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Long-term equity growth through appreciation and debt paydown
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
