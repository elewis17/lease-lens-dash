import { useState, useEffect } from "react";
import { DollarSign, Home, TrendingUp, Wallet } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { FilterBar } from "@/components/FilterBar";
import { LeaseTable } from "@/components/LeaseTable";
import { LeaseUploader } from "@/components/LeaseUploader";
import { RevenueChart } from "@/components/RevenueChart";
import { QuickActions } from "@/components/QuickActions";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showUploader, setShowUploader] = useState(false);
  const [leases, setLeases] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    collected: 0,
    expected: 0,
    occupancy: "0/0",
    arr: 0,
    mrr: 0,
    netCashFlow: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Fetch leases with tenant and unit info
    const { data: leasesData, error } = await supabase
      .from('leases')
      .select(`
        *,
        tenant:tenants(*),
        unit:units(*),
        payments(*)
      `);

    if (error) {
      console.error("Error loading leases:", error);
      return;
    }

    // Fetch expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*');

    // Fetch property
    const { data: propertyData } = await supabase
      .from('properties')
      .select('*')
      .single();

    // Calculate metrics
    let totalMRR = 0;
    let totalCollected = 0;
    let totalExpected = 0;
    let activeLeases = 0;

    const processedLeases = leasesData?.map((lease: any) => {
      const today = new Date();
      const endDate = new Date(lease.end_date);
      const daysUntilEnd = differenceInDays(endDate, today);
      
      totalMRR += parseFloat(lease.monthly_rent.toString());
      totalExpected += parseFloat(lease.monthly_rent.toString());

      // Check payment status
      const currentPayment = lease.payments?.find((p: any) => {
        const dueDate = new Date(p.due_date);
        return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
      });

      let status = "paid";
      let daysOverdue = 0;

      if (currentPayment) {
      if (currentPayment.status === 'paid') {
        totalCollected += parseFloat(currentPayment.paid_amount.toString());
        } else if (currentPayment.status === 'overdue') {
          status = "overdue";
          daysOverdue = differenceInDays(today, new Date(currentPayment.due_date));
        }
      }

      if (daysUntilEnd <= 60 && daysUntilEnd > 0) {
        status = "expiring";
      }

      if (lease.status === 'active' || lease.status === 'expiring') {
        activeLeases++;
      }

      return {
        id: lease.id,
        tenant: lease.tenant?.name || "Unknown",
        unit: lease.unit?.unit_label || "Unknown",
        monthlyRent: parseFloat(lease.monthly_rent.toString()),
        status,
        leaseEnd: endDate,
        daysOverdue,
        deposit: parseFloat((lease.deposit || 0).toString()),
        startDate: new Date(lease.start_date),
      };
    }) || [];

    const totalExpenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
    const mortgage = parseFloat((propertyData?.mortgage_payment || 0).toString());
    const totalUnits = propertyData?.total_units || 3;

    setLeases(processedLeases);
    setMetrics({
      collected: totalCollected,
      expected: totalExpected,
      occupancy: `${activeLeases}/${totalUnits}`,
      arr: totalMRR * 12,
      mrr: totalMRR,
      netCashFlow: totalCollected - totalExpenses - mortgage,
    });
  };

  const filteredLeases = leases.filter((lease) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "paid") return lease.status === "paid";
    if (activeFilter === "overdue") return lease.status === "overdue";
    if (activeFilter === "expiring") return lease.status === "expiring";
    return true;
  });

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Owner One-Pager</h1>
          <p className="text-sm text-muted-foreground">Instant lease insights, zero tabs</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 pb-24">
        {/* Metrics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="This Month"
            value={`$${metrics.collected.toLocaleString()}`}
            subtitle={`of $${metrics.expected.toLocaleString()} expected`}
            icon={DollarSign}
            variant={metrics.collected >= metrics.expected ? "success" : "warning"}
          />
          <MetricCard
            title="Occupancy"
            value={metrics.occupancy}
            subtitle="Units filled"
            icon={Home}
            variant="default"
          />
          <MetricCard
            title="ARR / MRR"
            value={`$${metrics.arr.toLocaleString()}`}
            subtitle={`$${metrics.mrr.toLocaleString()} per month`}
            icon={TrendingUp}
            variant="default"
          />
          <MetricCard
            title="Net Cash Flow"
            value={`$${metrics.netCashFlow.toLocaleString()}`}
            subtitle="This month"
            icon={Wallet}
            variant={metrics.netCashFlow > 0 ? "success" : "warning"}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>

        {/* Lease Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tenants & Leases</h2>
          <LeaseTable leases={filteredLeases} />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />

        {/* Renewal Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Next Renewals</h3>
            <div className="space-y-3">
              {leases
                .filter(l => l.status === "expiring")
                .slice(0, 3)
                .map(lease => (
                  <div key={lease.id} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{lease.tenant}</p>
                        <p className="text-sm text-muted-foreground">
                          {lease.leaseEnd.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Suggested</p>
                        <p className="font-medium text-success">+5% = ${(lease.monthlyRent * 1.05).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Maintenance</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Leaky faucet</p>
                    <p className="text-sm text-muted-foreground">Unit A • Plumbing</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-success-light text-success-foreground">Completed</span>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">HVAC not cooling</p>
                    <p className="text-sm text-muted-foreground">Unit B • HVAC</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-warning-light text-warning-foreground">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <QuickActions onUploadClick={() => setShowUploader(true)} />
    </div>
  );
};

export default Index;
