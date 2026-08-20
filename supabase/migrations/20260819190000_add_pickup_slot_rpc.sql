-- RPC: get_pickup_slot_counts
-- Returns how many pickups are booked per slot for a given date.
-- Used by getPickupSlots (availability) and createPickup (capacity check).
CREATE OR REPLACE FUNCTION public.get_pickup_slot_counts(target_date DATE)
RETURNS TABLE(slot TEXT, cnt BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.slot,
    COUNT(*)::BIGINT AS cnt
  FROM public.pickups p
  WHERE p.pickup_date = target_date
    AND p.status NOT IN ('cancelled')
  GROUP BY p.slot;
$$;

-- Grant execute to authenticated and anon so the server functions can call it
GRANT EXECUTE ON FUNCTION public.get_pickup_slot_counts(DATE) TO authenticated, anon, service_role;
