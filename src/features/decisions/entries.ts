import { z } from "zod";
import { defaultThresholds, propertyTypes, type ThresholdPolicy } from "../../domain/finance/thresholds.ts";
import { modelDeal, priceGates, type DealAssumptions } from "../../domain/finance/underwriting.ts";

const amount = z.number().finite();
const evidenceLink = z.string().url().max(2000).refine(value => value.startsWith("https://")).optional();
const assumptionSchema = z.object({
  price: amount, rentMonthly: amount, opexMonthly: amount, vacancyRate: amount,
  annualRentGrowth: amount, annualExpenseGrowth: amount, downPayment: amount, annualRate: amount,
  termMonths: amount, closingCost: amount, holdYears: amount, exitCap: amount, saleCost: amount,
}).refine(assumptions => modelDeal(assumptions) !== null);
const base = { dealId: z.string().uuid(), title: z.string().trim().min(1).max(120), assumptions: assumptionSchema, propertyType: z.enum(propertyTypes).optional() };
const projection = z.object({
  dscr: amount.nullable(), irr: amount.nullable(), cashFlow: amount, maxOffer: amount.nullable(),
  walkAway: amount.nullable(), verdict: z.string(),
  buyDscr: amount, buyIrr: amount, lenderDscr: amount,
});
const acquisition = z.object({
  ...base,
  kind: z.literal("acquisition"),
  action: z.enum(["offer", "pass"]),
  reason: z.string().trim().min(1).max(2000), evidenceUrl: evidenceLink,
  price: amount.positive(),
  projection,
});
const capitalProjection = z.object({
  paydownInputs: z.object({
    loanId: z.string(), amount: z.string(), fee: z.string(), startingBalance: amount, annualRate: amount,
    monthsSaved: amount, lifetimeInterestSaved: amount,
  }).optional(),
  saleInputs: z.object({ price: z.string(), costs: z.string(), payoff: z.string(), date: z.string(), netProceeds: amount }).optional(),
  rentInputs: z.object({ rent: z.string(), expenses: z.string(), cost: z.string(), start: z.string() }).optional(),
  quote: z.object({ rate: z.string(), years: z.string(), cost: z.string() }),
  annualCashChange: amount.nullable(), initialCost: amount.nullable(), tenYearCashChange: amount.nullable(),
  tenYearWealthChange: amount.nullable(), coverageChange: amount.nullable(),
});
const capital = z.object({
  kind: z.literal("capital"), opportunityId: z.string().min(1).max(180), propertyId: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(180), status: z.enum(["investigating", "decided", "executing", "completed"]),
  notes: z.string().trim().min(1).max(2000), evidenceUrl: evidenceLink, projection: capitalProjection,
  actualAnnualCashChange: amount.nullable(),
});
export type CapitalEntry = z.infer<typeof capital>;

export const thresholdPolicySchema = z.object({
  hold: z.object({ minimumDscr: amount.positive(), cashFlowAbove: amount }),
  distress: z.object({ dscrBelow: amount.positive(), cashFlowBelow: amount }),
  sell: z.object({ distressQuarters: amount.int().positive(), dscrBelowWithoutCredibleFix: amount.positive() }),
  refinance: z.object({ minimumDscr: amount.positive(), rateSpreadPercentagePoints: amount.nonnegative(), cashFlowAbove: amount }),
  buy: z.object({ minimumDscr: amount.positive(), minimumIrr: amount }),
  lender: z.object({ minimumDscr: amount.positive() }),
});
const policyEntry = z.object({
  kind: z.literal("policy"), title: z.string(), strategy: z.enum(["Growth", "Balanced", "Income"]),
  target: z.enum(["Portfolio", ...propertyTypes]), policy: thresholdPolicySchema,
  reason: z.string().trim().min(1).max(2000),
});
export const entrySchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("pipeline") }),
  acquisition,
  capital,
  policyEntry,
]).refine(value => value.kind !== "capital" ||
  (value.status === "completed" ? value.actualAnnualCashChange !== null : value.actualAnnualCashChange === null));
export type EntryPayload = z.infer<typeof entrySchema>;
export const workspaceEntrySchema = z.object({ id: z.string().uuid(), created_at: z.string().datetime({ offset: true }), payload: entrySchema });
export type Entry = { id: string; created_at: string; payload: EntryPayload };

export function freezeAcquisition(deal: Extract<EntryPayload, { kind: "pipeline" }>,
  action: "offer" | "pass", reason: string, policy: ThresholdPolicy = defaultThresholds, evidenceUrl?: string) {
  const gates = priceGates(deal.assumptions, policy.buy, policy.lender);
  const price = action === "offer" && gates.verdict !== "Buy" ? gates.maxOffer : deal.assumptions.price;
  if (price === null || (action === "offer" && (gates.walkAway === null || price > gates.walkAway))) return null;
  const model = modelDeal({ ...deal.assumptions, price });
  if (!model) return null;
  const results = acquisition.safeParse({
    ...deal, kind: "acquisition", action, reason, evidenceUrl, price,
    projection: {
      dscr: model.dscr, irr: model.irr, cashFlow: model.cashFlow, maxOffer: gates.maxOffer, walkAway: gates.walkAway,
      verdict: priceGates({ ...deal.assumptions, price }, policy.buy, policy.lender).verdict,
      buyDscr: policy.buy.minimumDscr, buyIrr: policy.buy.minimumIrr,
      lenderDscr: policy.lender.minimumDscr,
    },
  });
  return results.success ? results.data : null;
}

export function currentDeals(entries: Entry[]) {
  const result = new Map<string, Entry & { payload: Extract<EntryPayload, { kind: "pipeline" }> }>();
  for (const entry of entries) {
    const { payload } = entry;
    if (payload.kind === "pipeline" && !result.has(payload.dealId)) result.set(payload.dealId, { ...entry, payload });
  }
  return [...result.values()];
}

export function modelComparison(assumptions: DealAssumptions, policy: ThresholdPolicy = defaultThresholds) {
  const asking = modelDeal(assumptions);
  const gates = priceGates(assumptions, policy.buy, policy.lender);
  const price = gates.verdict === "Buy" ? assumptions.price : gates.maxOffer;
  const modeled = price === null ? null : modelDeal({ ...assumptions, price });
  return { asking, gates, price, modeled };
}


export const lifecycle = ["identified", "investigating", "decided", "executing", "completed"] as const;

export function capitalHistory(entries: Entry[], opportunityId: string) {
  return entries.flatMap(entry => entry.payload.kind === "capital" && entry.payload.opportunityId === opportunityId
    ? [{ ...entry, payload: entry.payload }] : []);
}


export const decisionExportSchema = z.object({
  formatVersion: z.literal(1), decision: workspaceEntrySchema, events: z.array(workspaceEntrySchema),
});

export function exportDecision(entry: Entry, entries: Entry[]) {
  const events = entry.payload.kind === "capital" ? capitalHistory(entries, entry.payload.opportunityId) : [];
  return { formatVersion: 1 as const, decision: entry, events };
}

export function currentPolicies(entries: Entry[]) {
  const policies = new Map<string, Extract<EntryPayload, { kind: "policy" }>>();
  for (const { payload } of entries) {
    if (payload.kind === "policy" && !policies.has(payload.target)) policies.set(payload.target, payload);
  }
  return policies;
}
