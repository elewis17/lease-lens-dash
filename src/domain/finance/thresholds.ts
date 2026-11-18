export const defaultThresholds = {
  hold: { minimumDscr: 1.25, cashFlowAbove: 0 },
  distress: { dscrBelow: 1, cashFlowBelow: 0 },
  sell: { distressQuarters: 2, dscrBelowWithoutCredibleFix: 1.05 },
  refinance: { minimumDscr: 1.3, rateSpreadPercentagePoints: 0.75, cashFlowAbove: 0 },
  buy: { minimumDscr: 1.25, minimumIrr: 0.12 },
  lender: { minimumDscr: 1.15 },
};

export type BuyThresholds = typeof defaultThresholds.buy;
