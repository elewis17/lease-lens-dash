import { supabase } from "@/integrations/supabase/client";
import { acceptedLeaseFiles, extractionSchema, type LeaseCapture, type LeaseReview } from "./leaseCapture";

const bucket = "lease-documents";

async function signedInOwner(ownerId: string) {
  const { data, error } = await supabase.auth.getSession();
  const session = data.session;
  if (error || !session || session.user.id !== ownerId || session.user.is_anonymous) {
    throw new Error("Sign in again to continue.");
  }
  return session;
}

export async function extractLease(file: File, ownerId: string): Promise<LeaseCapture> {
  const session = await signedInOwner(ownerId);
  const body = new FormData();
  body.append("file", file);
  const { data, error } = await supabase.functions.invoke("parse-lease", {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const extracted = extractionSchema.safeParse(data);
  if (error || !extracted.success) throw new Error("The document could not be read. Try another image or PDF.");
  return { id: crypto.randomUUID(), file, extracted: extracted.data };
}

export async function saveCapturedLease(capture: LeaseCapture, review: LeaseReview, ownerId: string) {
  await signedInOwner(ownerId);
  const extension = acceptedLeaseFiles[capture.file.type as keyof typeof acceptedLeaseFiles];
  if (!extension) throw new Error("Choose a supported file.");
  const path = `${ownerId}/${capture.id}/lease.${extension}`;
  const { error: storageError } = await supabase.storage.from(bucket).upload(path, capture.file, { upsert: false });
  // A prior confirmation attempt may have uploaded this exact capture before its lease row was saved.
  if (storageError && (!("statusCode" in storageError) || storageError.statusCode !== "409")) {
    throw new Error("The document could not be stored. Try confirming again.");
  }

  const { data, error } = await supabase.rpc("confirm_parsed_lease", {
    p_lease_id: capture.id,
    p_property_id: review.propertyId,
    p_unit_label: review.unitLabel,
    p_tenant_name: review.tenantName,
    p_start_date: review.startDate,
    p_end_date: review.endDate,
    p_monthly_rent: review.monthlyRent,
    p_deposit: review.deposit,
    p_late_fee: review.lateFee,
    p_grace_days: review.graceDays,
    p_notice_days: review.noticeDays,
    p_doc_path: path,
    p_parsed: capture.extracted.fields,
    p_confidence: capture.extracted.confidence,
  });
  if (error || data !== capture.id) throw new Error("The lease could not be saved. Check the selected property and confirm again.");
}
