
-- Function to increment premium code usage (called after activation)
CREATE OR REPLACE FUNCTION public.increment_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.premium_codes
  SET current_uses = current_uses + 1
  WHERE id = NEW.code_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_premium_activation
  AFTER INSERT ON public.premium_activations
  FOR EACH ROW EXECUTE FUNCTION public.increment_code_usage();
