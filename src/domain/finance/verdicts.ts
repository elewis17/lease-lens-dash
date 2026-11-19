import { defaultThresholds, type ThresholdPolicy } from "./thresholds.ts";

export function portfolioVerdict(input: {
  cashFlow: number | null;
  dscr: number | null;
  debtService: number | null;
  loanRatePct: number | null;
  marketRatePct: number | null;
  distressQuarters?: number;
  credibleFix?: boolean;
}, policy: ThresholdPolicy = defaultThresholds) {
  const { cashFlow, dscr, debtService, loanRatePct, marketRatePct, distressQuarters, credibleFix } = input;
  if (cashFlow === null || debtService === null) return { label: "Insufficient data", detail: "Verify rent, operating expenses, and debt service." };
  if (debtService === 0) return { label: "No debt service", detail: "There is no scheduled debt service for a coverage ratio." };
  if (dscr === null) return { label: "Insufficient data", detail: "Verify net operating income and debt service." };
  if ((distressQuarters != null && distressQuarters >= policy.sell.distressQuarters) ||
      (dscr < policy.sell.dscrBelowWithoutCredibleFix && credibleFix === false)) {
    return { label: "Sell candidate", detail: "Review documented distress and the feasibility of a fix." };
  }
  if (cashFlow < policy.distress.cashFlowBelow && dscr < policy.distress.dscrBelow) {
    return { label: "Distress", detail: "Negative cash flow and debt coverage below the distress threshold." };
  }
  if (dscr >= policy.refinance.minimumDscr && cashFlow > policy.refinance.cashFlowAbove &&
      loanRatePct !== null && marketRatePct !== null && loanRatePct >= marketRatePct + policy.refinance.rateSpreadPercentagePoints) {
    return { label: "Refinance candidate", detail: "Coverage, cash flow, and the rate spread qualify for a quote and cost review." };
  }
  if (dscr >= policy.hold.minimumDscr && cashFlow > policy.hold.cashFlowAbove) {
    return { label: "Hold", detail: "Cash flow is positive and debt coverage meets the hold threshold." };
  }
  return { label: "Monitor", detail: "The record does not meet the thresholds for hold, refinance, distress, or sale." };
}

export function passesBuyGates(model: { dscr: number | null; irr: number | null }, policy: ThresholdPolicy["buy"] = defaultThresholds.buy) {
  return model.dscr !== null && model.dscr >= policy.minimumDscr && model.irr !== null && model.irr >= policy.minimumIrr;
}

export function acquisitionVerdict(model: { dscr: number; irr: number | null }, maxOffer: number | null, policy: ThresholdPolicy = defaultThresholds) {
  if (model.dscr < policy.lender.minimumDscr) return "Do not pursue";
  if (passesBuyGates(model, policy.buy)) return "Buy";
  return maxOffer === null ? "Insufficient basis" : "Verify mitigations";
}
