import { monthlyPayment } from "./underwriting.ts";
import { balanceAfter, type Loan } from "./debt.ts";
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
  const currentService = asset.rentalLoans && sumKnown(asset.rentalLoans.map(loan =>
    loan.remaining === null || loan.principalInterest === null ? null : Math.min(months, loan.remaining) * loan.principalInterest,
  ));
  const currentBalance = asset.rentalLoans && sumKnown(asset.rentalLoans.map(loan => balanceAfter(loan, months)));
  const quoteBalance = balanceAfter({
    balance: asset.rentalDebt, remaining: term, rate: rate / 100, principalInterest: result.newDebtService, escrow: result.escrow,
  }, months);
  const cash = currentService === null ? null
    : currentService - Math.min(months, term) * result.newDebtService - result.closingCosts;
  const wealth = cash === null || currentBalance === null || quoteBalance === null
    ? null : cash + currentBalance - quoteBalance;
  const risk = asset.dscr === null || result.dscr === null ? null : result.dscr - asset.dscr;

  return {
    ...result, rate, term, costPct: Number(quote.cost),
    cash,
    wealth,
    tenYearInterestSaved: wealth === null ? null : wealth + result.closingCosts,
    risk,
    cashYield: result.closingCosts > 0 ? (result.firstYearNet + result.closingCosts) / result.closingCosts : null,
  };
}

export type RentPlan = { rent: string; expenses: string; cost: string; start: string };
export const emptyRentPlan: RentPlan = { rent: "", expenses: "", cost: "", start: "" };

export function modelRentPlan(asset: AssetMetrics, inputs: RentPlan) {
  const raw = [inputs.rent, inputs.expenses, inputs.cost, inputs.start];
  if (raw.some(value => value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0)) return null;
  const [rent, expenses, closingCosts, start] = raw.map(Number);
  if (!Number.isInteger(start) || start > 12) return null;
  const monthlyNoi = rent - expenses;
  const annualRunRateImpact = monthlyNoi * 12;
  const firstYearCash = (12 - start) * monthlyNoi;
  const cash = (capitalHorizonYears * 12 - start) * monthlyNoi - closingCosts;
  if (![annualRunRateImpact, firstYearCash, cash].every(Number.isFinite)) return null;
  return {
    closingCosts, start, monthlyNoi, annualRunRateImpact, firstYearNet: firstYearCash - closingCosts,
    cash, wealth: cash, risk: asset.debtService !== null && asset.debtService > 0 ? monthlyNoi / asset.debtService : null,
    cashYield: closingCosts > 0 ? firstYearCash / closingCosts : null,
  };
}

export type PaydownPlan = { loanId: string; amount: string; fee: string };
export const emptyPaydownPlan: PaydownPlan = { loanId: "", amount: "", fee: "" };

function scheduledDebt(loan: Loan, principal: number, limit: number) {
  const { principalInterest, rate } = loan;
  if (principalInterest === null || !Number.isFinite(principalInterest) || !Number.isFinite(rate) ||
      rate < 0 || (principal > 0 && principalInterest <= principal * rate / 12)) return null;
  let balance = principal;
  let payments = 0;
  let interest = 0;
  let months = 0;
  while (balance > 0.005 && months < limit) {
    const charge = balance * rate / 12;
    const payment = Math.min(principalInterest, balance + charge);
    balance = Math.max(0, balance + charge - payment);
    payments += payment;
    interest += charge;
    months++;
  }
  return { balance, months, payments, interest };
}

export function modelPaydown(asset: AssetMetrics, inputs: PaydownPlan) {
  if (!inputs.amount.trim() || !inputs.fee.trim()) return null;
  const amount = Number(inputs.amount);
  const fee = Number(inputs.fee);
  const loan = asset.rentalLoans?.find(item => item.id === inputs.loanId);
  if (!loan || loan.balance === null || loan.remaining === null || !Number.isSafeInteger(loan.remaining) ||
      loan.remaining < 1 || loan.remaining > 1200 || !Number.isFinite(amount) || amount <= 0 || amount > loan.balance ||
      !Number.isFinite(fee) || fee < 0 || !Number.isFinite(amount + fee)) return null;
  const remainingPrincipal = loan.balance - amount;
  const lifeBefore = scheduledDebt(loan, loan.balance, loan.remaining);
  const lifeAfter = scheduledDebt(loan, remainingPrincipal, loan.remaining);
  if (!lifeBefore || !lifeAfter || lifeBefore.balance > 0.01 || lifeAfter.balance > 0.01) return null;

  const firstBefore = scheduledDebt(loan, loan.balance, 12);
  const firstAfter = scheduledDebt(loan, remainingPrincipal, 12);
  const tenBefore = scheduledDebt(loan, loan.balance, capitalHorizonYears * 12);
  const tenAfter = scheduledDebt(loan, remainingPrincipal, capitalHorizonYears * 12);
  if (!firstBefore || !firstAfter || !tenBefore || !tenAfter) return null;
  const closingCosts = amount + fee;
  const debtServiceReduction = remainingPrincipal === 0 ? loan.principalInterest ?? 0 : 0;
  const postPayment = asset.debtService === null ? null : asset.debtService - debtServiceReduction;
  const cash = tenBefore.payments - tenAfter.payments - closingCosts;
  return {
    closingCosts, amount, fee, startingBalance: loan.balance, annualRate: loan.rate,
    debtServiceReduction, annualRunRateImpact: debtServiceReduction * 12,
    firstYearNet: firstBefore.payments - firstAfter.payments - closingCosts, cash,
    wealth: cash + tenBefore.balance - tenAfter.balance,
    risk: asset.noi !== null && asset.dscr !== null && postPayment !== null && postPayment > 0
      ? asset.noi / postPayment - asset.dscr : null,
    firstYearCashYield: (firstBefore.payments - firstAfter.payments) / closingCosts,
    tenYearInterestSaved: tenBefore.interest - tenAfter.interest,
    lifetimeInterestSaved: lifeBefore.interest - lifeAfter.interest,
    monthsSaved: lifeBefore.months - lifeAfter.months,
  };
}

