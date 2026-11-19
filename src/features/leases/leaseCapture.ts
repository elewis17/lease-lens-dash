import { z } from "zod";

const nullableText = z.string().max(300).nullable();
const nullableNumber = z.number().finite().nullable();

export const extractionSchema = z.object({
  fields: z.object({
    tenantName: nullableText,
    propertyAddress: nullableText,
    unitLabel: nullableText,
    startDate: nullableText,
    endDate: nullableText,
    monthlyRent: nullableNumber,
    deposit: nullableNumber,
    lateFee: nullableNumber,
    graceDays: nullableNumber,
    noticeDays: nullableNumber,
  }),
  confidence: z.record(z.number().min(0).max(1).nullable()),
});

export type LeaseExtraction = z.infer<typeof extractionSchema>;

export const acceptedLeaseFiles = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export const leaseFileMaxBytes = 8 * 1024 * 1024;

const amount = z.number({ invalid_type_error: "Enter an amount." }).finite().min(0).max(99_999_999.99);
const days = z.number().int().min(0).max(2_147_483_647);
const numberInput = (schema: z.ZodNumber, required = false) => z.preprocess(value => {
  if (typeof value !== "string") return value;
  if (value.trim() === "") return required ? undefined : null;
  return Number(value);
}, required ? schema : schema.nullable());
const date = z.string().date("Enter a valid date.");

export const leaseReviewSchema = z.object({
  propertyId: z.string().trim().min(1, "Select a property."),
  unitLabel: z.string().trim().min(1, "Enter the unit label.").max(100),
  tenantName: z.string().trim().min(1, "Enter the tenant name.").max(200),
  startDate: date,
  endDate: date,
  monthlyRent: numberInput(amount, true).transform(value => value as number),
  deposit: numberInput(amount),
  lateFee: numberInput(amount),
  graceDays: numberInput(days),
  noticeDays: numberInput(days),
}).refine(value => value.startDate <= value.endDate, { path: ["endDate"], message: "Lease end must be on or after lease start." });

export type LeaseReview = z.output<typeof leaseReviewSchema>;
export type LeaseCapture = {
  id: string;
  file: File;
  extracted: LeaseExtraction;
};
