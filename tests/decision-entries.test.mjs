import test from "node:test";
import assert from "node:assert/strict";
import { kirkwoodExample } from "../src/domain/finance/underwriting.ts";
import { strategyPresets } from "../src/domain/finance/thresholds.ts";
import { currentDeals, currentPolicies, decisionExportSchema, exportDecision, freezeAcquisition, modelComparison } from "../src/features/decisions/entries.ts";

test("saved pipeline assumptions drive reusable gates and the offer freezes its confirmed price and policy", () => {
  const dealId = "00000000-0000-4000-8000-000000000003";
  const entry = { kind: "pipeline", dealId, title: "Kirkwood", assumptions: kirkwoodExample };
  const frozen = freezeAcquisition(entry, "offer", "Pending rent verification");
  assert.equal(frozen.price, modelComparison(kirkwoodExample).price);
  assert.equal(frozen.price, 639738);
  assert.equal(frozen.projection.verdict, "Buy");
  assert.ok(modelComparison(kirkwoodExample, strategyPresets.Income).price < frozen.price);
  const revised = { ...entry, assumptions: { ...entry.assumptions, rentMonthly: 6000 } };
  assert.equal(currentDeals([{ payload: revised }, { payload: entry }])[0].payload.assumptions.rentMonthly, 6000);
  assert.equal(frozen.assumptions.rentMonthly, 5200);
});

test("an approved policy is visible by type, and the structured decision round-trips", () => {
  const policy = { kind: "policy", title: "Threshold policy", target: "Multi-Family", strategy: "Income", policy: strategyPresets.Income, reason: "Coverage requirement" };
  const entry = { id: "00000000-0000-4000-8000-000000000004", created_at: "2026-11-19T13:00:00.000Z", payload: policy };
  const exported = exportDecision(entry, [entry]);
  assert.deepEqual(decisionExportSchema.parse(JSON.parse(JSON.stringify(exported))), exported);
  assert.equal(currentPolicies([entry]).get("Multi-Family").policy.buy.minimumDscr, 1.35);
});