const opportunityDetails = {
  refinance: {
    name: "Refinance",
    risk: "An indicative rate can change. A longer term may increase the balance still owed, even if the monthly payment falls.",
    missing: "Confirm a property-specific rate, term, fees, and any prepayment charges.",
  },
  rent: {
    name: "Reset rents at",
    risk: "Renewal timing, concessions, and turnover may change the realized rent increase.",
    missing: "Confirm rents against comparable listings and current leases before acting.",
  },
  vacancy: {
    name: "Fill vacancy at",
    risk: "Lease-up time and refresh costs can reduce or delay the cash benefit.",
    missing: "Confirm the vacant unit’s achievable rent, refresh cost, and expected move-in date.",
  },
  paydown: {
    name: "Pay down debt at",
    risk: "Cash used for paydown is no longer available. The model keeps the scheduled payment in place until payoff.",
    missing: "Confirm the lender will apply the payment to principal and verify any prepayment charge.",
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
  rentPlan?: ReturnType<typeof modelRentPlan>;
  paydown?: ReturnType<typeof modelPaydown>;
};

export function capitalOpportunities(assets: AssetMetrics[], quote: RefinanceQuote, rentPlans: Readonly<Record<string, RentPlan>> = {}, paydowns: Readonly<Record<string, PaydownPlan>> = {}): CapitalOpportunity[] {
  const result: CapitalOpportunity[] = [];
  for (const asset of assets) {
    const add = (action: Action) => {
      const { name, risk, missing } = opportunityDetails[action];
      const id = `${asset.property.id}:${action}`;
      const inputs = rentPlans[id];
      const paydown = paydowns[id];
      result.push({
        id,
        paydown: paydown && action === "paydown" ? modelPaydown(asset, paydown) : null,
        rentPlan: inputs && (action === "vacancy" || action === "rent") ? modelRentPlan(asset, inputs) : null,
        action, title: `${name} ${asset.property.alias}`,
        asset, risk, missing, refinance: action === "refinance" ? modelRefinance(asset, quote) : null,
      });
    };
    if (asset.verdict.label === "Refinance candidate") add("refinance");
    if (asset.occupancy && asset.occupancy.occupiedUnits < asset.occupancy.totalUnits) add("vacancy");
    if (rentPlans[asset.property.id + ":rent"] && (asset.expectedRent ?? 0) > 0) add("rent");
    if (asset.rentalLoans?.some(loan => (loan.balance ?? 0) > 0) && paydowns[asset.property.id + ":paydown"]) add("paydown");
    if (!asset.householdLoans.length && (asset.verdict.label === "Distress" || asset.verdict.label === "Sell candidate")) add("sale");
  }
  return result;
}

export const capitalProjection = (action: CapitalOpportunity) => action.refinance ?? action.rentPlan ?? action.paydown ?? null;

export function rankCapitalOpportunities(opportunities: CapitalOpportunity[], objective: CapitalObjective) {
  return [...opportunities].sort((a, b) => {
    const left = capitalProjection(a)?.[objective] ?? null;
    const right = capitalProjection(b)?.[objective] ?? null;
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    return (right ?? 0) - (left ?? 0) || a.title.localeCompare(b.title);
  });
}

export function capitalBudget(available: string, reserve: string) {
  if ([available, reserve].some(value => value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0)) return null;
  return Math.max(0, Number(available) - Number(reserve));
}

export function capitalConflicts(actions: CapitalOpportunity[]) {
  const seen = new Map<string, CapitalOpportunity[]>();
  for (const action of actions) {
    const existing = seen.get(action.asset.property.id) ?? [];
    seen.set(action.asset.property.id, [...existing, action]);
  }
  return [...seen.values()].flatMap(group => {
    if (group.length <= 1) return [];
    const property = group[0].asset.property.alias;
    return group.some(action => action.action === "sale")
      ? ["Conflict · review the sale separately from other actions on " + property + "."]
      : ["Stacked risk · the actions share exposure to " + property + "."];
  });
}

export function recommendCapital(actions: CapitalOpportunity[], objective: CapitalObjective, deployable: number) {
  let remaining = deployable;
  const properties = new Set<string>();
  return rankCapitalOpportunities(actions, objective).filter(action => {
    const projection = capitalProjection(action);
    const property = action.asset.property.id;
    if (!projection || (projection[objective] ?? 0) <= 0 || projection.closingCosts > remaining || properties.has(property)) return false;
    remaining -= projection.closingCosts;
    properties.add(property);
    return true;
  });
}

export function combinedCapitalPlan(actions: CapitalOpportunity[], monthsToStart: number | null, metrics: { noi: number | null; debtService: number | null }) {
  const validRefinanceTiming = monthsToStart !== null && Number.isInteger(monthsToStart) && monthsToStart >= 0 && monthsToStart <= 12;
  if (!actions.length || actions.some(action => !capitalProjection(action)) || capitalConflicts(actions).length) return null;
  const steps: { id: string; title: string; costMonth: number; startMonth: number; costs: number; runRate: number; firstYear: number }[] = [];
  let debtService = metrics.debtService;
  let noi = metrics.noi;
  for (const action of actions) {
    const { id, title } = action;
    if (action.paydown) {
      steps.push({ id, title, costMonth: 0, startMonth: 0, costs: action.paydown.closingCosts,
        runRate: action.paydown.annualRunRateImpact, firstYear: action.paydown.firstYearNet });
      if (debtService !== null) debtService -= action.paydown.debtServiceReduction;
      continue;
    }
    if (action.rentPlan) {
      const { closingCosts, annualRunRateImpact, firstYearNet, monthlyNoi } = action.rentPlan;
      steps.push({ id, title, costMonth: 0, startMonth: action.rentPlan.start, costs: closingCosts,
        runRate: annualRunRateImpact, firstYear: firstYearNet });
      if (noi !== null) noi += monthlyNoi;
      continue;
    }
    if (!validRefinanceTiming || monthsToStart === null) return null;
    const model = action.refinance;
    if (!model || action.asset.debtService === null) return null;
    const activeMonths = 12 - monthsToStart;
    const baseline = action.asset.rentalLoans && sumKnown(action.asset.rentalLoans.map(loan =>
      loan.remaining === null || loan.principalInterest === null ? null : Math.min(activeMonths, Math.max(0, loan.remaining - monthsToStart)) * loan.principalInterest,
    ));
    const closingBalance = action.asset.rentalLoans && sumKnown(action.asset.rentalLoans.map(loan => balanceAfter(loan, monthsToStart)));
    const ongoingService = action.asset.rentalLoans && sumKnown(action.asset.rentalLoans.map(loan =>
      loan.remaining === null || loan.principalInterest === null ? null : loan.remaining > monthsToStart ? loan.principalInterest : 0,
    ));
    if (baseline === null || closingBalance === null || ongoingService === null) return null;
    const cost = closingBalance * model.costPct / 100;
    const replacement = monthlyPayment(closingBalance, model.rate / 100, model.term);
    steps.push({ id, title, costMonth: monthsToStart, startMonth: monthsToStart, costs: cost,
      runRate: (ongoingService - replacement) * 12,
      firstYear: baseline - activeMonths * replacement - (activeMonths > 0 ? cost : 0) });
    if (debtService !== null) debtService += replacement - action.asset.debtService;
  }
  const dscr = noi !== null && debtService !== null && debtService > 0 ? noi / debtService : null;
  steps.sort((a, b) => a.costMonth - b.costMonth || a.startMonth - b.startMonth || a.title.localeCompare(b.title));
  return {
    costs: steps.reduce((sum, step) => sum + step.costs, 0),
    runRate: steps.reduce((sum, step) => sum + step.runRate, 0),
    firstYear: steps.reduce((sum, step) => sum + step.firstYear, 0),
    dscr, steps,
  };
}


export type SalePlan = { price: string; costs: string; payoff: string; date: string };
export const emptySalePlan: SalePlan = { price: "", costs: "", payoff: "", date: "" };

export function netSaleProceeds(price: string, costs: string, payoff: string) {
  const parsed = [price, costs, payoff].map(value => value.trim() === "" ? NaN : Number(value));
  if (parsed.some(value => !Number.isFinite(value) || value < 0)) return null;
  const [sale, selling, mortgage] = parsed;
  return sale - selling - mortgage;
}
