-- Add vacancy rate to leases table
ALTER TABLE public.leases 
ADD COLUMN vacancy_rate numeric DEFAULT 5.0;

-- Create mortgages table
CREATE TABLE public.mortgages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  loan_name text NOT NULL DEFAULT 'Primary Mortgage',
  principal numeric NOT NULL,
  interest_rate numeric NOT NULL,
  term_months integer NOT NULL,
  start_date date NOT NULL,
  monthly_payment numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on mortgages
ALTER TABLE public.mortgages ENABLE ROW LEVEL SECURITY;

-- RLS policies for mortgages
CREATE POLICY "Public can view mortgages" ON public.mortgages
FOR SELECT USING (true);

CREATE POLICY "Public can insert mortgages" ON public.mortgages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update mortgages" ON public.mortgages
FOR UPDATE USING (true);

CREATE POLICY "Public can delete mortgages" ON public.mortgages
FOR DELETE USING (true);

-- Add property value to properties table
ALTER TABLE public.properties
ADD COLUMN property_value numeric DEFAULT 0,
ADD COLUMN opex_inflation_rate numeric DEFAULT 2.5;