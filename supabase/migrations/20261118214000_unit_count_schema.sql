BEGIN;

-- Fresh databases need the same RPC used to refresh a property's unit count.
-- This leaves an existing implementation in place.
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc AS proc
    JOIN pg_namespace AS namespace ON namespace.oid = proc.pronamespace
    WHERE namespace.nspname = 'public' AND proc.proname = 'update_property_unit_count'
      AND proc.prokind = 'f'
  ) THEN
    CREATE FUNCTION public.update_property_unit_count(target_property uuid)
    RETURNS integer
    LANGUAGE sql
    SECURITY INVOKER
    SET search_path = ''
    AS $function$
      UPDATE public.properties AS property
      SET total_units = (
        SELECT count(*)::integer
        FROM public.units AS unit
        WHERE unit.property_id = property.id AND unit.user_id = property.user_id
      )
      WHERE property.id = target_property AND property.user_id = (SELECT auth.uid())
      RETURNING property.total_units
    $function$;
    REVOKE EXECUTE ON FUNCTION public.update_property_unit_count(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.update_property_unit_count(uuid) TO authenticated;
  END IF;
END
$migration$;

NOTIFY pgrst, 'reload schema';
COMMIT;
