-- Migration to allow public read access to shipment_events and shipments for tracking purposes
-- This enables the realtime subscription on tracking.$trackingId.tsx to work for anonymous users

DROP POLICY IF EXISTS "public shipments select" ON public.shipments;
CREATE POLICY "public shipments select" ON public.shipments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public shipment events select" ON public.shipment_events;
CREATE POLICY "public shipment events select" ON public.shipment_events
  FOR SELECT USING (true);
