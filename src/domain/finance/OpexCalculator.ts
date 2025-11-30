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

export class OpexCalculator {
  /** 
   * Main entry point used from Index.tsx
   *
   * property: row from properties table
   * opts.monthlyRent: rent AFTER vacancy adjustment
   * opts.mortgageIncludesEscrow: boolean
   */
  static monthlyForProperty(property: any, opts: {
    monthlyRent: number;
    mortgageIncludesEscrow: boolean;
    mortgageRow?: any;
  }) {
    const rent = Number(opts.monthlyRent ?? 0);

    // ----- 1) TAX + INSURANCE MONTHLY -----
    const t = Number(property?.property_taxes ?? 0);
    const i = Number(property?.insurance ?? 0);

    let monthlyTax = 0;
    let monthlyInsurance = 0;

    if (opts.mortgageIncludesEscrow && opts.mortgageRow) {
      // derive from mortgage payment
      const m = opts.mortgageRow;

      const P =
        Number(m.current_balance) ||
        Number(m.principal_original) ||
        Number(m.principal) ||
        0;

      const n = Number(m.term_months ?? 0);
      const r = Number(m.interest_rate ?? 0) / 100 / 12;

      let PI = 0;
      if (P > 0 && n > 0 && r > 0) {
        PI =
          (P * r * Math.pow(1 + r, n)) /
          (Math.pow(1 + r, n) - 1);
      }

      const escrow = Number(m.monthly_payment ?? 0) - PI;

      // Option A — simplest & accurate: count entire escrow as OPEX
      monthlyTax = escrow;
      monthlyInsurance = 0;

      // (Optional) If you want 60/40 split:
      // monthlyTax = escrow * 0.6;
      // monthlyInsurance = escrow * 0.4;
    } else {
      // Use property’s annual numbers; convert to monthly
      monthlyTax = t / 12;
      monthlyInsurance = i / 12;
    }

    // ----- 2) MANAGEMENT -----
    const mgmtPct = Number(property?.mgmt_pct ?? 0) / 100;
    const management = rent * mgmtPct;

    // ----- 3) MAINTENANCE -----
    const maintPct = Number(property?.maintenance_pct ?? 0) / 100;
    const maintenance = rent * maintPct;

    // ----- 4) Optional categories -----
    const utilities = 0;
    const hoa = 0;
    const misc = 0;

    // ----- 5) Total monthly OPEX -----
    const total =
      monthlyTax +
      monthlyInsurance +
      maintenance +
      management +
      utilities +
      hoa +
      misc;

    return Math.round(total);
  }
}
