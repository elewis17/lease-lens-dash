import assert from "node:assert/strict";
import test from "node:test";
import { capitalBudget, capitalConflicts, capitalOpportunities, combinedCapitalPlan, netSaleProceeds, rankCapitalOpportunities, recommendCapital } from "../src/domain/finance/capital.ts";
import { leaseReceipts } from "../src/domain/finance/receipts.ts";
import { isActiveLease } from "../src/domain/finance/activeLeases.ts";
import { defaultThresholds } from "../src/domain/finance/thresholds.ts";
import { breakEvenInputs, kirkwoodExample, modelDeal, priceGates, solveIrr } from "../src/domain/finance/underwriting.ts";

test("Kirkwood reproduces the deck examples and preserves whole-dollar gate boundaries", () => {
  const deal = modelDeal(kirkwoodExample);
  const gates = priceGates(kirkwoodExample);
  assert.equal(deal.dscr.toFixed(2), "1.11");
  assert.equal((deal.irr * 100).toFixed(1), "11.5");
  assert.equal(Math.round(deal.cashFlow), 388);
  assert.equal(gates.verdict, "Do not pursue");
  assert.equal(gates.maxOffer, 639738);
  assert.equal(gates.walkAway, 695368);
  assert.equal(Math.round(gates.maxOffer / 1000) * 1000, 640000);
  assert.equal(Math.round(gates.walkAway / 1000) * 1000, 695000);
  assert.equal(priceGates({ ...kirkwoodExample, price: gates.maxOffer }).verdict, "Buy");
  assert.equal(priceGates({ ...kirkwoodExample, price: gates.maxOffer + 1 }).verdict, "Verify mitigations");
  assert.equal(priceGates({ ...kirkwoodExample, price: gates.walkAway + 1 }).verdict, "Do not pursue");
});

test("the offer falls when the IRR gate binds instead of DSCR", () => {
  const buy = { ...defaultThresholds.buy, minimumIrr: 0.2 };
  const { maxOffer } = priceGates(kirkwoodExample, buy);
  assert.ok(maxOffer < priceGates(kirkwoodExample).maxOffer);
  const atOffer = modelDeal({ ...kirkwoodExample, price: maxOffer });
  assert.ok(atOffer.dscr >= buy.minimumDscr && atOffer.irr >= buy.minimumIrr);
  assert.ok(modelDeal({ ...kirkwoodExample, price: maxOffer + 1 }).irr < buy.minimumIrr);
});

test("scenario assumptions change cash flow, DSCR, IRR and offer price", () => {
  const base = modelDeal(kirkwoodExample);
  const initialMax = priceGates(kirkwoodExample).maxOffer;
  const shocks = [
    { rentMonthly: kirkwoodExample.rentMonthly - 200 },
    { annualRate: kirkwoodExample.annualRate + 0.005 },
    { opexMonthly: kirkwoodExample.opexMonthly * 1.15 },
  ];

  for (const shock of shocks) {
    const assumptions = { ...kirkwoodExample, ...shock };
    const scenario = modelDeal(assumptions);
    assert.ok(scenario.cashFlow < base.cashFlow);
    assert.ok(scenario.dscr < base.dscr);
    assert.ok(scenario.irr < base.irr);
    assert.ok(priceGates(assumptions).maxOffer < initialMax);
  }
});

test("IRR solves a cash-flow series and missing denominators remain missing", () => {
  assert.ok(Math.abs(solveIrr([-100, 110]) - 0.1) < 1e-12);
  assert.equal(solveIrr([-100, 230, -132]), null);
  assert.equal(modelDeal({ ...kirkwoodExample, price: Number.NaN }), null);
  assert.equal(modelDeal({ ...kirkwoodExample, downPayment: 1 }).dscr, null);
  const zeroRate = { ...kirkwoodExample, annualRate: 0 };
  assert.equal(modelDeal(zeroRate).monthlyDebt, 1500);
  assert.equal(modelDeal({ ...zeroRate, downPayment: 0, closingCost: 0 }).cashYield, null);
});

