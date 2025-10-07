import { useState, useEffect } from "react";
import { DollarSign, Home, TrendingUp, Wallet, LineChart, Percent, Calculator } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PropertyFilter } from "@/components/PropertyFilter";
import { LeaseTable } from "@/components/LeaseTable";
import { LeaseUploader } from "@/components/LeaseUploader";
import { ExpensesForm } from "@/components/ExpensesForm";
import { ProjectionChart } from "@/components/ProjectionChart";
import { QuickActions } from "@/components/QuickActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [leases, setLeases] = useState<any[]>([]);
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

    // Calculate metrics
    let totalMRR = 0;
    let totalExpected = 0;
    let activeLeases = 0;

    const processedLeases = leasesData?.map((lease: any) => {
      totalMRR += parseFloat(lease.monthly_rent.toString());
      totalExpected += parseFloat(lease.monthly_rent.toString());

      if (lease.status === 'active' || lease.status === 'expiring') {
        activeLeases++;
      }

      return {
        id: lease.id,
        tenant: lease.tenant?.name || "Unknown",
        unit: lease.unit?.unit_label || "Unknown",
        monthlyRent: parseFloat(lease.monthly_rent.toString()),
        deposit: parseFloat((lease.deposit || 0).toString()),
        startDate: new Date(lease.start_date),
        leaseEnd: new Date(lease.end_date),
      };
    }) || [];

    const totalOperatingExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0) - expenses.mortgage;
    const noi = (totalMRR * 12) - (totalOperatingExpenses * 12);
    const cashFlow = noi - (expenses.mortgage * 12);
    const purchasePrice = parseFloat((propertyData?.purchase_price || 1).toString());
    const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
    const annualDebt = expenses.mortgage * 12;
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
    // Update property mortgage
    const { error: propError } = await supabase
      .from('properties')
      .update({ mortgage_payment: expensesData.mortgage })
      .eq('id', selectedProperty);

    if (propError) {
      toast({ title: "Error", description: "Failed to update expenses", variant: "destructive" });
      return;
    }

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
          {properties.length > 0 && (
            <PropertyFilter
              properties={properties}
              selectedProperty={selectedProperty}
              onPropertyChange={setSelectedProperty}
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

        {/* Expenses Card */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug">Property Expenses</h2>
          <ExpensesForm
            propertyId={selectedProperty}
            initialData={expenses}
            onSave={handleSaveExpenses}
          />
        </div>

        {/* Projection Chart Card */}
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold leading-snug">10-Year Rent Projection</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Assumes {currentProperty?.rent_growth_rate || 3}% annual rent growth
            </p>
          </div>
          <ProjectionChart
            currentRent={metrics.expectedRent}
            growthRate={currentProperty?.rent_growth_rate || 3}
          />
        </div>
      </main>

      <QuickActions onUploadClick={() => setShowUploader(true)} />
    </div>
  );
};

export default Index;
