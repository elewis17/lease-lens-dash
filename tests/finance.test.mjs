import assert from "node:assert/strict";
import test from "node:test";
import { isActiveLease } from "../src/domain/finance/activeLeases.ts";
import { defaultThresholds } from "../src/domain/finance/thresholds.ts";
import { kirkwoodExample, modelDeal, priceGates, solveIrr } from "../src/domain/finance/underwriting.ts";

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