test("active and expiring lease dates are inclusive and stale status cannot add rent", () => {
  const lease = { status: "active", start_date: "2026-10-01", end_date: "2026-11-18" };
  assert.equal(isActiveLease(lease, "2026-11-18"), true);
  assert.equal(isActiveLease(lease, "2026-11-19"), false);
  assert.equal(isActiveLease(lease, "2026-09-30"), false);
  assert.equal(isActiveLease({ ...lease, status: "expiring" }, "2026-11-18"), true);
  assert.equal(isActiveLease({ ...lease, status: "expired" }, "2026-11-18"), false);
  assert.equal(isActiveLease({ ...lease, status: "vacant" }, "2026-11-18"), false);
  assert.equal(isActiveLease({ ...lease, start_date: null }, "2026-11-18"), false);
});

import { modelPortfolio } from "../src/domain/finance/portfolio.ts";
import { MetricsCalculator } from "../src/domain/finance/MetricsCalculator.ts";
import { splitLoan } from "../src/domain/finance/debt.ts";
import { projectNextYearWealth, projectPortfolio, refinance } from "../src/domain/finance/scenarios.ts";
import { portfolioVerdict } from "../src/domain/finance/verdicts.ts";
import { illustrativePortfolio } from "./fixtures/portfolio.mjs";

const reviewDate = "2026-11-19";

test("portfolio matches the deck's illustrative waterfall, coverage, occupancy, and equity", () => {
  const record = illustrativePortfolio(reviewDate);
  const metrics = modelPortfolio(record.properties, record, reviewDate, 6.25);
  assert.equal(metrics.expectedRent, 21500);
  assert.equal(metrics.expectedRent - metrics.effectiveRent, 1303);
  assert.equal(metrics.opex, 5780);
  assert.equal(Math.round(metrics.debtService), 9649);
  assert.equal(Math.round(metrics.cashFlow), 4768);
  assert.equal(metrics.dscr.toFixed(2), "1.49");
  assert.deepEqual(metrics.assets.map(asset => asset.dscr.toFixed(2)), ["1.65", "1.81", "1.60", "1.32", "0.82"]);
  assert.equal(metrics.assets[4].verdict.label, "Distress");
  assert.equal(metrics.equity, 711000);
  assert.equal(metrics.debt, 1400000);
  assert.equal((metrics.ltv * 100).toFixed(1), "66.3");
  assert.equal(Math.round(metrics.paydown), 24342);
  assert.equal(metrics.totalUnits, 11);
  assert.equal(metrics.occupiedUnits, 10);
  assert.equal(metrics.annualizedCashFlow, 57216);
  assert.equal(metrics.receipts, 20197);
  assert.equal((100 * metrics.economicOccupancy).toFixed(1), "93.9");
  assert.equal((100 * metrics.physicalOccupancy).toFixed(1), "90.9");
  assert.equal(metrics.arrears, 1303);
  const wealth = projectNextYearWealth(metrics, 3);
  assert.equal(wealth.appreciation, 63330);
  assert.equal(Math.round(wealth.growth), 144888);
  assert.equal(projectNextYearWealth(metrics, null).growth, null);
});

test("post-debt cash flow drives ROI and cash-on-cash, and absent denominators stay missing", () => {
  const basis = { noi: 2000, debtService: 1500, propertyValue: 300000, investedCash: 100000 };
  const result = MetricsCalculator.summary(basis);
  assert.equal(result.cashFlow, 500);
  assert.equal(result.roi, 0.02);
  assert.equal(result.cashOnCash, 0.06);
  assert.equal(result.capRate, 0.08);
  assert.equal(MetricsCalculator.summary({ ...basis, investedCash: null }).cashOnCash, null);
  assert.equal(MetricsCalculator.summary({ ...basis, debtService: null }).cashFlow, null);
  assert.equal(MetricsCalculator.dscr(2000, 0), null);
});

