-- =====================================================
-- SwiftArc Backend Phase 3: Customs & HS Codes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hs_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Seed with common commodities
INSERT INTO public.hs_codes (code, description, category) VALUES
  ('8517.13.00', 'Smartphones', 'Electronics'),
  ('8517.62.00', 'Machines for the reception, conversion and transmission or regeneration of voice, images or other data', 'Electronics'),
  ('8528.52.00', 'Monitors capable of directly connecting to and designed for use with an automatic data processing machine', 'Electronics'),
  ('6109.10.00', 'T-shirts, singlets and other vests, knitted or crocheted, of cotton', 'Apparel'),
  ('6203.42.40', 'Men''s or boys'' trousers, bib and brace overalls, breeches and shorts, of cotton', 'Apparel'),
  ('6403.99.90', 'Footwear with outer soles of rubber, plastics, leather or composition leather and uppers of leather', 'Apparel'),
  ('4202.92.30', 'Travel, sports, and similar bags with outer surface of textile materials', 'Accessories'),
  ('9102.11.00', 'Wrist-watches, electrically operated, whether or not incorporating a stop-watch facility', 'Jewelry'),
  ('3304.99.50', 'Beauty or make-up preparations and preparations for the care of the skin (other than medicaments)', 'Cosmetics'),
  ('3303.00.10', 'Perfumes and toilet waters, not containing alcohol', 'Cosmetics'),
  ('4901.99.00', 'Printed books, brochures, leaflets and similar printed matter', 'Books'),
  ('9503.00.00', 'Tricycles, scooters, pedal cars and similar wheeled toys; dolls'' carriages; dolls; other toys', 'Toys'),
  ('9403.50.90', 'Wooden furniture of a kind used in the bedroom', 'Home Goods'),
  ('6302.21.00', 'Printed bed linen, of cotton', 'Home Goods'),
  ('8471.30.01', 'Portable automatic data processing machines, weighing not more than 10 kg, consisting of at least a central processing unit, a keyboard and a display', 'Electronics'),
  ('8471.41.01', 'Other automatic data processing machines, comprising in the same housing at least a central processing unit and an input and output unit', 'Electronics'),
  ('8544.42.20', 'Electric conductors, for a voltage not exceeding 1,000 V, fitted with connectors', 'Electronics'),
  ('9004.10.00', 'Sunglasses', 'Accessories'),
  ('7113.19.21', 'Articles of jewellery and parts thereof, of gold', 'Jewelry'),
  ('3004.90.91', 'Medicaments consisting of mixed or unmixed products for therapeutic or prophylactic uses', 'Medical')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.hs_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_hs_codes" ON public.hs_codes FOR SELECT USING (true);
GRANT SELECT ON public.hs_codes TO anon, authenticated;

-- Add customs_info to shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS customs_info JSONB;

-- Update create_shipment_with_payment to support customs_info
CREATE OR REPLACE FUNCTION public.create_shipment_with_payment(
  p_user_id UUID,
  p_service TEXT,
  p_origin JSONB,
  p_destination JSONB,
  p_package JSONB,
  p_declared_value NUMERIC,
  p_insurance BOOLEAN,
  p_signature_required BOOLEAN,
  p_notes TEXT,
  p_estimated_delivery DATE,
  p_total_amount NUMERIC,
  p_is_hazmat BOOLEAN DEFAULT false,
  p_volumetric_weight NUMERIC DEFAULT NULL,
  p_customs_info JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_tracking_number TEXT;
  v_pay_ref TEXT;
  v_shipment_id UUID;
  v_transaction_id UUID;
  v_retry_count INT := 0;
  v_max_retries INT := 10;
  v_inserted BOOLEAN := false;
BEGIN
  -- Generate unique tracking number with retry loop
  WHILE NOT v_inserted AND v_retry_count < v_max_retries LOOP
    v_tracking_number := 'SA' || lpad(floor(random() * 10000000000)::text, 10, '0');
    BEGIN
      INSERT INTO public.shipments (
        user_id, tracking_number, status, service, origin, destination,
        package, declared_value, insurance, signature_required, notes, estimated_delivery,
        is_hazmat, volumetric_weight, customs_info
      ) VALUES (
        p_user_id, v_tracking_number, 'pending_payment', p_service, p_origin, p_destination,
        p_package, p_declared_value, p_insurance, p_signature_required, p_notes, p_estimated_delivery,
        p_is_hazmat, p_volumetric_weight, p_customs_info
      ) RETURNING id INTO v_shipment_id;
      v_inserted := true;
    EXCEPTION WHEN unique_violation THEN
      v_retry_count := v_retry_count + 1;
    END;
  END LOOP;

  IF NOT v_inserted THEN
    RAISE EXCEPTION 'Could not allocate a unique tracking number after % attempts', v_max_retries;
  END IF;

  -- Generate unique payment reference
  v_inserted := false;
  v_retry_count := 0;
  WHILE NOT v_inserted AND v_retry_count < v_max_retries LOOP
    v_pay_ref := 'PAY-' || floor(100000 + random() * 900000)::text;
    BEGIN
      INSERT INTO public.payment_transactions (
        shipment_id, user_id, method, amount, currency, reference, status
      ) VALUES (
        v_shipment_id, p_user_id, 'pending', p_total_amount, 'USD', v_pay_ref, 'pending'
      ) RETURNING id INTO v_transaction_id;
      v_inserted := true;
    EXCEPTION WHEN unique_violation THEN
      v_retry_count := v_retry_count + 1;
    END;
  END LOOP;

  IF NOT v_inserted THEN
    RAISE EXCEPTION 'Could not allocate a unique payment reference after % attempts', v_max_retries;
  END IF;

  RETURN jsonb_build_object(
    'id', v_shipment_id,
    'trackingNumber', v_tracking_number,
    'transactionId', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
