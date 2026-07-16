
CREATE OR REPLACE FUNCTION public.get_pickup_slot_counts(target_date date)
RETURNS TABLE(slot text, cnt bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slot, count(*)::bigint AS cnt
  FROM public.pickups
  WHERE pickup_date = target_date
  GROUP BY slot;
$$;

REVOKE ALL ON FUNCTION public.get_pickup_slot_counts(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pickup_slot_counts(date) TO anon, authenticated, service_role;
