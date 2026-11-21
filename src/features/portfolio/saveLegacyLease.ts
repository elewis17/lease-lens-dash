import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LeaseInput = Database["public"]["Functions"]["dealstack_add_lease"]["Args"];

export async function ownsLegacyProperties(ownerId: string, ...ids: string[]) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || auth.user?.id !== ownerId) return false;
  const propertyIds = [...new Set(ids)];
  const { data, error } = await supabase.from("properties").select("id")
    .eq("user_id", ownerId).in("id", propertyIds);
  return !error && propertyIds.every(id => data?.some(property => property.id === id));
}

// The original portfolio uses table writes and has no lease-creation RPC.
export async function saveLegacyLease(ownerId: string, input: LeaseInput) {
  const propertyId = input.p_property_id;
  const leaseId = input.p_lease_id;
  if (!await ownsLegacyProperties(ownerId, propertyId)) return false;

  const { data: existingLease, error: leaseLookupError } = await supabase.from("leases").select("id")
    .eq("id", leaseId).eq("property_id", propertyId).maybeSingle();
  if (leaseLookupError) return false;
  if (existingLease) return true;

  const unitId = await resolveLegacyUnit(propertyId, input.p_unit_label, leaseId);
  if (!unitId) return false;

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

  if (unitId === leaseId) {
    await supabase.rpc("update_property_unit_count", { target_property: propertyId });
  }
  return true;
}

export async function resolveLegacyUnit(propertyId: string, label: string, newId: string) {
  const { data: units, error } = await supabase.from("units").select("id")
    .eq("property_id", propertyId).eq("unit_label", label).order("id").limit(1);
  if (error) return null;
  if (units?.[0]) return units[0].id;
  const { data, error: insertError } = await supabase.from("units").insert({
    id: newId, property_id: propertyId, unit_label: label,
  }).select("id").single();
  return insertError ? null : data.id;
}
