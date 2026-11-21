import { RenewalExposure } from "@/features/properties/RenewalExposure";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { money, percent } from "@/domain/finance/format";
import { useMemo, useState, type ReactNode } from "react";
import PropertiesTable, { type Property } from "@/features/properties/PropertiesTable";
import { StatementCapture } from "@/features/leases/StatementCapture";
import { LeaseUploader } from "@/features/leases/LeaseUploader";
import { LeaseTable, type LeaseData, type ManualLeaseInput } from "@/features/leases/LeaseTable";
import { MortgagesTable, type Mortgage, type MortgageInput } from "@/components/MortgagesTable";
import { connectedReview } from "@/features/portfolio/releaseProfile";

type PropertyOption = { id: string; name: string };

type DataRoomProps = {
  ownerId: string;
  selectedProperty: string;
  onLeaseCaptured: () => Promise<void>;
  filteredProperties: Property[];
  renderPropertyName: (property: Property) => ReactNode;
  filteredLeases: LeaseData[];
  filteredMortgages: Mortgage[];
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
  const { metrics, illustrative } = useWorkspace();
  const allowCapture = !connectedReview && !illustrative;
  const escrowObject = useMemo(
    () => Object.fromEntries(escrowByProperty ?? new Map()),
    [escrowByProperty]
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <header className="space-y-2">
        <h1 id="holdings-title" tabIndex={-1} className="text-[32px] font-semibold leading-[1.12] tracking-tight">Holdings</h1>
        {illustrative && <p className="text-xs text-muted-foreground">Demo edits reset on reload.</p>}
        {filteredProperties.length > 0 && <dl aria-label="Holdings at a glance" className="holdings-totals grid grid-cols-1 gap-y-3 border-y py-4 min-[390px]:grid-cols-3">
          <div><dt>Real estate equity</dt><dd>{money(metrics.equity)}</dd><small>Estimate</small></div>
          <div><dt>Debt</dt><dd>{money(metrics.debt)}</dd><small>Recorded balances</small></div>
          <div><dt>Physical occupancy</dt><dd>{percent(metrics.physicalOccupancy)}</dd><small>Contracted units</small></div>
        </dl>}
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold leading-snug">
              Properties <span className="text-base text-muted-foreground">({filteredProperties.length})</span>
            </h2>
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
        <RenewalExposure />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-snug">
            Leases <span className="text-base text-muted-foreground">({filteredLeases.length})</span>
          </h2>
        </div>
        {leaseSaved && <p role="status" className="text-sm">Lease saved.</p>}
        {allowCapture && <LeaseUploader ownerId={ownerId} properties={propertyOptions} selectedProperty={selectedProperty}
          onOpen={() => setLeaseSaved(false)}
          onUploadComplete={async () => {
            setLeaseSaved(true);
            await onLeaseCaptured();
          }} />}
        <LeaseTable
          leases={filteredLeases}
          selectedProperty={selectedProperty}
          onUpdate={onUpdateLease}
          onDelete={onDeleteLease}
          onAdd={onAddLease}
          propertyOptions={propertyOptions}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-snug">
            Mortgages <span className="text-base text-muted-foreground">({filteredMortgages.length})</span>
          </h2>
        </div>
        {allowCapture && <StatementCapture ownerId={ownerId} mortgages={filteredMortgages} refresh={onLeaseCaptured} />}
        <MortgagesTable
          mortgages={filteredMortgages}
          selectedProperty={selectedProperty}
          onUpdate={onUpdateMortgage}
          onDelete={onDeleteMortgage}
          onAdd={onAddMortgage}
          propertyOptions={propertyOptions}
        />
      </section>
    </div>
  );
}
