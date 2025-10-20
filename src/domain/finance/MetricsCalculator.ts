import { OpexCalculator, PropertyLike, OpexContext } from "./OpexCalculator";

/**
 * Handles property-level and portfolio-level financial metrics.
 * All methods are pure and safe to test independently.
 */
export class MetricsCalculator {
  /** Net Operating Income (annual) */
  static noiAnnual(monthlyRent: number, property: PropertyLike, ctx: OpexContext): number {
    const opexMonthly = OpexCalculator.monthlyForProperty(property, ctx);
    return (monthlyRent - opexMonthly) * 12;
  }

  /** Cap Rate = NOI / Property Value */
  static capRate(noiAnnual: number, propertyValue: number): number {
    return propertyValue > 0 ? (noiAnnual / propertyValue) * 100 : 0;
  }

  /** Annual ROI = Annual Cash Flow / Property Value */
  static roiAnnual(cashFlowAnnual: number, propertyValue: number): number {
    return propertyValue > 0 ? (cashFlowAnnual / propertyValue) * 100 : 0;
  }

  /** Debt Coverage Ratio = NOI / Annual Debt Service */
  static dcr(noiAnnual: number, debtServiceAnnual: number): number {
    return debtServiceAnnual > 0 ? noiAnnual / debtServiceAnnual : 0;
  }

  /** Cash-on-Cash Return = Annual Cash Flow / Initial Equity */
  static cashOnCash(cashFlowAnnual: number, investedEquity: number): number {
    return investedEquity > 0 ? (cashFlowAnnual / investedEquity) * 100 : 0;
  }

  /** Simple 10-year IRR approximation (growth 3%/yr, no detailed CF array) */
  static irr10Year(propertyValue: number, cashFlowAnnual: number, investedEquity: number): number {
    const futureValue = propertyValue * Math.pow(1.03, 10);
    const totalCF = cashFlowAnnual * 10;
    const base = Math.max(investedEquity, 1);
    return (Math.pow((futureValue + totalCF) / base, 1 / 10) - 1) * 100;
  }

  /** High-level aggregator for convenience */
  static summary(params: {
    monthlyRent: number;
    property: PropertyLike;
    ctx: OpexContext;
    propertyValue: number;
    debtServiceAnnual?: number;
    investedEquity?: number;
  }) {
    const noi = this.noiAnnual(params.monthlyRent, params.property, params.ctx);
    const cap = this.capRate(noi, params.propertyValue);
    const dcr = this.dcr(noi, params.debtServiceAnnual ?? 0);
    const roi = this.roiAnnual(noi, params.propertyValue);
    const coc = this.cashOnCash(noi, params.investedEquity ?? 0);
    return { noi, cap, dcr, roi, coc };
  }
}
