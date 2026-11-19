import { isActiveLease } from "./activeLeases.ts";
import { splitLoan, balanceAfter, type LoanInput } from "./debt.ts";
import { MetricsCalculator } from "./MetricsCalculator.ts";
import { operatingExpenses, type ExpenseInput } from "./OpexCalculator.ts";
import { defaultThresholds, type ThresholdPolicy } from "./thresholds.ts";
import { leaseReceipts, type PaymentInput } from "./receipts.ts";
import { portfolioVerdict } from "./verdicts.ts";

type PropertyInput = {
  id: string;
  alias: string;
  type?: string | null;
  property_value?: number | null;
  property_taxes?: number | null;
  insurance?: number | null;
  mgmt_pct?: number | null;
  maintenance_pct?: number | null;
  vacancy_pct?: number | null;
  rent_growth_rate?: number | null;
  opex_inflation_rate?: number | null;
};

export type PortfolioRecord = {
  units: { id: string; property_id: string }[] | null;
  leases: { id: string; unit_id: string; status: string | null; monthly_rent: number; start_date: string | null; end_date: string | null }[] | null;
  loans: LoanInput[] | null;
  expenses: ExpenseInput[] | null;
  payments?: PaymentInput[] | null;
};

export const sumKnown = (values: readonly (number | null)[]): number | null =>
  values.every((value): value is number => value !== null && Number.isFinite(value)) ? values.reduce((total, value) => total + value, 0) : null;

function dateYearBefore(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}

export function modelPortfolio(properties: readonly PropertyInput[], record: PortfolioRecord, asOf: string, marketRatePct: number | null, policy: ThresholdPolicy = defaultThresholds, propertyPolicies: ReadonlyMap<string, ThresholdPolicy> = new Map()) {
  const trailingStart = dateYearBefore(asOf);
  const assets = properties.map(property => {
    const unitIds = record.units === null ? null : new Set(record.units.filter(unit => unit.property_id === property.id).map(unit => unit.id));
    const active = unitIds && record.leases?.filter(lease => unitIds.has(lease.unit_id) && isActiveLease(lease, asOf));
    const occupancy = unitIds && record.leases ? MetricsCalculator.occupancy(record.leases, unitIds, asOf) : null;
    const expectedRent = active?.reduce((sum, lease) => sum + lease.monthly_rent, 0) ?? null;
    const vacancy = property.vacancy_pct;
    const effectiveRent = expectedRent === null ? null : expectedRent === 0 ? 0
      : vacancy == null ? null : expectedRent * (1 - vacancy / 100);
    const loanRows = record.loans?.filter(loan => loan.property_id === property.id);
    const loans = loanRows?.map(loan => splitLoan(loan, asOf)) ?? null;
    const debt = loans ? sumKnown(loans.map(loan => loan.balance)) : null;
    const debtService = loans ? sumKnown(loans.map(loan => loan.principalInterest)) : null;
    const escrow = loans ? sumKnown(loans.map(loan => loan.escrow)) : null;
    const hasEscrow = loanRows?.some(loan => loan.includes_escrow !== false) ?? false;
    const value = property.property_value ?? null;
    const expenses = record.expenses?.filter(expense =>
      (expense.property_id === property.id || (expense.property_id === null && expense.unit_id !== null && unitIds?.has(expense.unit_id))) &&
      trailingStart < expense.date && expense.date <= asOf,
    );
    const expenseLines = expenses ? operatingExpenses(property, expenses, effectiveRent, escrow, hasEscrow) : [];
    // Optional categories remain visible as missing. Core costs are required for a run-rate.
    const required = expenseLines.filter(line => ["tax", "insurance", "pm", "repairs", "escrow"].includes(line.category));
    const opex = required.length && required.every(line => line.amount !== null)
      ? sumKnown(expenseLines.flatMap(line => line.amount === null ? [] : [line.amount])) : null;
    const noi = effectiveRent === null || opex === null ? null : effectiveRent - opex;
    const metrics = MetricsCalculator.summary({ noi, debtService, propertyValue: value, investedCash: null });
    const rateBasis = loans ? sumKnown(loans.map(loan => loan.balance === null ? null : loan.balance * loan.rate * 100)) : null;
    const loanRatePct = debt !== null && debt > 0 && rateBasis !== null ? rateBasis / debt : null;
    const verdict = portfolioVerdict({ ...metrics, debtService, loanRatePct, marketRatePct }, propertyPolicies.get(property.type ?? "") ?? policy);
    return {
      ...metrics, property, value, debt, debtService, escrow, loans, expectedRent, effectiveRent, occupancy,
      loanRatePct, rateBasis, expenseLines, opex, equity: value === null || debt === null ? null : value - debt,
      verdict,
    };
  });

  const aggregate = (get: (asset: (typeof assets)[number]) => number | null) => assets.length ? sumKnown(assets.map(get)) : null;
  const propertyIds = new Set(properties.map(property => property.id));
  const scopedUnits = new Set(record.units?.filter(unit => propertyIds.has(unit.property_id)).map(unit => unit.id));
  const scopedLeases = new Set(record.leases?.filter(lease => scopedUnits.has(lease.unit_id)).map(lease => lease.id));
  const receipts = leaseReceipts(record.payments, scopedLeases, asOf);
  const noi = aggregate(asset => asset.noi);
  const value = aggregate(asset => asset.value);
  const debt = aggregate(asset => asset.debt);
  const debtService = aggregate(asset => asset.debtService);
  const rateBasis = aggregate(asset => asset.rateBasis);
  const loanRatePct = debt !== null && debt > 0 && rateBasis !== null ? rateBasis / debt : null;
  const metrics = MetricsCalculator.summary({ noi, debtService, propertyValue: value, investedCash: null });
  const totalUnits = aggregate(asset => asset.occupancy?.totalUnits ?? null);
  const occupiedUnits = aggregate(asset => asset.occupancy?.occupiedUnits ?? null);
  const loans = assets.every(asset => asset.loans !== null) ? assets.flatMap(asset => asset.loans ?? []) : null;
  const nextBalance = loans !== null ? sumKnown(loans.map(loan => balanceAfter(loan, 12))) : null;
  return {
    ...metrics, ...receipts, assets, value, debt, debtService, loans, loanRatePct,
    annualizedCashFlow: metrics.cashFlow === null ? null : Math.round(metrics.cashFlow) * 12,
    equity: value === null || debt === null ? null : value - debt,
    ltv: value !== null && value > 0 && debt !== null ? debt / value : null,
    expectedRent: aggregate(asset => asset.expectedRent),
    effectiveRent: aggregate(asset => asset.effectiveRent),
    opex: aggregate(asset => asset.opex),
    totalUnits, occupiedUnits,
    physicalOccupancy: totalUnits !== null && totalUnits > 0 && occupiedUnits !== null ? occupiedUnits / totalUnits : null,
    paydown: assets.length && debt !== null && nextBalance !== null ? debt - nextBalance : null,
    verdict: portfolioVerdict({ ...metrics, debtService, loanRatePct, marketRatePct }, policy),
  };
}

export type PortfolioMetrics = ReturnType<typeof modelPortfolio>;
// The property metrics are inferred from the shared calculation.
export type AssetMetrics = PortfolioMetrics["assets"][number];
