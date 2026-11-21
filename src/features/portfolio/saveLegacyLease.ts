import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LeaseInput = Database["public"]["Functions"]["dealstack_add_lease"]["Args"];

// The original portfolio uses table writes and has no lease-creation RPC.
export async function saveLegacyLease(ownerId: string, input: LeaseInput) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || auth.user?.id !== ownerId) return false;

  const propertyId = input.p_property_id;
  const leaseId = input.p_lease_id;
  const { data: property, error: propertyError } = await supabase.from("properties").select("id")
    .eq("id", propertyId).eq("user_id", ownerId).maybeSingle();
  if (propertyError || !property) return false;

  const { data: existingLease, error: leaseLookupError } = await supabase.from("leases").select("id")
    .eq("id", leaseId).eq("property_id", propertyId).maybeSingle();
  if (leaseLookupError) return false;
  if (existingLease) return true;

  const { data: units, error: unitLookupError } = await supabase.from("units").select("id")
    .eq("property_id", propertyId).eq("unit_label", input.p_unit_label).order("id").limit(1);
  if (unitLookupError) return false;
  let unitId = units?.[0]?.id;
  const newUnit = !unitId;
  if (!unitId) {
    // A stable ID lets a retry reuse an earlier successful insert.
    const { data, error } = await supabase.from("units").insert({
      id: leaseId, property_id: propertyId, unit_label: input.p_unit_label,
    }).select("id").single();
    if (error || !data) return false;
    unitId = data.id;
  }

  // Use a per-lease tenant ID so that a name match cannot link another portfolio's tenant.
  const { data: tenant, error: tenantError } = await supabase.from("tenants").select("name")
    .eq("id", leaseId).maybeSingle();
  if (tenantError || (tenant && tenant.name !== input.p_tenant_name)) return false;
  if (!tenant) {
    const { error } = await supabase.from("tenants").insert({ id: leaseId, name: input.p_tenant_name });
    if (error) return false;
  }

  const { error } = await supabase.from("leases").insert({
    id: leaseId, property_id: propertyId, unit_id: unitId, tenant_id: leaseId,
    start_date: input.p_start_date, end_date: input.p_end_date,
    monthly_rent: input.p_monthly_rent, deposit: input.p_deposit, status: input.p_status,
  });
  if (error) return false;

  if (newUnit || unitId === leaseId) {
    await supabase.rpc("update_property_unit_count", { target_property: propertyId });
  }
  return true;
}
