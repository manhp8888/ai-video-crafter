
-- Add balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance integer NOT NULL DEFAULT 0;

-- Marketplace products table
CREATE TABLE public.marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'prompt',
  image_url text,
  content text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products" ON public.marketplace_products
  FOR SELECT USING (is_active = true);

-- Admin can manage via edge function (service role)

-- User purchases table
CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.user_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.user_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Balance top-up history
CREATE TABLE public.balance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL DEFAULT 'topup',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.balance_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
