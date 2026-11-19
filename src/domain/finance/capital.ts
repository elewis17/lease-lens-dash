import { balanceAfter } from "./debt.ts";
import { refinance } from "./scenarios.ts";
import { sumKnown, type AssetMetrics } from "./portfolio.ts";

export const capitalHorizonYears = 10;
export const capitalObjectives = [
  { id: "cash", label: "Cash flow" },
  { id: "wealth", label: "Net worth" },
  { id: "risk", label: "Risk" },
] as const;

export type CapitalObjective = (typeof capitalObjectives)[number]["id"];
export type RefinanceQuote = { rate: string; years: string; cost: string };

function modelRefinance(asset: AssetMetrics, quote: RefinanceQuote) {
  const rate = Number(quote.rate);
  const term = Number(quote.years) * 12;
  const result = [quote.rate, quote.years, quote.cost].every(value => value.trim() !== "")
    ? refinance(asset, rate, term, Number(quote.cost)) : null;
  if (!result) return null;

  const months = capitalHorizonYears * 12;
  const currentService = asset.loans && sumKnown(asset.loans.map(loan =>
    loan.remaining === null || loan.principalInterest === null ? null : Math.min(months, loan.remaining) * loan.principalInterest,
  ));
  const currentBalance = asset.loans && sumKnown(asset.loans.map(loan => balanceAfter(loan, months)));
  const quoteBalance = balanceAfter({
    balance: asset.debt, remaining: term, rate: rate / 100, principalInterest: result.newDebtService, escrow: result.escrow,
  }, months);
  const cash = currentService === null ? null
    : currentService - Math.min(months, term) * result.newDebtService - result.closingCosts;
  const wealth = cash === null || currentBalance === null || quoteBalance === null
    ? null : cash + currentBalance - quoteBalance;
  const risk = asset.dscr === null || result.dscr === null ? null : result.dscr - asset.dscr;

  return {
    ...result,
    cash,
    wealth,
    risk,
    cashYield: result.closingCosts > 0 ? (result.firstYearNet + result.closingCosts) / result.closingCosts : null,
  };
}

const opportunityDetails = {
  refinance: {
    name: "Refinance",
    risk: "An indicative rate can change. A longer term may increase the balance still owed, even if the monthly payment falls.",
    missing: "Confirm a property-specific rate, term, fees, and any prepayment charges.",
  },
  vacancy: {
    name: "Fill vacancy at",
    risk: "Lease-up time and refresh costs can reduce or delay the cash benefit.",
    missing: "Confirm the vacant unit’s achievable rent, refresh cost, and expected move-in date.",
  },
  sale: {
    name: "Review sale of",
    risk: "Closing and redeployment may take time. Estimated value may differ from the sale price.",
    missing: "Confirm the expected sale price, selling costs, mortgage payoff, and any redeployment assumptions.",
  },
} as const;

type Action = keyof typeof opportunityDetails;
export type CapitalOpportunity = {
  id: string;
  action: Action;
  title: string;
  asset: AssetMetrics;
  risk: string;
  missing: string;
  refinance: ReturnType<typeof modelRefinance>;
};

export function capitalOpportunities(assets: AssetMetrics[], quote: RefinanceQuote): CapitalOpportunity[] {
  const result: CapitalOpportunity[] = [];
  for (const asset of assets) {
    const add = (action: Action) => {
      const { name, risk, missing } = opportunityDetails[action];
      result.push({
        id: `${asset.property.id}:${action}`,
        action, title: `${name} ${asset.property.alias}`,
        asset, risk, missing, refinance: action === "refinance" ? modelRefinance(asset, quote) : null,
      });
    };
    if (asset.verdict.label === "Refinance candidate") add("refinance");
    if (asset.occupancy && asset.occupancy.occupiedUnits < asset.occupancy.totalUnits) add("vacancy");
    if (asset.verdict.label === "Distress" || asset.verdict.label === "Sell candidate") add("sale");
  }
  return result;
}

export function rankCapitalOpportunities(opportunities: CapitalOpportunity[], objective: CapitalObjective) {
  return [...opportunities].sort((a, b) => {
    const left = a.refinance?.[objective] ?? null;
    const right = b.refinance?.[objective] ?? null;
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    return (right ?? 0) - (left ?? 0) || a.title.localeCompare(b.title);
  });
}
