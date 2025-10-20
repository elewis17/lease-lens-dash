// src/domain/finance/OpexCalculator.ts
export type Period = "monthly" | "annual";
export type Source = "direct" | "estimated" | "in_mortgage" | "unknown";

/**
 * Represents any recurring cost (taxes, insurance, etc.).
 */
export interface PeriodAmount {
  amount: number;     // dollar value in the specified period
  period: Period;     // e.g., "monthly" or "annual"
  source: Source;     // where the value came from
}

/**
 * Minimal property-like interface.
 * This keeps the calculator independent of React props or Supabase models.
 */
export interface PropertyLike {
  sale_price?: number | null;
  mgmt_pct?: number | null;         // % of rent
  maintenance_pct?: number | null;  // % of rent

  // Legacy fields for backward compatibility
  property_taxes?: number | null;   
  taxes_in_mortgage?: boolean;
  insurance?: number | null;
  insurance_in_mortgage?: boolean;

  // Future normalized shape
  taxes?: PeriodAmount;
  hazard_insurance?: PeriodAmount;
}

export interface OpexContext {
  monthlyRent: number;
  mortgageIncludesEscrow?: boolean;
}

/**
 * Handles conversion, normalization, and aggregation of OPEX values.
 */
export class OpexCalculator {
  /** Convert a PeriodAmount to monthly dollars */
  static toMonthly(pa?: PeriodAmount | null): number {
    if (!pa || Number.isNaN(pa.amount)) return 0;
    const base = pa.period === "annual" ? pa.amount / 12 : pa.amount;
    return Math.max(0, base);
  }

  /** Whether a PeriodAmount should be included in OPEX totals */
  static include(pa?: PeriodAmount | null, ctx?: OpexContext): boolean {
    if (!pa) return false;
    if (pa.source === "in_mortgage") return false;
    if (ctx?.mortgageIncludesEscrow && (pa.source === "direct" || pa.source === "estimated")) {
      return false;
    }
    return true;
  }

  /** Adapter for legacy tax fields */
  static legacyTaxes(p: PropertyLike): PeriodAmount | null {
    if (p.taxes) return p.taxes;
    if (p.taxes_in_mortgage) {
      return { amount: 0, period: "monthly", source: "in_mortgage" };
    }
    const amt = typeof p.property_taxes === "number" ? p.property_taxes : 0;
    const source: Source = typeof p.property_taxes === "number" ? "direct" : "estimated";
    return { amount: amt, period: "monthly", source };
  }

  /** Adapter for legacy insurance fields */
  static legacyInsurance(p: PropertyLike): PeriodAmount | null {
    if (p.hazard_insurance) return p.hazard_insurance;
    if (p.insurance_in_mortgage) {
      return { amount: 0, period: "monthly", source: "in_mortgage" };
    }
    const amt = typeof p.insurance === "number" ? p.insurance : 0;
    const source: Source = typeof p.insurance === "number" ? "direct" : "unknown";
    return { amount: amt, period: "monthly", source };
  }

  /**
   * Compute the monthly OPEX for a property context.
   * Includes: taxes, insurance, mgmt %, and maintenance % of rent.
   */
  static monthlyForProperty(p: PropertyLike, ctx: OpexContext): number {
    const taxesPA = this.legacyTaxes(p);
    const insPA   = this.legacyInsurance(p);

    const taxes = this.include(taxesPA, ctx) ? this.toMonthly(taxesPA) : 0;
    const ins   = this.include(insPA, ctx)   ? this.toMonthly(insPA)   : 0;

    const mgmt  = Math.max(0, (p.mgmt_pct ?? 0) / 100 * ctx.monthlyRent);
    const maint = Math.max(0, (p.maintenance_pct ?? 0) / 100 * ctx.monthlyRent);

    return Math.round(taxes + ins + mgmt + maint);
  }
}
