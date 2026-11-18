-- Schema baseline verified against the live catalog. Data and policy changes are separate.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
DO $$ BEGIN
  IF to_regtype('public.payment_status') IS NULL THEN
    CREATE TYPE public.payment_status AS ENUM ('paid', 'overdue', 'pending');
  END IF;
END $$;
DO $$ BEGIN
  IF to_regtype('public.lease_status') IS NULL THEN
    CREATE TYPE public.lease_status AS ENUM ('active', 'expiring', 'expired', 'vacant');
  END IF;
END $$;
DO $$ BEGIN
  IF to_regtype('public.maintenance_status') IS NULL THEN
    CREATE TYPE public.maintenance_status AS ENUM ('pending', 'in_progress', 'completed');
  END IF;
END $$;
DO $$ BEGIN
  IF to_regtype('public.expense_category') IS NULL THEN
    CREATE TYPE public.expense_category AS ENUM ('repairs', 'pm', 'tax', 'insurance', 'capex', 'utilities', 'hoa', 'advertising', 'other');
  END IF;
END $$;

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  address TEXT NOT NULL,
  mortgage_payment DECIMAL(10,2) DEFAULT 0,
  total_units INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  purchase_price NUMERIC DEFAULT 0,
  rent_growth_rate NUMERIC DEFAULT 3.0,
  property_value NUMERIC DEFAULT 0,
  opex_inflation_rate NUMERIC DEFAULT 2.5,
  alias TEXT,
  type TEXT,
  sale_price NUMERIC(12,2),
  property_taxes NUMERIC(12,2),
  mgmt_pct NUMERIC(5,2),
  vacancy_pct NUMERIC(5,2),
  maintenance_pct NUMERIC(5,2),
  user_id UUID REFERENCES auth.users(id),
  insurance NUMERIC
);

-- Units table
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  unit_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leases table
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) DEFAULT 0,
  notice_days INTEGER DEFAULT 60,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  grace_period_days INTEGER DEFAULT 5,
  status public.lease_status DEFAULT 'active',
  doc_url TEXT,
  parsed_json JSONB,
  confidence_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  vacancy_rate NUMERIC DEFAULT 5.0,
  property_id UUID
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  status public.payment_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category public.expense_category NOT NULL,
  memo TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Maintenance table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.maintenance_status DEFAULT 'pending',
  images TEXT[],
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mortgages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  loan_name TEXT NOT NULL DEFAULT 'Primary Mortgage',
  principal NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  monthly_payment NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  principal_original NUMERIC(14,2),
  current_balance NUMERIC(14,2),
  includes_escrow BOOLEAN DEFAULT false
);

DO $$
BEGIN
  IF to_regclass('public.v_properties') IS NULL THEN
    CREATE VIEW public.v_properties AS
    SELECT id, alias, name, address, type, sale_price, purchase_price, property_taxes,
           mgmt_pct, vacancy_pct, maintenance_pct, property_value, opex_inflation_rate, rent_growth_rate
    FROM public.properties;
  END IF;

  IF to_regclass('public.v_mortgages') IS NULL THEN
    CREATE VIEW public.v_mortgages AS
    SELECT m.id, m.property_id, m.loan_name, m.principal, m.interest_rate, m.term_months,
           m.start_date, m.monthly_payment, m.created_at, m.updated_at, p.alias, p.name, p.address
    FROM public.mortgages AS m
    LEFT JOIN public.properties AS p ON p.id = m.property_id;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
