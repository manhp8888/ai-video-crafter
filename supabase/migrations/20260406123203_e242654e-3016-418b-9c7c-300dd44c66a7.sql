
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS stock integer DEFAULT -1;
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS sales_count integer DEFAULT 0;
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS details text;
