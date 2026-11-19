BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lease-documents', 'lease-documents', false, 8388608,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

CREATE POLICY dealstack_lease_object_scope ON storage.objects AS RESTRICTIVE FOR ALL TO public
  USING (bucket_id <> 'lease-documents' OR split_part(name, '/', 1) = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id <> 'lease-documents' OR split_part(name, '/', 1) = (SELECT auth.uid())::text);

CREATE POLICY dealstack_lease_objects_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lease-documents' AND split_part(name, '/', 1) = (SELECT auth.uid())::text);

CREATE POLICY dealstack_lease_objects_add ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lease-documents' AND split_part(name, '/', 1) = (SELECT auth.uid())::text);

CREATE FUNCTION public.confirm_parsed_lease(
  p_lease_id uuid, p_property_id uuid, p_unit_label text, p_tenant_name text,
  p_start_date date, p_end_date date, p_monthly_rent numeric, p_deposit numeric,
  p_late_fee numeric, p_grace_days integer, p_notice_days integer, p_doc_path text,
  p_parsed jsonb, p_confidence jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  unit_id_found uuid;
  tenant_id_created uuid;
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Sign-in required.' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.properties WHERE id = p_property_id AND user_id = owner_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property unavailable.' USING ERRCODE = '42501';
  END IF;

  IF p_lease_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL
    OR NOT isfinite(p_start_date) OR NOT isfinite(p_end_date) OR p_start_date > p_end_date
    OR p_unit_label IS NULL OR length(trim(p_unit_label)) NOT BETWEEN 1 AND 100
    OR p_tenant_name IS NULL OR length(trim(p_tenant_name)) NOT BETWEEN 1 AND 200
    OR p_monthly_rent IS NULL OR NOT (p_monthly_rent BETWEEN 0 AND 99999999.99)
    OR (p_deposit IS NOT NULL AND NOT (p_deposit BETWEEN 0 AND 99999999.99))
    OR (p_late_fee IS NOT NULL AND NOT (p_late_fee BETWEEN 0 AND 99999999.99))
    OR (p_grace_days IS NOT NULL AND p_grace_days < 0)
    OR (p_notice_days IS NOT NULL AND p_notice_days < 0)
    OR p_doc_path IS NULL OR p_doc_path NOT IN (
      owner_id::text || '/' || p_lease_id::text || '/lease.pdf',
      owner_id::text || '/' || p_lease_id::text || '/lease.jpg',
      owner_id::text || '/' || p_lease_id::text || '/lease.png',
      owner_id::text || '/' || p_lease_id::text || '/lease.webp'
    )
    OR jsonb_typeof(p_parsed) IS DISTINCT FROM 'object' OR jsonb_typeof(p_confidence) IS DISTINCT FROM 'object'
    OR octet_length(p_parsed::text) > 20000 OR octet_length(p_confidence::text) > 4000
  THEN
    RAISE EXCEPTION 'Invalid lease details.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.leases
             WHERE id = p_lease_id AND user_id = owner_id AND property_id = p_property_id AND doc_url = p_doc_path)
  THEN
    RETURN p_lease_id;
  END IF;

  PERFORM 1 FROM storage.objects WHERE bucket_id = 'lease-documents' AND name = p_doc_path;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lease document unavailable.' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO unit_id_found FROM public.units
    WHERE property_id = p_property_id AND user_id = owner_id
      AND lower(trim(unit_label)) = lower(trim(p_unit_label))
    ORDER BY id LIMIT 1;
  IF unit_id_found IS NULL THEN
    INSERT INTO public.units (property_id, user_id, unit_label)
    VALUES (p_property_id, owner_id, trim(p_unit_label)) RETURNING id INTO unit_id_found;
  END IF;

  INSERT INTO public.tenants (user_id, name)
  VALUES (owner_id, trim(p_tenant_name)) RETURNING id INTO tenant_id_created;

  INSERT INTO public.leases (
    id, user_id, property_id, unit_id, tenant_id, start_date, end_date, monthly_rent, deposit,
    late_fee_amount, grace_period_days, notice_days, status, doc_url, parsed_json, confidence_scores
  ) VALUES (
    p_lease_id, owner_id, p_property_id, unit_id_found, tenant_id_created, p_start_date, p_end_date, p_monthly_rent, p_deposit,
    p_late_fee, p_grace_days, p_notice_days,
    CASE WHEN p_end_date < current_date THEN 'expired'::public.lease_status ELSE 'active'::public.lease_status END,
    p_doc_path, p_parsed, p_confidence
  );
  PERFORM public.update_property_unit_count(p_property_id);
  RETURN p_lease_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_parsed_lease(uuid, uuid, text, text, date, date, numeric, numeric, numeric, integer, integer, text, jsonb, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.confirm_parsed_lease(uuid, uuid, text, text, date, date, numeric, numeric, numeric, integer, integer, text, jsonb, jsonb) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
