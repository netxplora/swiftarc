REVOKE EXECUTE ON FUNCTION public.get_pickup_slot_counts(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pickup_slot_counts(date) TO service_role;