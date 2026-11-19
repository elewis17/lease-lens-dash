import { monthlyPayment } from "../../src/domain/finance/underwriting.ts";

export function illustrativePortfolio(asOf = "2026-11-19") {
  const portfolio = [
    ["Monroe Duplex", 2, 2, 4300, 4, 1150, 265000, 6.75, 26, 410000],
    ["North Ave Fourplex", 4, 4, 7400, 4, 1950, 420000, 5.90, 22, 640000],
    ["Ponce Cottage", 1, 1, 3200, 5, 720, 195000, 7.40, 24, 310000],
    ["Glen Iris Triplex", 3, 2, 4650, 12, 1320, 310000, 6.50, 25, 480000],
    ["Oak Grove SFR", 1, 1, 1950, 6, 640, 210000, 7.10, 27, 271000],
  ];
  const records = { properties: [], units: [], leases: [], mortgages: [], expenses: [], payments: [] };
  const priorMonth = new Date(`${asOf.slice(0, 7)}-01T00:00:00Z`);
  priorMonth.setUTCMonth(priorMonth.getUTCMonth() - 1);
  const paymentDate = priorMonth.toISOString().slice(0, 10);
  for (const [index, [alias, units, occupied, rent, vacancy, opex, balance, rate, remaining, value]] of portfolio.entries()) {
    const propertyId = `illustrative-property-${index + 1}`;
    records.properties.push({
      id: propertyId, name: alias, alias, address: "Illustrative record", property_value: value,
      type: units > 1 ? "Multi-Family" : "Single-Family", vacancy_pct: vacancy,
      rent_growth_rate: 2.5, opex_inflation_rate: 2, mgmt_pct: 0, maintenance_pct: 0,
    });
    for (let i = 0; i < units; i++) {
      const unitId = `${propertyId}-unit-${i + 1}`;
      records.units.push({ id: unitId, property_id: propertyId, unit_label: `Unit ${i + 1}` });
      if (i < occupied) {
        const unitRent = i === occupied - 1 ? rent - Math.floor(rent / occupied) * (occupied - 1) : Math.floor(rent / occupied);
        records.leases.push({
          id: `${unitId}-lease`, unit_id: unitId, property_id: propertyId,
          monthly_rent: unitRent,
          status: "active", start_date: `${asOf.slice(0, 4)}-01-01`, end_date: `${Number(asOf.slice(0, 4)) + 1}-12-31`,
          tenant: { name: `Sample tenant ${i + 1}` },
        });
        records.payments.push({
          lease_id: `${unitId}-lease`, due_date: paymentDate, paid_date: paymentDate,
          amount_due: unitRent, paid_amount: unitRent * (1 - vacancy / 100),
        });
      }
    }
    const start = `${Number(asOf.slice(0, 4)) - (30 - remaining)}${asOf.slice(4)}`;
    records.mortgages.push({
      id: `${propertyId}-loan`, property_id: propertyId, loan_name: "Illustrative fixed-rate loan",
      principal: null, principal_original: null, current_balance: balance,
      term_months: 360, interest_rate: rate, start_date: start,
      monthly_payment: monthlyPayment(balance, rate / 100, remaining * 12),
      includes_escrow: false,
    });
    // The deck supplies only aggregate operating costs. Record them without inventing a detailed split.
    records.properties.at(-1).property_taxes = 0;
    records.properties.at(-1).insurance = 0;
    records.expenses.push({ property_id: propertyId, unit_id: null, date: asOf, amount: opex * 12, category: "other" });
  }
  return { ...records, loans: records.mortgages };
}
