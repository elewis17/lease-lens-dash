-- Create enum types
CREATE TYPE public.payment_status AS ENUM ('paid', 'overdue', 'pending');
CREATE TYPE public.lease_status AS ENUM ('active', 'expiring', 'expired', 'vacant');
CREATE TYPE public.maintenance_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.expense_category AS ENUM ('repairs', 'pm', 'tax', 'insurance', 'capex', 'utilities', 'hoa', 'advertising', 'other');

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  mortgage_payment DECIMAL(10,2) DEFAULT 0,
  total_units INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Units table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  unit_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leases table
CREATE TABLE public.leases (
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
  status lease_status DEFAULT 'active',
  doc_url TEXT,
  parsed_json JSONB,
  confidence_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category expense_category NOT NULL,
  memo TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Maintenance table
CREATE TABLE public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status maintenance_status DEFAULT 'pending',
  images TEXT[],
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for MVP - no auth yet)
CREATE POLICY "Public can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Public can insert properties" ON public.properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update properties" ON public.properties FOR UPDATE USING (true);

CREATE POLICY "Public can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Public can insert units" ON public.units FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update units" ON public.units FOR UPDATE USING (true);

CREATE POLICY "Public can view tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Public can insert tenants" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update tenants" ON public.tenants FOR UPDATE USING (true);

CREATE POLICY "Public can view leases" ON public.leases FOR SELECT USING (true);
CREATE POLICY "Public can insert leases" ON public.leases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update leases" ON public.leases FOR UPDATE USING (true);

CREATE POLICY "Public can view payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Public can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update payments" ON public.payments FOR UPDATE USING (true);

CREATE POLICY "Public can view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update expenses" ON public.expenses FOR UPDATE USING (true);

CREATE POLICY "Public can view maintenance" ON public.maintenance FOR SELECT USING (true);
CREATE POLICY "Public can insert maintenance" ON public.maintenance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update maintenance" ON public.maintenance FOR UPDATE USING (true);

-- Seed demo data
INSERT INTO public.properties (id, address, mortgage_payment, total_units) VALUES
('11111111-1111-1111-1111-111111111111', '123 Main St, San Francisco, CA 94102', 2500.00, 3);

INSERT INTO public.units (id, property_id, unit_label) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Unit A'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Unit B'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Unit C');

INSERT INTO public.tenants (id, name, email, phone) VALUES
('55555555-5555-5555-5555-555555555555', 'John Smith', 'john@example.com', '555-0101'),
('66666666-6666-6666-6666-666666666666', 'Sarah Johnson', 'sarah@example.com', '555-0102');

INSERT INTO public.leases (id, unit_id, tenant_id, start_date, end_date, monthly_rent, deposit, status) VALUES
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', '2024-01-01', '2025-01-01', 2200.00, 4400.00, 'active'),
('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '2024-03-01', '2024-12-15', 2000.00, 4000.00, 'expiring');

INSERT INTO public.payments (lease_id, due_date, amount_due, paid_amount, paid_date, payment_method, status) VALUES
('77777777-7777-7777-7777-777777777777', CURRENT_DATE, 2200.00, 2200.00, CURRENT_DATE, 'Bank Transfer', 'paid'),
('88888888-8888-8888-8888-888888888888', CURRENT_DATE - INTERVAL '7 days', 2000.00, 0, NULL, NULL, 'overdue');

INSERT INTO public.expenses (property_id, date, amount, category, memo) VALUES
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '10 days', 350.00, 'repairs', 'Plumber - Fixed leak in Unit A'),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', 45.00, 'repairs', 'HVAC filters replacement');

INSERT INTO public.maintenance (unit_id, title, description, status, category) VALUES
('22222222-2222-2222-2222-222222222222', 'Leaky faucet', 'Kitchen faucet dripping', 'completed', 'Plumbing'),
('33333333-3333-3333-3333-333333333333', 'HVAC not cooling', 'Air conditioner not working properly', 'in_progress', 'HVAC');