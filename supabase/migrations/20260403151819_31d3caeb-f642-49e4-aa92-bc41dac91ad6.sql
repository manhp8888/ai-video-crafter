
ALTER TABLE public.premium_activations 
ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.premium_codes 
ADD COLUMN premium_days INTEGER NOT NULL DEFAULT 30;
