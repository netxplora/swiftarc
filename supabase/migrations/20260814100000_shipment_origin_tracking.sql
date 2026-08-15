-- =====================================================
-- SwiftArc GPS Origin & Server-Side Tracking Number
-- =====================================================

-- 1. Add shipment origin tracking columns
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS origin_source TEXT DEFAULT 'manual'
    CHECK (origin_source IN ('gps', 'branch', 'manual', 'map_adjustment')),
  ADD COLUMN IF NOT EXISTS origin_branch_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin_accuracy_m NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS estimated_travel_time TEXT,
  ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12,2) DEFAULT 0;

-- 2. Server-side tracking number generator (collision-resistant)
CREATE OR REPLACE FUNCTION public.gen_swf_tracking()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT;
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    result := 'SWF-';
    FOR i IN 1..12 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.shipments WHERE tracking_number = result) THEN
      RETURN result;
    END IF;
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique tracking number after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Grant execute to service_role only
REVOKE ALL ON FUNCTION public.gen_swf_tracking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gen_swf_tracking() TO service_role;
