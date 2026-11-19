import DataRoom from "./DataRoom";
import { PortfolioStatus } from "@/features/portfolio/PortfolioStatus";
import { useRecordActions } from "@/features/portfolio/useRecordActions";
import { useWorkspace } from "@/features/portfolio/Workspace";

export default function Holdings() {
  const {
    userId, selectedProperty, setSelectedProperty, query, properties, mortgages, leases,
    filteredProperties, filteredLeases, filteredMortgages, propertyOptions, escrowByProperty,
  } = useWorkspace();
  const { saveProperty, saveManualLease, saveMortgage, requestDelete, deleteDialog } = useRecordActions({
    userId, properties, refresh: query.refresh, selectedProperty, clearProperty: () => setSelectedProperty(""),
  });

  return (
    <PortfolioStatus>
      <DataRoom
        ownerId={userId}
        selectedProperty={selectedProperty}
        onLeaseCaptured={query.refresh}
        filteredProperties={filteredProperties}
        filteredLeases={filteredLeases}
        filteredMortgages={filteredMortgages}
        mortgages={mortgages}
        properties={properties}
        propertyOptions={propertyOptions}
        escrowByProperty={escrowByProperty}
        onAddProperty={saveProperty}
        onUpdateProperty={(id, input) => saveProperty(input, id)}
        onDeleteProperty={(id) => requestDelete("property", id, properties.find(property => property.id === id)?.alias ?? "Property")}
        onAddLease={(id, input) => saveManualLease(id, input, false)}
        onUpdateLease={(id, input) => saveManualLease(id, input, true)}
        onDeleteLease={(id) => requestDelete("lease", id, leases.find(lease => lease.id === id)?.tenant ?? "Lease")}
        onAddMortgage={saveMortgage}
        onUpdateMortgage={(id, input) => saveMortgage(input, id)}
        onDeleteMortgage={(id) => requestDelete("mortgage", id, mortgages.find(loan => loan.id === id)?.loan_name ?? "Mortgage")}
      />
      {deleteDialog}
    </PortfolioStatus>
  );
}
