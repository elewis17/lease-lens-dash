import { useEffect, useMemo, useRef, useState } from "react";
import { Database, FileText, Home, Landmark, ShieldCheck } from "lucide-react";
import PropertiesTable, { type Property } from "@/features/properties/PropertiesTable";
import { LeaseTable } from "@/features/leases/LeaseTable";
import { MortgagesTable } from "@/components/MortgagesTable";

type PropertyOption = { id: string; name: string };

type DataRoomProps = {
  filteredProperties: Property[];
  filteredLeases: any[];
  filteredMortgages: any[];
  mortgages: any[];
  properties: Property[];
  propertyOptions: PropertyOption[];
  unitOptions: any[];
  escrowByProperty: Map<string, boolean>;
  onAddProperty: (data: Omit<Property, "id">) => void;
  onUpdateProperty: (id: string, data: Partial<Property>) => void;
  onDeleteProperty: (id: string) => void;
  onAddLease: (data: any) => void;
  onUpdateLease: (id: string, data: any) => void;
  onDeleteLease: (id: string) => void;
  onAddMortgage: (data: any) => void;
  onUpdateMortgage: (id: string, data: any) => void;
  onDeleteMortgage: (id: string) => void;
};

const DataSignal = ({
  icon: Icon,
  title,
  value,
  cue,
  description,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  cue: string;
  description: string;
}) => (
  <div className="rounded-xl bg-muted/30 p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{value} {title}</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {cue}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

export default function DataRoom({
  filteredProperties,
  filteredLeases,
  filteredMortgages,
  mortgages,
  properties,
  propertyOptions,
  unitOptions,
  escrowByProperty,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  onAddLease,
  onUpdateLease,
  onDeleteLease,
  onAddMortgage,
  onUpdateMortgage,
  onDeleteMortgage,
}: DataRoomProps) {
  const escrowObject = useMemo(
    () => Object.fromEntries(escrowByProperty ?? new Map()),
    [escrowByProperty]
  );

  const OpexOverTaxes = () => {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;

      const compute = () => {
        const th = el.querySelector<HTMLElement>('th.bg-rose-50\\/60, th.bg-rose-50\\/40');
        if (!th) return;

        const thRect = th.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        setPos({
          left: thRect.left - containerRect.left + 4,
          top: thRect.top - containerRect.top - 6,
        });
      };

      compute();
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }, [filteredProperties.length]);

    return (
      <div ref={wrapRef} className="relative">
        {pos && (
          <span
            className="absolute z-20 inline-flex -translate-y-full items-center rounded-t-lg bg-rose-100 px-3 py-0.5 text-xs font-medium text-rose-700 shadow-sm pointer-events-none"
            style={{ left: pos.left, top: pos.top }}
          >
            OPEX
          </span>
        )}

        <PropertiesTable
          properties={filteredProperties}
          onAdd={onAddProperty}
          onUpdate={onUpdateProperty}
          onDelete={onDeleteProperty}
          escrowByProperty={escrowObject}
        />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-[#050817] p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <Database className="h-4 w-4" />
              Data Room
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Decision Data Room</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
              The source data behind underwriting, portfolio decisions, investment memos, and valuation support.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 text-sm">
            <div>
              <p className="text-xs text-white/70">Properties</p>
              <p className="text-2xl font-bold">{filteredProperties.length}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Leases</p>
              <p className="text-2xl font-bold">{filteredLeases.length}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Mortgages</p>
              <p className="text-2xl font-bold">{filteredMortgages.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Decision-ready data signals</h2>
            <p className="text-sm text-muted-foreground">
              These cues show how each dataset supports the rest of the system.
            </p>
          </div>
          <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            feeds underwriting + memo
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DataSignal
            icon={Home}
            value={filteredProperties.length}
            title="properties"
            cue="used in snapshot"
            description="Property value, type, taxes, insurance, vacancy, and maintenance assumptions drive portfolio value and operating reality."
          />
          <DataSignal
            icon={FileText}
            value={filteredLeases.length}
            title="leases"
            cue="supports rent quality"
            description="Lease records feed contracted rent, occupancy, cash flow, and the confidence behind portfolio income."
          />
          <DataSignal
            icon={Landmark}
            value={filteredMortgages.length}
            title="mortgages"
            cue="feeds debt stress"
            description="Debt balances, payments, rates, and escrow flags drive DSCR, cash flow, refi capacity, and risk watch items."
          />
          <DataSignal
            icon={ShieldCheck}
            value={properties.length > 0 && filteredLeases.length > 0 && filteredMortgages.length > 0 ? "High" : "Medium"}
            title="confidence"
            cue="feeds memo"
            description="Confidence improves as properties, leases, mortgages, and expenses are all populated for the selected scope."
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-snug">
            Properties <span className="text-base text-muted-foreground">({filteredProperties.length})</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports valuation, operating assumptions, and portfolio-level decision context.
          </p>
        </div>
        <OpexOverTaxes />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-snug">
            Active Leases <span className="text-base text-muted-foreground">({filteredLeases.length})</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Feeds rent quality, occupancy, monthly cash flow, and investment memo support.
          </p>
        </div>
        <LeaseTable
          leases={filteredLeases}
          onUpdate={onUpdateLease}
          onDelete={onDeleteLease}
          onAdd={onAddLease}
          propertyOptions={properties.map((p: any) => ({
            id: p.id,
            name: p.alias || p.address || "Untitled Property",
          }))}
          unitOptions={unitOptions}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-snug">
            Mortgages <span className="text-base text-muted-foreground">({mortgages.length})</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drives DSCR, debt stress, refinance capacity, equity visibility, and cash-flow pressure.
          </p>
        </div>
        <MortgagesTable
          mortgages={filteredMortgages}
          onUpdate={onUpdateMortgage}
          onDelete={onDeleteMortgage}
          onAdd={onAddMortgage}
          propertyOptions={propertyOptions}
        />
      </section>
    </div>
  );
}
