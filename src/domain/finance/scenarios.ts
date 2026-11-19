import { balanceAfter } from "./debt.ts";
import { MetricsCalculator } from "./MetricsCalculator.ts";
import { sumKnown, type PortfolioMetrics } from "./portfolio.ts";
import { monthlyPayment } from "./underwriting.ts";

export function refinance(metrics: PortfolioMetrics, ratePct: number, termMonths: number, closingCostPct: number) {
  if (![ratePct, closingCostPct].every(value => Number.isFinite(value) && value >= 0) ||
      !Number.isSafeInteger(termMonths) || termMonths <= 0 ||
      metrics.debt === null || metrics.debt <= 0 || metrics.debtService === null || metrics.loans === null ||
      metrics.noi === null || termMonths < 12) return null;
  const escrow = sumKnown(metrics.loans.map(loan => loan.escrow));
  if (escrow === null) return null;
  const newDebtService = monthlyPayment(metrics.debt, ratePct / 100, termMonths);
  const closingCosts = metrics.debt * closingCostPct / 100;
  const currentHorizonService = sumKnown(metrics.loans.map(loan =>
    loan.remaining === null || loan.principalInterest === null ? null : Math.min(12, loan.remaining) * loan.principalInterest,
  ));
  if (currentHorizonService === null) return null;
  return {
    escrow,
    newDebtService,
    closingCosts,
    annualRunRateImpact: (metrics.debtService - newDebtService) * 12,
    firstYearNet: currentHorizonService - 12 * newDebtService - closingCosts,
    dscr: MetricsCalculator.dscr(metrics.noi, newDebtService),
  };
}

export function projectPortfolio(metrics: PortfolioMetrics) {
  if (!metrics.assets.length) return [];
  return Array.from({ length: 10 }, (_, offset) => {
    const basis = metrics.assets.map(asset => {
      const { rent_growth_rate: rentGrowth, opex_inflation_rate: opexGrowth } = asset.property;
      const revenue = asset.effectiveRent === null || rentGrowth == null
        ? null : asset.effectiveRent * 12 * (1 + rentGrowth / 100) ** offset;
      const opex = asset.opex === null || opexGrowth == null
        ? null : asset.opex * 12 * (1 + opexGrowth / 100) ** offset;
      const monthsElapsed = offset * 12;
      const debtService = asset.loans && sumKnown(asset.loans.map(loan =>
        loan.remaining === null || loan.principalInterest === null
          ? null : Math.max(0, Math.min(12, loan.remaining - monthsElapsed)) * loan.principalInterest,
      ));
      const totalExpenses = opex === null || debtService === null ? null : opex + debtService;
      const noi = opex === null || revenue === null ? null : revenue - opex;
      const propertyValue = noi === null || noi < 0 || asset.capRate === null || asset.capRate <= 0 ? null : noi / asset.capRate;
      const debtBalance = asset.loans && sumKnown(asset.loans.map(loan => balanceAfter(loan, monthsElapsed)));
      return { revenue, totalExpenses, propertyValue, debtBalance };
    });
    const revenue = sumKnown(basis.map(asset => asset.revenue));
    const totalExpenses = sumKnown(basis.map(asset => asset.totalExpenses));
    const propertyValue = sumKnown(basis.map(asset => asset.propertyValue));
    const debtBalance = sumKnown(basis.map(asset => asset.debtBalance));
    return {
      year: offset + 1, revenue, totalExpenses, propertyValue, debtBalance,
      cashFlow: revenue === null || totalExpenses === null ? null : revenue - totalExpenses,
      equity: propertyValue === null || debtBalance === null ? null : propertyValue - debtBalance,
    };
  });
}

export function projectNextYearWealth(metrics: PortfolioMetrics, appreciationRatePct: number | null) {
  const appreciation = metrics.value === null || appreciationRatePct === null || !Number.isFinite(appreciationRatePct)
    ? null : metrics.value * appreciationRatePct / 100;
  return { appreciation, growth: sumKnown([metrics.annualizedCashFlow, metrics.paydown, appreciation]) };
}
