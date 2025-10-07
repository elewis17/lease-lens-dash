-- Add purchase_price and rent_growth_rate to properties table
ALTER TABLE public.properties 
ADD COLUMN purchase_price numeric DEFAULT 0,
ADD COLUMN rent_growth_rate numeric DEFAULT 3.0;

-- Update the demo property with realistic values
UPDATE public.properties 
SET purchase_price = 750000, 
    rent_growth_rate = 3.0
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Add RLS policy for deleting leases
CREATE POLICY "Public can delete leases" 
ON public.leases 
FOR DELETE 
USING (true);

-- Add RLS policy for deleting expenses
CREATE POLICY "Public can delete expenses" 
ON public.expenses 
FOR DELETE 
USING (true);