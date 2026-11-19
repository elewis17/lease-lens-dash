BEGIN;

CREATE FUNCTION public.save_manual_lease(
  p_lease_id uuid, p_edit boolean, p_property_id uuid, p_unit_label text, p_tenant_name text,
  p_start_date date, p_end_date date, p_monthly_rent numeric, p_deposit numeric, p_status public.lease_status
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  target_unit uuid;
  target_tenant uuid;
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign-in required.' USING ERRCODE = '42501'; END IF;
  IF p_lease_id IS NULL OR p_edit IS NULL OR p_start_date IS NULL OR p_end_date IS NULL
    OR NOT isfinite(p_start_date) OR NOT isfinite(p_end_date) OR p_start_date > p_end_date
    OR p_unit_label IS NULL OR length(trim(p_unit_label)) NOT BETWEEN 1 AND 100
    OR p_tenant_name IS NULL OR length(trim(p_tenant_name)) NOT BETWEEN 1 AND 200
    OR p_monthly_rent IS NULL OR NOT (p_monthly_rent BETWEEN 0 AND 99999999.99)
    OR (p_deposit IS NOT NULL AND NOT (p_deposit BETWEEN 0 AND 99999999.99))
  THEN
    RAISE EXCEPTION 'Invalid lease details.' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.properties WHERE id = p_property_id AND user_id = owner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Property unavailable.' USING ERRCODE = '42501'; END IF;

  IF p_edit THEN
    SELECT lease.unit_id, lease.tenant_id INTO target_unit, target_tenant
      FROM public.leases AS lease WHERE lease.id = p_lease_id AND lease.user_id = owner_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Lease unavailable.' USING ERRCODE = '42501'; END IF;
  ELSIF EXISTS (
    SELECT 1 FROM public.leases WHERE id = p_lease_id AND user_id = owner_id AND property_id = p_property_id AND doc_url IS NULL
  ) THEN
    RETURN p_lease_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.units WHERE id = target_unit AND user_id = owner_id AND property_id = p_property_id
      AND lower(trim(unit_label)) = lower(trim(p_unit_label))
  ) THEN
    SELECT id INTO target_unit FROM public.units WHERE property_id = p_property_id AND user_id = owner_id
      AND lower(trim(unit_label)) = lower(trim(p_unit_label)) ORDER BY id LIMIT 1;
    IF target_unit IS NULL THEN
      INSERT INTO public.units (property_id, user_id, unit_label)
      VALUES (p_property_id, owner_id, trim(p_unit_label)) RETURNING id INTO target_unit;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = target_tenant AND user_id = owner_id AND name = trim(p_tenant_name)) THEN
    SELECT id INTO target_tenant FROM public.tenants WHERE user_id = owner_id AND name = trim(p_tenant_name) ORDER BY id LIMIT 1;
    IF target_tenant IS NULL THEN
      INSERT INTO public.tenants (user_id, name) VALUES (owner_id, trim(p_tenant_name)) RETURNING id INTO target_tenant;
    END IF;
  END IF;

  IF p_edit THEN
    UPDATE public.leases SET property_id = p_property_id, unit_id = target_unit, tenant_id = target_tenant,
      start_date = p_start_date, end_date = p_end_date, monthly_rent = p_monthly_rent, deposit = p_deposit, status = p_status,
      updated_at = now()
      WHERE id = p_lease_id AND user_id = owner_id;
  ELSE
    INSERT INTO public.leases (id, user_id, property_id, unit_id, tenant_id, start_date, end_date, monthly_rent, deposit, status)
    VALUES (p_lease_id, owner_id, p_property_id, target_unit, target_tenant, p_start_date, p_end_date, p_monthly_rent, p_deposit, p_status);
  END IF;
  PERFORM public.update_property_unit_count(p_property_id);
  RETURN p_lease_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_manual_lease(uuid, boolean, uuid, text, text, date, date, numeric, numeric, public.lease_status) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_manual_lease(uuid, boolean, uuid, text, text, date, date, numeric, numeric, public.lease_status) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
