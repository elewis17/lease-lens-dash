export const defaultThresholds = {
  hold: { minimumDscr: 1.25, cashFlowAbove: 0 },
  distress: { dscrBelow: 1, cashFlowBelow: 0 },
  sell: { distressQuarters: 2, dscrBelowWithoutCredibleFix: 1.05 },
  refinance: { minimumDscr: 1.3, rateSpreadPercentagePoints: 0.75, cashFlowAbove: 0 },
  buy: { minimumDscr: 1.25, minimumIrr: 0.12 },
  lender: { minimumDscr: 1.15 },
};

export type ThresholdPolicy = typeof defaultThresholds;
export type BuyThresholds = typeof defaultThresholds.buy;

export const strategyPresets = {
  Growth: { ...defaultThresholds, buy: { ...defaultThresholds.buy, minimumIrr: 0.15 } },
  Balanced: defaultThresholds,
  Income: { ...defaultThresholds, buy: { ...defaultThresholds.buy, minimumDscr: 1.35 } },
};
export type Strategy = keyof typeof strategyPresets;

export const propertyTypes = ["Single-Family", "Multi-Family", "Commercial", "Industrial"] as const;
