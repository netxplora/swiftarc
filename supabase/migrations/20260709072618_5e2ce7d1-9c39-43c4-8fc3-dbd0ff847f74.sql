
-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  contact_name text NOT NULL,
  company text,
  phone text,
  email text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  region text,
  postal_code text NOT NULL,
  country_code text NOT NULL DEFAULT 'US',
  is_default_sender boolean NOT NULL DEFAULT false,
  is_default_recipient boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses all" ON public.addresses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER addresses_touch BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE INDEX addresses_user_idx ON public.addresses(user_id);

-- SHIPMENTS
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'label_created',
  service text NOT NULL,
  origin jsonb NOT NULL,
  destination jsonb NOT NULL,
  package jsonb NOT NULL,
  declared_value numeric(12,2) NOT NULL DEFAULT 0,
  insurance boolean NOT NULL DEFAULT false,
  signature_required boolean NOT NULL DEFAULT false,
  notes text,
  estimated_delivery date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shipments all" ON public.shipments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER shipments_touch BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE INDEX shipments_user_idx ON public.shipments(user_id);

-- SHIPMENT EVENTS
CREATE TABLE public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  description text NOT NULL,
  location text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shipment events all" ON public.shipment_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.user_id = auth.uid()));
CREATE INDEX shipment_events_shipment_idx ON public.shipment_events(shipment_id);

-- INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number text NOT NULL,
  issue_date date NOT NULL DEFAULT (now()::date),
  due_date date NOT NULL DEFAULT ((now() + interval '14 days')::date),
  status text NOT NULL DEFAULT 'sent',
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices all" ON public.invoices
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER invoices_touch BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE INDEX invoices_user_idx ON public.invoices(user_id);

-- Tracking number generator (SA + 10 digits), unique
CREATE OR REPLACE FUNCTION public.gen_tracking_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  n text;
  tries int := 0;
BEGIN
  LOOP
    n := 'SA' || lpad((floor(random() * 10000000000))::bigint::text, 10, '0');
    IF NOT EXISTS (SELECT 1 FROM public.shipments WHERE tracking_number = n) THEN
      RETURN n;
    END IF;
    tries := tries + 1;
    IF tries > 8 THEN
      RAISE EXCEPTION 'Could not allocate tracking number';
    END IF;
  END LOOP;
END; $$;
