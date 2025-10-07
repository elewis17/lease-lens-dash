import { useState, useEffect } from "react";
import { DollarSign, Home, TrendingUp, Wallet, Activity, PieChart } from "lucide-react";
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
    expected: 0,
    occupancy: "0/0",
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

    setLeases(processedLeases);
    setMetrics({
      expected: totalExpected,
      occupancy: `${activeLeases}/${totalUnits}`,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Owner One-Pager
            </h1>
            <p className="text-sm text-muted-foreground">Your portfolio at a glance</p>
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

      <main className="container mx-auto px-4 py-8 space-y-8 pb-24">
        {/* Metrics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Expected Rent"
            value={`$${metrics.expected.toLocaleString()}`}
            subtitle="Monthly"
            icon={DollarSign}
            variant="default"
          />
          <MetricCard
            title="Occupancy"
            value={metrics.occupancy}
            subtitle="Units filled"
            icon={Home}
            variant="success"
          />
          <MetricCard
            title="ARR / MRR"
            value={`$${(metrics.arr / 1000).toFixed(0)}k`}
            subtitle={`$${metrics.mrr.toLocaleString()} monthly`}
            icon={TrendingUp}
            variant="default"
          />
          <MetricCard
            title="Cash Flow"
            value={`$${metrics.cashFlow.toLocaleString()}`}
            subtitle="Monthly"
            icon={Wallet}
            variant={metrics.cashFlow > 0 ? "success" : "warning"}
          />
        </div>

        {/* Advanced Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="NOI"
            value={`$${metrics.noi.toLocaleString()}`}
            subtitle="Net Operating Income (monthly)"
            icon={Activity}
            variant="default"
          />
          <MetricCard
            title="Cap Rate"
            value={`${metrics.capRate.toFixed(2)}%`}
            subtitle="Return on investment"
            icon={PieChart}
            variant="default"
          />
          <MetricCard
            title="DCR"
            value={metrics.dcr.toFixed(2)}
            subtitle="Debt Coverage Ratio"
            icon={TrendingUp}
            variant={metrics.dcr >= 1.25 ? "success" : "warning"}
          />
        </div>

        {/* Lease Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Leases</h2>
          <LeaseTable
            leases={leases}
            onUpdate={handleUpdateLease}
            onDelete={handleDeleteLease}
            onAdd={handleAddLease}
          />
        </div>

        {/* Expenses */}
        <ExpensesForm
          propertyId={selectedProperty}
          initialData={expenses}
          onSave={handleSaveExpenses}
        />

        {/* Projection Chart */}
        <ProjectionChart
          currentRent={metrics.mrr}
          growthRate={currentProperty?.rent_growth_rate || 3}
        />
      </main>

      <QuickActions onUploadClick={() => setShowUploader(true)} />
    </div>
  );
};

export default Index;
