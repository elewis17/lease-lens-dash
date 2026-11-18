import { defaultThresholds, type BuyThresholds } from "./thresholds.ts";

export type DealAssumptions = {
  price: number;
  rentMonthly: number;
  opexMonthly: number;
  vacancyRate: number;
  annualRentGrowth: number;
  annualExpenseGrowth: number;
  downPayment: number;
  annualRate: number;
  termMonths: number;
  closingCost: number;
  holdYears: number;
  exitCap: number;
  saleCost: number;
};

export const kirkwoodExample: DealAssumptions = {
  price: 720_000,
  rentMonthly: 5_200,
  opexMonthly: 1_050,
  vacancyRate: 0.05,
  annualRentGrowth: 0.025,
  annualExpenseGrowth: 0.02,
  downPayment: 0.25,
  annualRate: 0.0675,
  termMonths: 360,
  closingCost: 0.02,
  holdYears: 10,
  exitCap: 0.065,
  saleCost: 0.06,
};

export function monthlyPayment(balance: number, annualRate: number, months: number): number {
  const rate = annualRate / 12;
  return rate === 0 ? balance / months : balance * rate / -Math.expm1(-months * Math.log1p(rate));
}

export function solveIrr(cashFlows: readonly number[]): number | null {
  if (cashFlows.length < 2 || cashFlows.some((value) => !Number.isFinite(value)) || cashFlows[0] >= 0) return null;
  const signs = cashFlows.filter((value) => value !== 0).map(Math.sign);
  if (signs.filter((sign, index) => index > 0 && sign !== signs[index - 1]).length !== 1) return null;

  const npv = (rate: number) => cashFlows.reduce((total, flow, year) => total + flow / (1 + rate) ** year, 0);
  let low = -0.999999;
  let high = 1;
  while (npv(high) > 0 && high < 1e6) high *= 2;
  if (npv(low) < 0 || npv(high) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const middle = (low + high) / 2;
    if (npv(middle) > 0) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function modelDeal(input: DealAssumptions) {
  if (Object.values(input).some((value) => !Number.isFinite(value)) ||
      input.price <= 0 || input.rentMonthly < 0 || input.opexMonthly < 0 ||
      input.vacancyRate < 0 || input.vacancyRate > 1 || input.downPayment < 0 || input.downPayment > 1 ||
      input.annualRate < 0 || input.exitCap <= 0 || input.closingCost < 0 ||
      input.saleCost < 0 || input.saleCost >= 1 || input.annualRentGrowth <= -1 || input.annualExpenseGrowth <= -1 ||
      !Number.isInteger(input.termMonths) || input.termMonths <= 0 ||
      !Number.isInteger(input.holdYears) || input.holdYears < 1 || input.holdYears > 100) return null;

  const loanAmount = input.price * (1 - input.downPayment);
  const monthlyDebt = monthlyPayment(loanAmount, input.annualRate, input.termMonths);
  const remainingMonths = Math.max(0, input.termMonths - input.holdYears * 12);
  const rate = input.annualRate / 12;
  const payoff = remainingMonths === 0 ? 0 : rate === 0
    ? monthlyDebt * remainingMonths
    : monthlyDebt * -Math.expm1(-remainingMonths * Math.log1p(rate)) / rate;

  const annualNoiAt = (year: number) => 12 * (
    input.rentMonthly * (1 - input.vacancyRate) * (1 + input.annualRentGrowth) ** (year - 1) -
    input.opexMonthly * (1 + input.annualExpenseGrowth) ** (year - 1)
  );
  const invested = input.price * (input.downPayment + input.closingCost);
  const cashFlows = [-invested];
  for (let year = 1; year <= input.holdYears; year++) {
    const payments = Math.min(12, Math.max(0, input.termMonths - (year - 1) * 12));
    cashFlows.push(annualNoiAt(year) - payments * monthlyDebt);
  }
  const netSaleProceeds = annualNoiAt(input.holdYears + 1) / input.exitCap * (1 - input.saleCost) - payoff;
  cashFlows[input.holdYears] += netSaleProceeds;
  const annualNoi = annualNoiAt(1);
  const debtInYearOne = Math.min(input.termMonths, 12) * monthlyDebt;
  if (![annualNoi, monthlyDebt, netSaleProceeds, ...cashFlows].every(Number.isFinite)) return null;
  return {
    loanAmount,
    annualNoi,
    monthlyDebt,
    cashFlow: (annualNoi - debtInYearOne) / 12,
    dscr: debtInYearOne > 0 ? annualNoi / debtInYearOne : null,
    irr: solveIrr(cashFlows),
    capRate: annualNoi / input.price,
    cashYield: invested > 0 ? (annualNoi - debtInYearOne) / invested : null,
    cashFlows,
    netSaleProceeds,
  };
}

export function priceGates(input: DealAssumptions, buy: BuyThresholds = defaultThresholds.buy) {
  const model = modelDeal(input);
  if (model === null || model.dscr === null || model.annualNoi <= 0) {
    return { maxOffer: null, walkAway: null, verdict: "Insufficient basis" } as const;
  }
  if (!(buy.minimumDscr > 0) || !Number.isFinite(buy.minimumDscr) || !Number.isFinite(buy.minimumIrr)) {
    return { maxOffer: null, walkAway: null, verdict: "Insufficient basis" } as const;
  }
  const debtPerDollar = model.monthlyDebt / input.price * Math.min(12, input.termMonths);
  const walkAway = Math.floor(model.annualNoi / (defaultThresholds.lender.minimumDscr * debtPerDollar));
  const dscrCap = Math.floor(model.annualNoi / (buy.minimumDscr * debtPerDollar));
  if (!Number.isSafeInteger(walkAway) || !Number.isSafeInteger(dscrCap)) {
    return { maxOffer: null, walkAway: null, verdict: "Insufficient basis" } as const;
  }
  const passes = (price: number) => {
    const deal = modelDeal({ ...input, price });
    return deal?.dscr != null && deal.dscr >= buy.minimumDscr && deal.irr != null && deal.irr >= buy.minimumIrr;
  };
  let low = 1;
  let high = dscrCap;
  let maxOffer: number | null = null;
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    if (passes(middle)) {
      maxOffer = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  const verdict = passes(input.price)
    ? "Buy"
    : model.dscr < defaultThresholds.lender.minimumDscr
      ? "Do not pursue"
      : maxOffer === null
        ? "Insufficient basis"
        : "Verify mitigations";
  return { maxOffer, walkAway, verdict } as const;
}
