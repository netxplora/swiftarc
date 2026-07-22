-- Fix missing user_id in payment_transactions during shipment booking RPC
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
  p_volumetric_weight NUMERIC DEFAULT NULL
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
        is_hazmat, volumetric_weight
      ) VALUES (
        p_user_id, v_tracking_number, 'pending_payment', p_service, p_origin, p_destination,
        p_package, p_declared_value, p_insurance, p_signature_required, p_notes, p_estimated_delivery,
        p_is_hazmat, p_volumetric_weight
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

  -- Insert notification
  INSERT INTO public.notifications (
    user_id, title, body, category, tone
  ) VALUES (
    p_user_id, 
    'Shipment created — payment required', 
    v_tracking_number || ' · ' || p_service || ' · Total: $' || p_total_amount::text,
    'payment', 
    'default'
  );

  -- Return results as JSON
  RETURN jsonb_build_object(
    'trackingNumber', v_tracking_number,
    'id', v_shipment_id,
    'transactionId', v_transaction_id,
    'amount', p_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
