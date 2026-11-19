import assert from "node:assert/strict";
import test from "node:test";
import { assumptionsFrom, draftFragment, initialValues, readDraft } from "../src/features/underwriting/draft.ts";
import { kirkwoodExample } from "../src/domain/finance/underwriting.ts";

test("a shared draft URL round-trips complete and incomplete underwriting inputs", () => {
  const values = initialValues(kirkwoodExample);
  assert.deepEqual(assumptionsFrom(readDraft(draftFragment(values))), kirkwoodExample);
  const partial = { ...values, rentMonthly: "", annualRate: "0" };
  assert.deepEqual(readDraft(draftFragment(partial)), partial);
  assert.equal(assumptionsFrom(partial), null);
});

test("hashes without an exact numeric draft are ignored", () => {
  assert.equal(readDraft("#unrelated"), null);
  assert.equal(readDraft("#draft=1,2,3"), null);
  assert.equal(readDraft(draftFragment({ ...initialValues(kirkwoodExample), rentMonthly: "unknown" })), null);
  assert.equal(readDraft(draftFragment({ ...initialValues(kirkwoodExample), rentMonthly: "9".repeat(100) })), null);
});