test("escrowed, seasoned mortgage separates principal and interest once and never produces negative escrow", () => {
  const loan = {
    id: "loan", property_id: "property", current_balance: 24000, interest_rate: 0,
    term_months: 36, start_date: "2025-11-19", monthly_payment: 1250, includes_escrow: true,
  };
  const split = splitLoan(loan, reviewDate);
  assert.equal(split.remaining, 24);
  assert.equal(split.principalInterest, 1000);
  assert.equal(split.escrow, 250);
  assert.equal(splitLoan({ ...loan, monthly_payment: 900 }, reviewDate).escrow, 0);
  const property = { id: "property", alias: "One property", vacancy_pct: 0, mgmt_pct: 0, maintenance_pct: 0, property_taxes: 9000, insurance: 1800, property_value: 84000 };
  const record = {
    loans: [loan], expenses: [{ property_id: "property", unit_id: null, date: reviewDate, amount: 3000, category: "tax" }],
    units: [{ id: "unit", property_id: "property" }],
    leases: [{ id: "lease", unit_id: "unit", monthly_rent: 1750, start_date: "2026-01-01", end_date: "2026-12-31", status: "active" }],
  };
  const metrics = modelPortfolio([property], record, reviewDate, null);
  assert.equal(metrics.opex, 250);
  assert.equal(metrics.noi, 1500);
  assert.equal(metrics.dscr, 1.5);
  assert.equal(metrics.cashFlow, 500);
  assert.equal(metrics.equity, 60000);
  const refi = refinance(metrics, 0, 24, 2);
  assert.equal(refi.escrow, 250);
  assert.equal(refi.annualRunRateImpact, 0);
  assert.equal(refi.firstYearNet, -480);
});

test("recorded unit expenses replace estimates in NOI and capital costs are separate", () => {
  const record = illustrativePortfolio(reviewDate);
  const property = { ...record.properties[0], maintenance_pct: 10 };
  const base = modelPortfolio([property], record, reviewDate, null);
  const changed = modelPortfolio([property], { ...record, expenses: [
    ...record.expenses,
    { property_id: null, unit_id: record.units[0].id, date: reviewDate, amount: 1200, category: "repairs" },
    { property_id: property.id, unit_id: null, date: reviewDate, amount: 3000, category: "capex" },
    { property_id: property.id, unit_id: null, date: "2025-11-18", amount: 350, category: "utilities" },
  ] }, reviewDate, null);
  assert.equal(base.assets[0].expenseLines.find(line => line.category === "repairs").basis, "Estimate");
  assert.equal(changed.assets[0].expenseLines.find(line => line.category === "repairs").basis, "Recorded");
  assert.equal(changed.assets[0].expenseLines.find(line => line.category === "utilities").basis, "Missing");
  assert.ok(Math.abs(changed.noi - (base.noi + 4300 * 0.96 * 0.10 - 100)) < 1e-9);
});

test("missing value, balances, debt service, and property coverage cannot become synthetic values", () => {
  const record = illustrativePortfolio(reviewDate);
  const [property] = record.properties;
  const unknown = modelPortfolio([property], { ...record, loans: [{ ...record.loans[0], current_balance: null }] }, reviewDate, null);
  assert.equal(unknown.debt, null);
  assert.equal(unknown.equity, null);
  assert.equal(unknown.cashOnCash, null);
  const noDebt = modelPortfolio([property], { ...record, loans: [] }, reviewDate, null);
  assert.equal(noDebt.dscr, null);
  assert.equal(noDebt.debtService, 0);
  assert.equal(noDebt.verdict.label, "No debt service");
  const empty = modelPortfolio([], record, reviewDate, null);
  assert.equal(empty.cashFlow, null);
  assert.equal(empty.debt, null);
  assert.equal(empty.equity, null);
});

