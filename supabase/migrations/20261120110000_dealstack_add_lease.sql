BEGIN;

-- Can also be applied on the existing Lease Lens schema before the DealStack migrations.
CREATE OR REPLACE FUNCTION public.dealstack_add_lease(
  p_lease_id uuid, p_property_id uuid, p_unit_label text, p_tenant_name text,
  p_start_date date, p_end_date date, p_monthly_rent numeric, p_deposit numeric, p_status public.lease_status
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  selected_unit uuid;
  selected_tenant uuid;
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign-in required.' USING ERRCODE = '42501'; END IF;
  IF p_lease_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL
    OR NOT isfinite(p_start_date) OR NOT isfinite(p_end_date) OR p_start_date > p_end_date
    OR p_unit_label IS NULL OR length(trim(p_unit_label)) NOT BETWEEN 1 AND 100
    OR p_tenant_name IS NULL OR length(trim(p_tenant_name)) NOT BETWEEN 1 AND 200
    OR p_monthly_rent IS NULL OR NOT (p_monthly_rent BETWEEN 0 AND 99999999.99)
    OR (p_deposit IS NOT NULL AND NOT (p_deposit BETWEEN 0 AND 99999999.99))
  THEN
    RAISE EXCEPTION 'Invalid lease details.' USING ERRCODE = '22023';
  END IF;

  IF to_regprocedure('public.save_manual_lease(uuid,boolean,uuid,text,text,date,date,numeric,numeric,public.lease_status)') IS NOT NULL THEN
    RETURN public.save_manual_lease(p_lease_id, false, p_property_id, p_unit_label, p_tenant_name,
      p_start_date, p_end_date, p_monthly_rent, p_deposit, p_status);
  END IF;

  PERFORM 1 FROM public.properties WHERE id = p_property_id AND user_id = owner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Property unavailable.' USING ERRCODE = '42501'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.leases AS lease JOIN public.units AS unit ON unit.id = lease.unit_id
    WHERE lease.id = p_lease_id AND lease.property_id = p_property_id AND unit.property_id = p_property_id
  ) THEN
    RETURN p_lease_id;
  END IF;

  SELECT id INTO selected_unit FROM public.units
    WHERE property_id = p_property_id AND lower(trim(unit_label)) = lower(trim(p_unit_label))
    ORDER BY id LIMIT 1;
  IF selected_unit IS NULL THEN
    INSERT INTO public.units (property_id, unit_label) VALUES (p_property_id, trim(p_unit_label))
      RETURNING id INTO selected_unit;
  END IF;

  INSERT INTO public.tenants (name) VALUES (trim(p_tenant_name)) RETURNING id INTO selected_tenant;
  INSERT INTO public.leases (id, property_id, unit_id, tenant_id, start_date, end_date, monthly_rent, deposit, status)
    VALUES (p_lease_id, p_property_id, selected_unit, selected_tenant, p_start_date, p_end_date, p_monthly_rent, p_deposit, p_status);
  UPDATE public.properties SET total_units = (
    SELECT count(*)::integer FROM public.units WHERE property_id = p_property_id
  ) WHERE id = p_property_id AND user_id = owner_id;
  RETURN p_lease_id;
END;
$$;

REVOKE ALL ON FUNCTION public.dealstack_add_lease(uuid, uuid, text, text, date, date, numeric, numeric, public.lease_status) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.dealstack_add_lease(uuid, uuid, text, text, date, date, numeric, numeric, public.lease_status) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
