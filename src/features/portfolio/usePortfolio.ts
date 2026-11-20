import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PortfolioRecord } from "@/domain/finance/portfolio";
import type { Mortgage } from "@/components/MortgagesTable";
import type { LeaseData } from "@/features/leases/LeaseTable";
import type { Property } from "@/features/properties/PropertiesTable";
import type { Tables } from "@/integrations/supabase/types";
import { connectedReview } from "./releaseProfile";

const portfolioKey = (userId: string) => ["portfolio", userId] as const;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

async function readAll<T>(source: string, read: (start: number, end: number) => Page<T>, signal: AbortSignal) {
  const pageSize = 500;
  const rows: T[] = [];
  for (let start = 0; ; start += pageSize) {
    signal.throwIfAborted();
    const { data, error } = await read(start, start + pageSize - 1);
    signal.throwIfAborted();
    if (error || !data) throw new Error(`Could not load ${source}.`);
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

async function readRelated<T>(source: string, ids: readonly string[],
  read: (ids: string[], start: number, end: number) => Page<T>, signal: AbortSignal) {
  const rows: T[] = [];
  for (let start = 0; start < ids.length; start += 80) {
    const batch = ids.slice(start, start + 80);
    rows.push(...await readAll(source, (from, to) => read(batch, from, to), signal));
  }
  return rows;
}

async function readLegacyRecords(ownerProperties: string[], signal: AbortSignal) {
  // Descendant IDs come exclusively from the signed-in user's owned properties.
  const [units, loans, directExpenses] = await Promise.all([
    readRelated("units", ownerProperties, (ids, start, end) => supabase.from("units")
      .select("id, unit_label, property_id").in("property_id", ids).order("id").range(start, end).abortSignal(signal), signal),
    readRelated("mortgages", ownerProperties, (ids, start, end) => supabase.from("mortgages")
      .select("*").in("property_id", ids).order("id").range(start, end).abortSignal(signal), signal),
    readRelated("property expenses", ownerProperties, (ids, start, end) => supabase.from("expenses")
      .select("property_id, unit_id, date, amount, category").in("property_id", ids).order("id").range(start, end).abortSignal(signal), signal),
  ]);
  const propertyScope = new Set(ownerProperties);
  const scopedUnits = units.filter(unit => propertyScope.has(unit.property_id));
  const unitIds = scopedUnits.map(unit => unit.id);
  const unitScope = new Set(unitIds);
  const [leaseRows, unitExpenses] = await Promise.all([
    readRelated("leases", unitIds, (ids, start, end) => supabase.from("leases")
      .select("id, monthly_rent, status, start_date, end_date, deposit, doc_url, unit_id")
      .in("unit_id", ids).order("id").range(start, end).abortSignal(signal), signal),
    readRelated("unit expenses", unitIds, (ids, start, end) => supabase.from("expenses")
      .select("property_id, unit_id, date, amount, category").is("property_id", null).in("unit_id", ids)
      .order("id").range(start, end).abortSignal(signal), signal),
  ]);
  const scopedLeases = leaseRows.filter(lease => unitScope.has(lease.unit_id));
  const leaseScope = new Set(scopedLeases.map(lease => lease.id));
  const payments = await readRelated("payments", [...leaseScope], (ids, start, end) => supabase.from("payments")
    .select("lease_id, due_date, amount_due, paid_date, paid_amount").in("lease_id", ids)
    .order("id").range(start, end).abortSignal(signal), signal);
  const expenses = [
    ...directExpenses.filter(expense => expense.property_id !== null && propertyScope.has(expense.property_id)),
    ...unitExpenses.filter(expense => expense.property_id === null && expense.unit_id !== null && unitScope.has(expense.unit_id)),
  ];
  return [scopedUnits, loans, expenses, scopedLeases.map(lease => ({ ...lease, tenant: null })), [],
    payments.filter(payment => leaseScope.has(payment.lease_id))] as const;
}

function toProperty(property: Tables<"properties">): Property {
  return {
    id: property.id,
    alias: property.alias ?? property.name ?? property.address,
    address: property.address,
    type: property.type,
    purchase_price: property.purchase_price,
    sale_price: property.purchase_price ?? property.sale_price,
    property_value: property.property_value,
    property_taxes: property.property_taxes,
    insurance: property.insurance,
    mgmt_pct: property.mgmt_pct,
    vacancy_pct: property.vacancy_pct,
    maintenance_pct: property.maintenance_pct,
    rent_growth_rate: property.rent_growth_rate,
    opex_inflation_rate: property.opex_inflation_rate,
  };
}

const emptyPortfolio: { properties: Property[]; leases: LeaseData[]; mortgages: Mortgage[]; statements: Tables<"dealstack_mortgage_statements">[]; record: PortfolioRecord } = {
  properties: [],
  leases: [],
  mortgages: [],
  statements: [],
  record: { units: [], leases: [], loans: [], expenses: [], payments: [] },
};

async function readPortfolio(userId: string, signal: AbortSignal) {
  const returnedProperties = await readAll("properties", (start, end) =>
    supabase.from("properties").select("*").eq("user_id", userId).order("id").range(start, end).abortSignal(signal),
  signal);
  const propertyRows = connectedReview ? returnedProperties.filter(property => property.user_id === userId) : returnedProperties;
  if (propertyRows.length === 0) return emptyPortfolio;
  const properties = propertyRows.map(toProperty);
  const propertyIds = new Set(properties.map(property => property.id));

  const [unitRows, loans, expenses, leaseRows, statements, payments] = connectedReview
    ? await readLegacyRecords([...propertyIds], signal)
    : await Promise.all([
    readAll("units", (start, end) => supabase.from("units").select("id, unit_label, property_id")
      .eq("user_id", userId).order("id").range(start, end).abortSignal(signal), signal),
    readAll("mortgages", (start, end) => supabase.from("mortgages").select("*")
      .eq("user_id", userId).order("id").range(start, end).abortSignal(signal), signal),
    readAll("expenses", (start, end) => supabase.from("expenses").select("property_id, unit_id, date, amount, category")
      .eq("user_id", userId).order("id").range(start, end).abortSignal(signal), signal),
    readAll("leases", (start, end) => supabase.from("leases")
      .select("id, monthly_rent, status, start_date, end_date, deposit, doc_url, tenant:tenants(name), unit_id")
      .eq("user_id", userId).order("id").range(start, end).abortSignal(signal), signal),
    readAll("mortgage statements", (start, end) => supabase.from("dealstack_mortgage_statements").select("*")
      .eq("user_id", userId).order("id").range(start, end).abortSignal(signal), signal),
    readAll("payments", (start, end) => supabase.from("payments").select("lease_id, due_date, amount_due, paid_date, paid_amount")
      .eq("user_id", userId).order("id").range(start, end).abortSignal(signal), signal),
  ]);

  const units = unitRows.filter(unit => propertyIds.has(unit.property_id));
  const unitById = new Map(units.map(unit => [unit.id, unit]));
  const scopedLeases = leaseRows.filter(lease => unitById.has(lease.unit_id));
  const scopedLoans = loans.filter(loan => propertyIds.has(loan.property_id));
  const leases: LeaseData[] = scopedLeases.map(lease => ({
    id: lease.id,
    property_id: unitById.get(lease.unit_id)?.property_id,
    tenant: lease.tenant?.name ?? (connectedReview ? "Lease on record" : "Unknown"),
    monthlyRent: lease.monthly_rent,
    deposit: lease.deposit ?? null,
    documentPath: lease.doc_url ?? null,
    startDate: lease.start_date,
    leaseEnd: lease.end_date,
    status: lease.status,
    unit_id: lease.unit_id,
    unit_label: unitById.get(lease.unit_id)?.unit_label ?? "—",
  }));
  const mortgages: Mortgage[] = scopedLoans.map(loan => ({
    ...loan,
    start_date: loan.start_date ? new Date(loan.start_date) : null,
  }));

  return { properties, leases, mortgages, statements, record: { units, leases: scopedLeases, loans: scopedLoans, expenses, payments, statements } };
}

export function usePortfolio(userId: string) {
  const client = useQueryClient();
  const key = portfolioKey(userId);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => readPortfolio(userId, signal),
    retry: false,
    gcTime: 0,
  });

  const refresh = async () => {
    await client.cancelQueries({ queryKey: key, exact: true });
    await client.invalidateQueries({ queryKey: key, exact: true });
  };

  return { ...query, portfolio: query.data ?? emptyPortfolio, refresh };
}