test("policy changes propagate to the same property, single-property aggregate, and scenario", () => {
  const record = illustrativePortfolio(reviewDate);
  const selected = [record.properties[2]];
  const base = modelPortfolio(selected, record, reviewDate, 6.25);
  assert.equal(base.verdict.label, "Refinance candidate");
  assert.equal(base.assets[0].verdict.label, base.verdict.label);
  const policy = { ...defaultThresholds, refinance: { ...defaultThresholds.refinance, rateSpreadPercentagePoints: 2 } };
  const reclassified = modelPortfolio(selected, record, reviewDate, 6.25, policy);
  assert.equal(reclassified.verdict.label, "Hold");
  assert.equal(reclassified.assets[0].verdict.label, "Hold");
  assert.equal(portfolioVerdict({ cashFlow: -1, dscr: 0.9, debtService: 200, loanRatePct: null, marketRatePct: null, distressQuarters: 2 }).label, "Sell candidate");
  assert.equal(portfolioVerdict({ cashFlow: 10, dscr: 1.04, debtService: 200, loanRatePct: null, marketRatePct: null, credibleFix: false }).label, "Sell candidate");
});

test("projections use stated growth, scheduled payoffs, and nullable valuation", () => {
  const record = illustrativePortfolio(reviewDate);
  const property = { ...record.properties[0], rent_growth_rate: 4, opex_inflation_rate: 5 };
  const loan = { ...record.loans[0], current_balance: 12000, interest_rate: 0, term_months: 36, start_date: "2023-11-19", monthly_payment: 1000 };
  const shortened = { ...loan, start_date: "2024-11-19" };
  const metrics = modelPortfolio([property], { ...record, loans: [shortened] }, reviewDate, null);
  const [first, second] = projectPortfolio(metrics);
  assert.equal(first.debtBalance, 12000);
  assert.equal(second.debtBalance, 0);
  assert.equal(first.revenue * 1.04, second.revenue);
  assert.equal(second.totalExpenses, metrics.opex * 12 * 1.05);
  const missingGrowth = modelPortfolio([{ ...property, rent_growth_rate: null }], record, reviewDate, null);
  assert.equal(projectPortfolio(missingGrowth)[0].equity, null);
});

test("refinance uses all balances and shows net first-year cash after closing costs", () => {
  const record = illustrativePortfolio(reviewDate);
  const metrics = modelPortfolio(record.properties, record, reviewDate, 6.25);
  const refi = refinance(metrics, 6.25, 360, 2);
  assert.equal(refi.closingCosts, 28000);
  assert.equal(Math.round(refi.firstYearNet), Math.round(refi.annualRunRateImpact - 28000));
});

test("Capital ranks refinance scenarios by separate cash, net worth, and coverage objectives", () => {
  const record = illustrativePortfolio(reviewDate);
  const { assets } = modelPortfolio(record.properties, record, reviewDate, 5);
  const actionRows = capitalOpportunities(assets, { rate: "5", years: "25", cost: "2" });
  const first = objective => rankCapitalOpportunities(actionRows, objective)[0].title;
  assert.equal(first("cash"), "Refinance North Ave Fourplex");
  assert.equal(first("wealth"), "Refinance Monroe Duplex");
  assert.equal(first("risk"), "Refinance Ponce Cottage");
  const ponce = actionRows.find(row => row.title === "Refinance Ponce Cottage").refinance;
  assert.equal(ponce.closingCosts, 3900);
  assert.equal(Math.round(ponce.firstYearNet), -189);
  assert.equal(Math.round(ponce.cash), 33212);
  assert.equal(Math.round(ponce.wealth), 40403);
  assert.equal(ponce.risk.toFixed(2), "0.43");
  assert.equal(actionRows.find(row => row.action === "vacancy").refinance, null);
  assert.equal(actionRows.find(row => row.action === "sale").refinance, null);
});

