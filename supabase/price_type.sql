-- Add price_type column to hostels
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'monthly' CHECK (price_type IN ('monthly', 'yearly'));

-- Add price_type column to pending_hostels  
ALTER TABLE public.pending_hostels ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'monthly' CHECK (price_type IN ('monthly', 'yearly'));
