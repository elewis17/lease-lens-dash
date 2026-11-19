import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { money, percent } from "@/domain/finance/format";
import { useMemo, useState, type ReactNode } from "react";
import PropertiesTable, { type Property } from "@/features/properties/PropertiesTable";
import { StatementCapture } from "@/features/leases/StatementCapture";
import { LeaseUploader } from "@/features/leases/LeaseUploader";
import { LeaseTable, type LeaseData, type ManualLeaseInput } from "@/features/leases/LeaseTable";
import { MortgagesTable, type Mortgage, type MortgageInput } from "@/components/MortgagesTable";

type PropertyOption = { id: string; name: string };

type DataRoomProps = {
  ownerId: string;
  selectedProperty: string;
  onLeaseCaptured: () => Promise<void>;
  filteredProperties: Property[];
  renderPropertyName: (property: Property) => ReactNode;
  filteredLeases: LeaseData[];
  filteredMortgages: Mortgage[];
  mortgages: Mortgage[];
  propertyOptions: PropertyOption[];
  escrowByProperty: Map<string, boolean>;
  onAddProperty: (data: Partial<Property>) => Promise<boolean>;
  onUpdateProperty: (id: string, data: Partial<Property>) => Promise<boolean>;
  onDeleteProperty: (id: string) => void;
  onAddLease: (id: string, data: ManualLeaseInput) => Promise<boolean>;
  onUpdateLease: (id: string, data: ManualLeaseInput) => Promise<boolean>;
  onDeleteLease: (id: string) => void;
  onAddMortgage: (data: MortgageInput) => Promise<boolean>;
  onUpdateMortgage: (id: string, data: MortgageInput) => Promise<boolean>;
  onDeleteMortgage: (id: string) => void;
};

export default function DataRoom({
  ownerId,
  selectedProperty,
  onLeaseCaptured,
  filteredProperties,
  renderPropertyName,
  filteredLeases,
  filteredMortgages,
  mortgages,
  propertyOptions,
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
  const [leaseSaved, setLeaseSaved] = useState(false);
  const { metrics } = useWorkspace();
  const escrowObject = useMemo(
    () => Object.fromEntries(escrowByProperty ?? new Map()),
    [escrowByProperty]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 id="holdings-title" tabIndex={-1} className="text-3xl font-semibold">Holdings</h1>
        <p className="text-sm text-muted-foreground">Open a property to review its records and sources.</p>
        {filteredProperties.length > 0 && <dl aria-label="Holdings at a glance" className="grid grid-cols-2 gap-4 border-y py-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Real estate equity · Estimate</dt>
            <dd className="font-semibold tabular-nums">{money(metrics.equity)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Debt · Recorded balances</dt>
            <dd className="font-semibold tabular-nums">{money(metrics.debt)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Physical occupancy · Contracted units</dt>
            <dd className="font-semibold tabular-nums">{percent(metrics.physicalOccupancy)}</dd></div>
        </dl>}
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-snug">
            Properties <span className="text-base text-muted-foreground">({filteredProperties.length})</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports valuation, operating assumptions, and portfolio-level decision context.
          </p>
        </div>
        <PropertiesTable
          properties={filteredProperties}
          metrics={metrics.assets}
          renderName={renderPropertyName}
          onAdd={onAddProperty}
          onUpdate={onUpdateProperty}
          onDelete={onDeleteProperty}
          escrowByProperty={escrowObject}
        />
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
        {leaseSaved && <p role="status" className="text-sm">Lease saved.</p>}
        <LeaseUploader ownerId={ownerId} properties={propertyOptions} selectedProperty={selectedProperty}
          onOpen={() => setLeaseSaved(false)}
          onUploadComplete={async () => {
            setLeaseSaved(true);
            await onLeaseCaptured();
          }} />
        <LeaseTable
          leases={filteredLeases}
          onUpdate={onUpdateLease}
          onDelete={onDeleteLease}
          onAdd={onAddLease}
          propertyOptions={propertyOptions}
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
        <StatementCapture ownerId={ownerId} mortgages={filteredMortgages} refresh={onLeaseCaptured} />
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