test("Capital preserves missing refinance costs and treats zero-cost cash yield as undefined", () => {
  const record = illustrativePortfolio(reviewDate);
  const { assets } = modelPortfolio(record.properties, record, reviewDate, 6.25);
  const missing = capitalOpportunities(assets, { rate: "6.25", years: "30", cost: " " });
  assert.equal(missing.find(row => row.action === "refinance").refinance, null);
  const noCost = capitalOpportunities(assets, { rate: "6.25", years: "30", cost: "0" });
  assert.equal(noCost.find(row => row.action === "refinance").refinance.cashYield, null);
});


test("underwriting break-evens clear both gates at the displayed precision", () => {
  const { rent, annualRate } = breakEvenInputs(kirkwoodExample);
  assert.equal(rent, 5714);
  assert.equal(annualRate, 0.0563);
  for (const input of [{ rentMonthly: rent }, { annualRate }]) {
    assert.equal(priceGates({ ...kirkwoodExample, ...input }).verdict, "Buy");
  }
  assert.notEqual(priceGates({ ...kirkwoodExample, rentMonthly: rent - 1 }).verdict, "Buy");
  assert.notEqual(priceGates({ ...kirkwoodExample, annualRate: 0.0564 }).verdict, "Buy");
});

test("Capital combines rent and refinance timing without spending the reserve or counting sale proceeds early", () => {
  const record = illustrativePortfolio(reviewDate);
  const metrics = modelPortfolio(record.properties, record, reviewDate, 6.25);
  const glen = metrics.assets.find(asset => asset.property.alias === "Glen Iris Triplex");
  const monroe = metrics.assets.find(asset => asset.property.alias === "Monroe Duplex");
  const rentPlans = {
    [glen.property.id + ":vacancy"]: { rent: "375", expenses: "50", cost: "5000", start: "2" },
    [monroe.property.id + ":rent"]: { rent: "360", expenses: "14.40", cost: "0", start: "1" },
  };
  const opportunities = capitalOpportunities(metrics.assets, { rate: "6.25", years: "24", cost: "2" }, rentPlans);
  const budget = capitalBudget("26000", "15000");
  const selected = recommendCapital(opportunities, "cash", budget);
  assert.equal(selected.length, 3);
  const plan = combinedCapitalPlan(selected, 2, metrics);
  const individual = selected.map(action => combinedCapitalPlan([action], 2, metrics));
  assert.equal(Math.round(plan.runRate), Math.round(individual.reduce((sum, result) => sum + result.runRate, 0)));
  assert.equal(Math.round(plan.firstYear), Math.round(individual.reduce((sum, result) => sum + result.firstYear, 0)));
  assert.ok(plan.costs <= budget);
  assert.ok(plan.dscr > metrics.dscr);
  assert.equal(netSaleProceeds("271000", "16260", "210000"), 44740);
  const refinance = selected.find(action => action.action === "refinance");
  const conflict = [refinance, { ...refinance, action: "sale", refinance: null }];
  assert.ok(capitalConflicts(conflict)[0].startsWith("Conflict"));
  assert.equal(combinedCapitalPlan(conflict, 2, metrics), null);
});


test("recorded receipts are reported separately from contractual amounts due and a blank payment amount is not zero", () => {
  const backRent = { lease_id: "owner-lease", due_date: "2026-09-01", paid_date: "2026-10-04", paid_amount: 500, amount_due: 500 };
  const ids = new Set(["owner-lease"]);
  const latePayment = leaseReceipts([backRent], ids, "2026-11-06");
  assert.equal(latePayment.receipts, 500);
  assert.equal(latePayment.rentDue, null);
  assert.equal(latePayment.economicOccupancy, null);
  assert.equal(leaseReceipts([{ ...backRent, paid_amount: null }], ids, "2026-11-06").receipts, null);
  assert.equal(leaseReceipts([{ ...backRent, due_date: "2026-10-01", paid_date: null, paid_amount: null }], ids, "2026-11-06").receipts, 0);
});
