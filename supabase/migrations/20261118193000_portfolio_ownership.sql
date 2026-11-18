BEGIN;

-- Existing property ownership is authoritative. Unattributable legacy rows
-- retain a null owner and stay outside the application until reconciled.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.units AS child SET user_id = parent.user_id
FROM public.properties AS parent
WHERE child.property_id = parent.id AND child.user_id IS NULL;

UPDATE public.mortgages AS child SET user_id = parent.user_id
FROM public.properties AS parent
WHERE child.property_id = parent.id AND child.user_id IS NULL;

UPDATE public.expenses AS child SET user_id = parent.user_id
FROM public.properties AS parent
WHERE child.property_id = parent.id AND child.user_id IS NULL;

UPDATE public.leases AS child SET property_id = unit.property_id
FROM public.units AS unit
WHERE child.unit_id = unit.id AND child.property_id IS NULL;

UPDATE public.leases AS child SET user_id = parent.user_id
FROM public.properties AS parent
WHERE child.property_id = parent.id AND child.user_id IS NULL
  AND (child.unit_id IS NULL OR EXISTS (
    SELECT 1 FROM public.units AS unit
    WHERE unit.id = child.unit_id AND unit.property_id = parent.id
      AND unit.user_id = parent.user_id
  ));

WITH attributable AS (
  SELECT tenant_id, (array_agg(DISTINCT user_id))[1] AS user_id
  FROM public.leases
  WHERE tenant_id IS NOT NULL
  GROUP BY tenant_id
  HAVING count(*) = count(user_id) AND count(DISTINCT user_id) = 1
)
UPDATE public.tenants AS tenant SET user_id = attributable.user_id
FROM attributable
WHERE tenant.id = attributable.tenant_id AND tenant.user_id IS NULL;

DO $migration$
DECLARE
  table_name text;
  owner_check text;
  scope_check text;
BEGIN
  -- These tables exist in some deployed schemas.
  IF to_regclass('public.maintenance') IS NOT NULL THEN
    ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS user_id uuid;
    UPDATE public.maintenance AS child SET user_id = unit.user_id
    FROM public.units AS unit WHERE child.unit_id = unit.id AND child.user_id IS NULL;
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id uuid;
    UPDATE public.payments AS child SET user_id = lease.user_id
    FROM public.leases AS lease WHERE child.lease_id = lease.id AND child.user_id IS NULL;
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'properties', 'units', 'tenants', 'leases', 'mortgages', 'expenses', 'maintenance', 'payments'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN CONTINUE; END IF;

    owner_check := format('%I.user_id = (SELECT auth.uid())', table_name);
    scope_check := owner_check;

    IF table_name IN ('units', 'leases', 'mortgages', 'expenses') THEN
      scope_check := scope_check || format(
        ' AND (%1$I.property_id IS NULL OR EXISTS (
          SELECT 1 FROM public.properties AS property
          WHERE property.id = %1$I.property_id AND property.user_id = %1$I.user_id
        ))', table_name
      );
    END IF;

    IF table_name = 'leases' THEN
      scope_check := scope_check || ' AND (leases.tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM public.tenants AS tenant
        WHERE tenant.id = leases.tenant_id AND tenant.user_id = leases.user_id
      )) AND (leases.unit_id IS NULL OR EXISTS (
        SELECT 1 FROM public.units AS unit
        WHERE unit.id = leases.unit_id AND unit.user_id = leases.user_id
          AND unit.property_id IS NOT DISTINCT FROM leases.property_id
      ))';
    ELSIF table_name = 'expenses' AND EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = 'public.expenses'::regclass AND attname = 'unit_id' AND NOT attisdropped
    ) THEN
      scope_check := scope_check || ' AND (expenses.unit_id IS NULL OR EXISTS (
        SELECT 1 FROM public.units AS unit
        WHERE unit.id = expenses.unit_id AND unit.user_id = expenses.user_id
          AND (expenses.property_id IS NULL OR unit.property_id = expenses.property_id)
      ))';
    ELSIF table_name = 'maintenance' THEN
      scope_check := scope_check || ' AND EXISTS (
        SELECT 1 FROM public.units AS unit
        WHERE unit.id = maintenance.unit_id AND unit.user_id = maintenance.user_id
      )';
    ELSIF table_name = 'payments' THEN
      scope_check := scope_check || ' AND EXISTS (
        SELECT 1 FROM public.leases AS lease
        WHERE lease.id = payments.lease_id AND lease.user_id = payments.user_id
      )';
    END IF;

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (user_id)', table_name || '_user_id_idx', table_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS dealstack_owner_scope ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS dealstack_owner_access ON public.%I', table_name);

    -- A restrictive policy also applies when a legacy permissive policy matches.
    EXECUTE format(
      'CREATE POLICY dealstack_owner_scope ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC
       USING (%s) WITH CHECK (%s)', table_name, scope_check, scope_check
    );
    EXECUTE format(
      'CREATE POLICY dealstack_owner_access ON public.%I FOR ALL TO authenticated
       USING (%s) WITH CHECK (%s)', table_name, owner_check, owner_check
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', table_name);
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
  END LOOP;
END
$migration$;

-- Property aliases are unique within each owner's portfolio.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_properties_owner_alias_ci
  ON public.properties (user_id, lower(alias));
DROP INDEX IF EXISTS public.uniq_properties_alias_ci;

-- Ensure bootstrap views also respect the caller's row policies.
ALTER VIEW IF EXISTS public.v_properties SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_mortgages SET (security_invoker = true);

-- The existing count helper must run with caller permissions and RLS.
DO $migration$
DECLARE
  helper regprocedure;
BEGIN
  FOR helper IN
    SELECT proc.oid::regprocedure FROM pg_proc AS proc
    JOIN pg_namespace AS namespace ON namespace.oid = proc.pronamespace
    WHERE namespace.nspname = 'public' AND proc.proname = 'update_property_unit_count'
      AND proc.prokind = 'f'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', helper);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', helper);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', helper);
  END LOOP;
END
$migration$;

NOTIFY pgrst, 'reload schema';
COMMIT;
