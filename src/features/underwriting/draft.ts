import { propertyTypes } from "../../domain/finance/thresholds.ts";
import type { DealAssumptions } from "../../domain/finance/underwriting.ts";

export const fields: { key: keyof DealAssumptions; label: string; scale?: number }[] = [
  { key: "price", label: "Asking price ($)" },
  { key: "rentMonthly", label: "Monthly rent ($)" },
  { key: "opexMonthly", label: "Monthly operating expenses ($)" },
  { key: "vacancyRate", label: "Vacancy (%)", scale: 100 },
  { key: "downPayment", label: "Down payment (%)", scale: 100 },
  { key: "annualRate", label: "Annual loan rate (%)", scale: 100 },
  { key: "termMonths", label: "Loan term (years)", scale: 1 / 12 },
  { key: "closingCost", label: "Closing costs (%)", scale: 100 },
  { key: "annualRentGrowth", label: "Annual rent growth (%)", scale: 100 },
  { key: "annualExpenseGrowth", label: "Annual expense growth (%)", scale: 100 },
  { key: "exitCap", label: "Exit cap rate (%)", scale: 100 },
  { key: "saleCost", label: "Selling costs (%)", scale: 100 },
];

export const holdYears = 10;
export type AssumptionInputs = Partial<Record<keyof DealAssumptions | "testPrice" | "propertyType", string>>;

export const assumptionsFrom = (values: AssumptionInputs): DealAssumptions | null => {
  if (fields.some(({ key }) => !values[key]?.trim())) return null;
  return {
    ...Object.fromEntries(fields.map(({ key, scale = 1 }) => [key, Number(values[key]) / scale])),
    holdYears,
  } as DealAssumptions;
};


export function initialValues(assumptions: DealAssumptions | null | undefined): AssumptionInputs {
  return assumptions ? Object.fromEntries(fields.map(({ key, scale = 1 }) => [
    key, String(Number((assumptions[key] * scale).toPrecision(12))),
  ])) : {};
}

export function readDraft(fragment: string): AssumptionInputs | null {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const draft = params.get("draft");
  if (draft === null || draft.length > 600) return null;
  const parts = draft.split(",");
  if (parts.length !== fields.length ||
    parts.some(part => part.length > 40 || (part !== "" && !/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(part)))) return null;
  const values: AssumptionInputs = Object.fromEntries(fields.map(({ key }, index) => [key, parts[index]]));
  const testPrice = params.get("testPrice");
  if (testPrice && testPrice.length <= 40 && /^\d+(?:\.\d+)?$/.test(testPrice) &&
    Number.isFinite(Number(testPrice)) && Number(testPrice) > 0) values.testPrice = testPrice;
  const propertyType = propertyTypes.find(type => type === params.get("propertyType"));
  if (propertyType) values.propertyType = propertyType;
  return values;
}

export function draftFragment(values: AssumptionInputs): string {
  const encoded = fields.map(({ key }) => values[key] ?? "").join(",");
  const params = new URLSearchParams({ draft: encoded });
  if (values.propertyType) params.set("propertyType", values.propertyType);
  if (values.testPrice) params.set("testPrice", values.testPrice);
  return "#" + params.toString();
}
