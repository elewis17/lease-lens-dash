-- ===========================
-- BOOTSTRAP ALL (idempotent)
-- Creates/aligns schema used by your app.
-- Safe to re-run. No data drop by default.
-- ===========================

-- Helpers: ensure extensions commonly used by Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- PROPERTIES ----------
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  address TEXT
);

-- Add/align modern columns (tolerates legacy)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS alias TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS property_taxes NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mgmt_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS vacancy_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS maintenance_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS property_value NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS opex_inflation_rate NUMERIC(5,2) DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS rent_growth_rate NUMERIC(5,2) DEFAULT 3.0;

-- Backfill display fields + mirror prices
UPDATE public.properties
SET alias = COALESCE(NULLIF(alias,''), NULLIF(name,''), NULLIF(address,''), id::text)
WHERE alias IS NULL OR alias = '';

UPDATE public.properties
SET sale_price = COALESCE(sale_price, purchase_price),
    purchase_price = COALESCE(purchase_price, sale_price)
WHERE sale_price IS NULL OR purchase_price IS NULL;

-- Case-insensitive uniqueness on alias (best effort)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_properties_alias_ci') THEN
    CREATE UNIQUE INDEX uniq_properties_alias_ci ON public.properties (lower(alias));
  END IF;
END $$;

-- ---------- UNITS ----------
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  unit_label TEXT
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_property_id_fkey'
  ) THEN
    ALTER TABLE public.units
    ADD CONSTRAINT units_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- TENANTS ----------
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT
);

-- ---------- LEASES ----------
CREATE TABLE IF NOT EXISTS public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  unit_id uuid,
  monthly_rent NUMERIC(12,2),
  vacancy_rate NUMERIC(5,2),
  deposit NUMERIC(12,2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date   TIMESTAMP WITH TIME ZONE,
  status TEXT
);

-- If you had a legacy "unit" column, rename it safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leases' AND column_name='unit'
  ) THEN
    EXECUTE 'ALTER TABLE public.leases RENAME COLUMN unit TO property_name';
  END IF;
END $$;

-- FKs for leases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leases_tenant_id_fkey') THEN
    ALTER TABLE public.leases
    ADD CONSTRAINT leases_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leases_unit_id_fkey') THEN
    ALTER TABLE public.leases
    ADD CONSTRAINT leases_unit_id_fkey
      FOREIGN KEY (unit_id) REFERENCES public.units(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- MORTGAGES ----------
CREATE TABLE IF NOT EXISTS public.mortgages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  loan_name TEXT,
  principal NUMERIC(14,2),
  interest_rate NUMERIC(6,3),
  term_months INTEGER,
  start_date DATE,
  monthly_payment NUMERIC(14,2)
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mortgages_property_id_fkey') THEN
    ALTER TABLE public.mortgages
    ADD CONSTRAINT mortgages_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- EXPENSES ----------
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  category TEXT,
  amount NUMERIC(14,2),
  date TIMESTAMP WITH TIME ZONE DEFAULT now()
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='expenses_property_id_fkey') THEN
    ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- Optional helper views ----------
CREATE OR REPLACE VIEW public.v_properties AS
SELECT
  id, alias, name, address, type,
  sale_price, purchase_price,
  property_taxes, mgmt_pct, vacancy_pct, maintenance_pct,
  property_value, opex_inflation_rate, rent_growth_rate
FROM public.properties;

CREATE OR REPLACE VIEW public.v_mortgages AS
SELECT m.*, p.alias, p.name, p.address
FROM public.mortgages m
LEFT JOIN public.properties p ON p.id = m.property_id;

-- ---------- PostgREST cache refresh ----------
NOTIFY pgrst, 'reload schema';

-- ===========================
-- (OPTIONAL) DESTRUCTIVE RESET
-- Uncomment to wipe and rebuild. USE WITH CARE!
-- DROP VIEW IF EXISTS public.v_mortgages;
-- DROP VIEW IF EXISTS public.v_properties;
-- DROP TABLE IF EXISTS public.expenses;
-- DROP TABLE IF EXISTS public.mortgages;
-- DROP TABLE IF EXISTS public.leases;
-- DROP TABLE IF EXISTS public.units;
-- DROP TABLE IF EXISTS public.tenants;
-- DROP TABLE IF EXISTS public.properties;
-- THEN re-run the Bootstrap section above.
-- ===========================

-- ---------- (OPTIONAL) SEED EXAMPLES ----------
-- INSERT INTO public.properties (alias, name, address, sale_price) VALUES
--   ('Maple Duplex','Maple Duplex','123 Maple St', 350000),
--   ('Cedar Fourplex','Cedar Fourplex','45 Cedar Ave', 725000)
-- ON CONFLICT DO NOTHING;
