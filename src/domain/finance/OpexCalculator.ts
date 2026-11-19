export type ExpenseInput = {
  property_id: string | null;
  unit_id: string | null;
  date: string;
  amount: number;
  category: "tax" | "insurance" | "repairs" | "pm" | "utilities" | "hoa" | "advertising" | "other" | "capex";
};

type OperatingCategory = Exclude<ExpenseInput["category"], "capex">;

const categories: readonly OperatingCategory[] = ["tax", "insurance", "pm", "repairs", "utilities", "hoa", "advertising", "other"];

type OperatingInputs = {
  property_taxes?: number | null;
  insurance?: number | null;
  mgmt_pct?: number | null;
  maintenance_pct?: number | null;
};

type ExpenseComponent = { category: OperatingCategory | "escrow"; amount: number | null; basis: "Recorded" | "Estimate" | "Missing" };

export function operatingExpenses(
  property: OperatingInputs, records: ExpenseInput[], rent: number | null, escrow: number | null, hasEscrow: boolean,
): ExpenseComponent[] {
  const recorded = new Map<OperatingCategory, number>();
  for (const record of records) {
    if (record.category !== "capex") recorded.set(record.category, (recorded.get(record.category) ?? 0) + record.amount);
  }

  const annualEstimates = {
    tax: property.property_taxes,
    insurance: property.insurance,
    pm: rent === null || property.mgmt_pct == null ? null : rent * 12 * property.mgmt_pct / 100,
    repairs: rent === null || property.maintenance_pct == null ? null : rent * 12 * property.maintenance_pct / 100,
  } satisfies Partial<Record<OperatingCategory, number | null | undefined>>;

  const components: ExpenseComponent[] = categories
    .filter(category => !hasEscrow || (category !== "tax" && category !== "insurance"))
    .map(category => {
      const actual = recorded.get(category);
      if (actual !== undefined) return { category, amount: actual / 12, basis: "Recorded" };
      const estimate = annualEstimates[category as keyof typeof annualEstimates];
      return estimate == null
        ? { category, amount: null, basis: "Missing" }
        : { category, amount: estimate / 12, basis: "Estimate" };
    });
  if (hasEscrow) components.push({ category: "escrow", amount: escrow, basis: escrow === null ? "Missing" : "Estimate" });
  return components;
}
