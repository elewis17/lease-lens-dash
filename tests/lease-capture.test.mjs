import assert from "node:assert/strict";
import test from "node:test";
import { leaseReviewSchema } from "../src/features/leases/leaseCapture.ts";

const review = {
  propertyId: "fixture-property", tenantName: " Sample Tenant ", unitLabel: " C ",
  startDate: "2026-11-19", endDate: "2027-11-19", monthlyRent: "1450",
  deposit: "0", lateFee: "", graceDays: "5", noticeDays: "",
};

test("confirmation preserves empty optional fields and explicit zero", () => {
  const result = leaseReviewSchema.parse(review);
  assert.equal(result.tenantName, "Sample Tenant");
  assert.equal(result.deposit, 0);
  assert.equal(result.lateFee, null);
  assert.equal(result.noticeDays, null);
  assert.equal(result.graceDays, 5);
});

test("confirmation rejects missing property, invalid dates, negative amounts and fractional days", () => {
  for (const change of [
    { propertyId: "" }, { monthlyRent: "" }, { monthlyRent: "-1" },
    { endDate: "2026-11-18" }, { startDate: "2026-02-30" }, { graceDays: "1.5" },
  ]) assert.equal(leaseReviewSchema.safeParse({ ...review, ...change }).success, false);
});
