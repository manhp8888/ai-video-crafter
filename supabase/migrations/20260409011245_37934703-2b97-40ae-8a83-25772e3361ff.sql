
CREATE TABLE public.product_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_sold BOOLEAN NOT NULL DEFAULT false,
  sold_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all items" ON public.product_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers see their purchased items" ON public.product_items
  FOR SELECT TO authenticated
  USING (sold_to = auth.uid());

CREATE INDEX idx_product_items_product ON public.product_items(product_id);
CREATE INDEX idx_product_items_available ON public.product_items(product_id, is_sold) WHERE NOT is_sold;
