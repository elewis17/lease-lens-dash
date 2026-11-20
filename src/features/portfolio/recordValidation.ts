import { z } from "zod";

const propertyId = z.string({ required_error: "Select a property." }).trim().min(1, "Select a property.");
const requiredText = (label: string, max: number) =>
  z.string({ required_error: `Enter ${label}.` }).trim().min(1, `Enter ${label}.`).max(max, `Use at most ${max} characters for ${label}.`);
const amount = (label: string, max = Number.MAX_SAFE_INTEGER) =>
  z.number({ required_error: `Enter ${label}.`, invalid_type_error: `Enter a valid ${label}.` })
    .finite().min(0, `${label} cannot be negative.`).max(max, `${label} is too large.`);
const percentage = (label: string) => amount(label, 100).max(100, `${label} must be between 0 and 100.`);
const date = (label: string) => z.string({ required_error: `Enter ${label}.`, invalid_type_error: `Enter ${label}.` }).date(`Enter a valid ${label}.`);
const numberValue = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? null : Number(value);
};

const requiredNumber = (schema: z.ZodNumber) => z.preprocess(value => numberValue(value) ?? undefined, schema);
const optionalNumber = (schema: z.ZodNumber) => z.preprocess(value => numberValue(value) ?? null, schema.nullable());

export const propertyForm = z.object({
  alias: requiredText("a property name", 200),
  address: requiredText("an address", 500),
  type: z.string().trim().max(100).nullable().optional(),
  sale_price: optionalNumber(amount("Purchase price")),
  property_value: optionalNumber(amount("Current value")),
  property_taxes: optionalNumber(amount("Annual taxes", 9_999_999_999.99)),
  insurance: optionalNumber(amount("Annual insurance")),
  mgmt_pct: optionalNumber(percentage("Management percentage")),
  vacancy_pct: optionalNumber(percentage("Vacancy percentage")),
  maintenance_pct: optionalNumber(percentage("Maintenance percentage")),
});

export const mortgageForm = z.object({
  property_id: propertyId,
  loan_name: z.string().trim().max(200).nullable().optional(),
  principal_original: requiredNumber(amount("original principal", 999_999_999_999.99)),
  current_balance: optionalNumber(amount("Current balance", 999_999_999_999.99)),
  interest_rate: requiredNumber(percentage("Interest rate")),
  term_months: requiredNumber(z.number({ required_error: "Enter the term in months." })
    .int("Use whole months for the loan term.").min(1, "Enter a term of at least one month.").max(2_147_483_647)),
  start_date: z.preprocess(value => value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : value, date("the loan start date")),
  monthly_payment: requiredNumber(amount("monthly payment")),
  includes_escrow: z.boolean().optional(),
});

export const mortgageEscrowChange = z.object({ includes_escrow: z.boolean() }).strict();

const leaseTerms = z.object({
  startDate: date("the lease start date"),
  leaseEnd: date("the lease end date"),
  monthlyRent: requiredNumber(amount("monthly rent", 99_999_999.99)),
  deposit: optionalNumber(amount("Deposit", 99_999_999.99)),
  status: z.enum(["active", "expiring", "expired", "vacant"]).nullable().optional(),
});
const dateOrder = { path: ["leaseEnd"], message: "Lease end must be on or after lease start." };
const validDates = (value: { startDate: string; leaseEnd: string }) => value.leaseEnd >= value.startDate;
export const leaseTermForm = leaseTerms.refine(validDates, dateOrder);
export const manualLeaseForm = leaseTerms.extend({
  property_id: propertyId,
  tenant: requiredText("a tenant name", 200),
  unit_label: requiredText("a unit label", 100),
}).refine(validDates, dateOrder);
