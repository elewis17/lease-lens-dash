import assert from "node:assert/strict";
import test from "node:test";
import { manualLeaseForm, mortgageEscrowChange, mortgageForm, propertyForm } from "../src/features/portfolio/recordValidation.ts";

test("blank property assumptions remain null and explicit zero remains zero", () => {
  const result = propertyForm.parse({ alias: " Sample ", address: " Test street ", sale_price: "", vacancy_pct: 0 });
  assert.equal(result.alias, "Sample");
  assert.equal(result.sale_price, null);
  assert.equal(result.vacancy_pct, 0);
  assert.equal(result.maintenance_pct, null);
  assert.equal(propertyForm.safeParse({ ...result, address: " " }).success, false);
  assert.equal(propertyForm.safeParse({ ...result, property_value: -100 }).success, false);
  assert.equal(propertyForm.safeParse({ ...result, mgmt_pct: 200 }).success, false);
});

test("mortgage terms require explicit values and accept zero rate with an unknown balance", () => {
  const loan = {
    property_id: "sample", principal_original: "200000", current_balance: "", interest_rate: "0",
    term_months: "360", start_date: "2026-11-19", monthly_payment: "850", includes_escrow: true,
  };
  const valid = mortgageForm.parse(loan);
  assert.equal(valid.current_balance, null);
  assert.equal(valid.interest_rate, 0);
  assert.equal(valid.includes_escrow, true);
  for (const invalid of [
    { principal_original: "" }, { current_balance: -1 }, { interest_rate: "" },
    { term_months: "30.5" }, { term_months: "" }, { start_date: "2026-02-30" }, { monthly_payment: "" },
  ]) assert.equal(mortgageForm.safeParse({ ...loan, ...invalid }).success, false);
  assert.equal(mortgageEscrowChange.safeParse({ includes_escrow: false, monthly_payment: -1 }).success, false);
});

test("manual leases preserve an unknown deposit and reject impossible dates and rent", () => {
  const lease = {
    property_id: "sample", tenant: "Sample", unit_label: "1", startDate: "2026-11-19", leaseEnd: "2027-11-19",
    monthlyRent: "0", deposit: "", status: null,
  };
  const valid = manualLeaseForm.parse(lease);
  assert.equal(valid.deposit, null);
  assert.equal(valid.monthlyRent, 0);
  assert.equal(valid.status, null);
  for (const invalid of [
    { unit_label: "" }, { monthlyRent: "" }, { monthlyRent: "-1" }, { leaseEnd: "2026-11-18" }, { deposit: -10 },
  ]) assert.equal(manualLeaseForm.safeParse({ ...lease, ...invalid }).success, false);
});
