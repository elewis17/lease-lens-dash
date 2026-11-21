import type { z } from "zod";
import type { WorkspacePortfolio } from "./usePortfolio";
import type { manualLeaseForm, mortgageForm } from "./recordValidation";
import type { Property } from "@/features/properties/PropertiesTable";

function replaceRecord<T extends { id: string }>(rows: T[], record: T) {
  return rows.some(row => row.id === record.id) ? rows.map(row => row.id === record.id ? record : row) : [...rows, record];
}

export function writeDemoProperty(portfolio: WorkspacePortfolio, property: Property) {
  return { ...portfolio, properties: replaceRecord(portfolio.properties, property) };
}

export function writeDemoLease(portfolio: WorkspacePortfolio, id: string, lease: z.infer<typeof manualLeaseForm>) {
  const knownUnits = (portfolio.record.units ?? []) as { id: string; property_id: string; unit_label?: string }[];
  const unit = knownUnits.find(row => row.property_id === lease.property_id &&
    row.unit_label?.trim().toLowerCase() === lease.unit_label.trim().toLowerCase())
    ?? { id: crypto.randomUUID(), unit_label: lease.unit_label, property_id: lease.property_id };
  const previous = portfolio.leases.find(row => row.id === id);
  return {
    ...portfolio,
    leases: replaceRecord(portfolio.leases, { ...previous, ...lease, id, unit_id: unit.id }),
    record: {
      ...portfolio.record,
      units: replaceRecord(knownUnits, unit),
      leases: replaceRecord(portfolio.record.leases ?? [], {
        id, unit_id: unit.id, start_date: lease.startDate, end_date: lease.leaseEnd,
        monthly_rent: lease.monthlyRent, status: lease.status ?? null,
      }),
    },
  };
}

export function writeDemoMortgage(portfolio: WorkspacePortfolio, id: string, input: z.infer<typeof mortgageForm> | { includes_escrow: boolean }) {
  if (!("property_id" in input)) {
    return {
      ...portfolio,
      mortgages: portfolio.mortgages.map(row => row.id === id ? { ...row, ...input } : row),
      record: { ...portfolio.record, loans: (portfolio.record.loans ?? []).map(row => row.id === id ? { ...row, ...input } : row) },
    };
  }
  const loan = { ...input, id, loan_name: input.loan_name ?? null, includes_escrow: input.includes_escrow ?? false };
  return {
    ...portfolio,
    mortgages: replaceRecord(portfolio.mortgages, { ...loan, principal: loan.principal_original, start_date: new Date(loan.start_date) }),
    record: { ...portfolio.record, loans: replaceRecord(portfolio.record.loans ?? [], loan) },
  };
}

export function deleteDemoRecord(portfolio: WorkspacePortfolio, kind: "property" | "lease" | "mortgage", id: string) {
  const { record } = portfolio;
  const units = (record.units ?? []).filter(unit => kind !== "property" || unit.property_id !== id);
  const unitIds = new Set(units.map(unit => unit.id));
  const loans = (record.loans ?? []).filter(loan => kind === "property" ? loan.property_id !== id : kind !== "mortgage" || loan.id !== id);
  const loanIds = new Set(loans.map(loan => loan.id));
  const leases = (record.leases ?? []).filter(lease => unitIds.has(lease.unit_id) && (kind !== "lease" || lease.id !== id));
  const leaseIds = new Set(leases.map(lease => lease.id));
  const statements = portfolio.statements.filter(statement => loanIds.has(statement.mortgage_id));
  return {
    ...portfolio, statements,
    properties: portfolio.properties.filter(property => kind !== "property" || property.id !== id),
    leases: portfolio.leases.filter(lease => leaseIds.has(lease.id)),
    mortgages: portfolio.mortgages.filter(loan => loanIds.has(loan.id)),
    record: { ...record, units, loans, leases, statements,
      expenses: (record.expenses ?? []).filter(expense =>
        (kind !== "property" || expense.property_id !== id) && (expense.unit_id === null || unitIds.has(expense.unit_id))),
      payments: (record.payments ?? []).filter(payment => leaseIds.has(payment.lease_id)),
    },
  };
}
