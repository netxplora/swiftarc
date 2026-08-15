-- =====================================================
-- SwiftArc Admin-Only Shipment Workflow Migration
-- Locks down customer shipment creation, adds customs
-- holds, locations, verification, and payment ledger
-- =====================================================

-- =====================================================
-- 1. LOCK DOWN CUSTOMER SHIPMENT CREATION
-- =====================================================

-- Drop the old customer-facing RLS policies that allow INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "own shipments all" ON public.shipments;
DROP POLICY IF EXISTS "own shipment events all" ON public.shipment_events;

-- Customers can only READ their own shipments
CREATE POLICY "customer_shipments_read"
  ON public.shipments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role (admin backend) has full access
DROP POLICY IF EXISTS "service_role_shipments" ON public.shipments;
CREATE POLICY "service_role_shipments"
  ON public.shipments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Keep the public tracking read policy (already exists from 20260717000000)
-- DROP POLICY IF EXISTS "public shipments select" ON public.shipments; -- keep it

-- Revoke INSERT/UPDATE/DELETE from authenticated on shipments
REVOKE INSERT, UPDATE, DELETE ON public.shipments FROM authenticated;
-- Keep SELECT for authenticated users
GRANT SELECT ON public.shipments TO authenticated;
-- Keep full access for service_role
GRANT ALL ON public.shipments TO service_role;

-- Shipment events: customers can only read events for their shipments
CREATE POLICY "customer_shipment_events_read"
  ON public.shipment_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.user_id = auth.uid()));

-- Service role full access to events
DROP POLICY IF EXISTS "service_role_events" ON public.shipment_events;
CREATE POLICY "service_role_events"
  ON public.shipment_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.shipment_events FROM authenticated;
GRANT SELECT ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;

-- =====================================================
-- 2. ADD VERIFICATION STATUS TO SHIPMENTS
-- =====================================================

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'requires_review', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receiver_info JSONB,
  ADD COLUMN IF NOT EXISTS route_stops JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- 3. LOCATIONS TABLE (Stops, Branches, Customs)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'branch'
    CHECK (type IN ('branch', 'hub', 'customs_facility', 'distribution_center', 'drop_off', 'pickup_point', 'port', 'airport', 'warehouse')),
  country TEXT NOT NULL,
  state TEXT,
  city TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_customs_facility BOOLEAN NOT NULL DEFAULT false,
  is_distribution_hub BOOLEAN NOT NULL DEFAULT false,
  operational_hours TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
-- Anyone can read active locations (for tracking display)
CREATE POLICY "public_read_locations" ON public.locations
  FOR SELECT USING (is_active = true);
-- Service role manages
CREATE POLICY "service_role_locations" ON public.locations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.locations TO authenticated, anon;
GRANT ALL ON public.locations TO service_role;

-- Seed some default locations
INSERT INTO public.locations (name, type, country, state, city, address, is_customs_facility, is_distribution_hub) VALUES
  ('SwiftArc HQ', 'branch', 'Nigeria', 'Lagos', 'Lagos', '15 Marina Road, Lagos Island', false, true),
  ('SwiftArc Abuja Office', 'branch', 'Nigeria', 'FCT', 'Abuja', '42 Aguiyi Ironsi Street, Maitama', false, false),
  ('SwiftArc Port Harcourt', 'branch', 'Nigeria', 'Rivers', 'Port Harcourt', '8 Aba Road, GRA Phase 2', false, false),
  ('Apapa Customs Terminal', 'customs_facility', 'Nigeria', 'Lagos', 'Apapa', 'Wharf Road, Apapa', true, false),
  ('Murtala Muhammed Int''l Airport', 'airport', 'Nigeria', 'Lagos', 'Ikeja', 'MMIA Cargo Terminal', true, true),
  ('London Heathrow Hub', 'airport', 'United Kingdom', 'Greater London', 'London', 'Heathrow Airport, TW6', true, true),
  ('JFK International Hub', 'airport', 'United States', 'New York', 'New York', 'JFK Airport, Jamaica, NY 11430', true, true),
  ('Dubai Logistics Hub', 'hub', 'United Arab Emirates', 'Dubai', 'Dubai', 'Jebel Ali Free Zone', true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CUSTOMS HOLDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customs_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  -- Hold details
  customs_authority TEXT,
  customs_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  hold_reason TEXT NOT NULL,
  hold_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Required actions
  required_documents TEXT,
  declared_goods TEXT,
  required_action TEXT,
  -- Financial
  amount_due NUMERIC(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  charge_category TEXT CHECK (charge_category IN (
    'customs_clearance', 'customs_duty', 'inspection_fee',
    'government_assessment', 'storage_fee', 'documentation_fee', 'other'
  )),
  -- Payer assignment
  payment_responsibility TEXT DEFAULT 'pending'
    CHECK (payment_responsibility IN ('sender', 'receiver', 'third_party', 'swiftarc', 'pending')),
  payer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Payment linkage
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  -- Deadline
  deadline TIMESTAMPTZ,
  -- Status
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'awaiting_documents', 'payment_required', 'under_review', 'cleared', 'released', 'escalated', 'closed')),
  -- Admin
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customs_holds ENABLE ROW LEVEL SECURITY;
-- Customers can see customs holds for their shipments
CREATE POLICY "customer_customs_holds_read" ON public.customs_holds
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.user_id = auth.uid()));
-- Public tracking can see holds
CREATE POLICY "public_customs_holds_read" ON public.customs_holds
  FOR SELECT TO anon USING (true);
-- Service role manages
CREATE POLICY "service_role_customs_holds" ON public.customs_holds
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.customs_holds TO authenticated, anon;
GRANT ALL ON public.customs_holds TO service_role;

CREATE INDEX idx_customs_holds_shipment ON public.customs_holds(shipment_id);
CREATE INDEX idx_customs_holds_status ON public.customs_holds(status);

-- =====================================================
-- 5. ENHANCE PAYMENT TRANSACTIONS
-- =====================================================

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS charge_type TEXT DEFAULT 'shipping_fee'
    CHECK (charge_type IN (
      'shipping_fee', 'customs_clearance', 'customs_duty',
      'inspection_fee', 'government_assessment', 'storage_fee',
      'documentation_fee', 'insurance_fee', 'surcharge', 'other'
    )),
  ADD COLUMN IF NOT EXISTS payment_responsibility TEXT DEFAULT 'sender'
    CHECK (payment_responsibility IN ('sender', 'receiver', 'third_party', 'swiftarc', 'pending')),
  ADD COLUMN IF NOT EXISTS payer_name TEXT,
  ADD COLUMN IF NOT EXISTS customs_hold_id UUID REFERENCES public.customs_holds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supporting_reason TEXT;

-- =====================================================
-- 6. RESTRICT THE BOOKING RPC
-- =====================================================

-- Revoke customer ability to call the RPC directly
-- The RPC is SECURITY DEFINER so we revoke EXECUTE from authenticated
REVOKE EXECUTE ON FUNCTION public.create_shipment_with_payment(
  UUID, TEXT, JSONB, JSONB, JSONB, NUMERIC, BOOLEAN, BOOLEAN, TEXT, DATE, NUMERIC, BOOLEAN, NUMERIC
) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_shipment_with_payment(
  UUID, TEXT, JSONB, JSONB, JSONB, NUMERIC, BOOLEAN, BOOLEAN, TEXT, DATE, NUMERIC, BOOLEAN, NUMERIC
) FROM anon;
-- Only service_role can call it now
GRANT EXECUTE ON FUNCTION public.create_shipment_with_payment(
  UUID, TEXT, JSONB, JSONB, JSONB, NUMERIC, BOOLEAN, BOOLEAN, TEXT, DATE, NUMERIC, BOOLEAN, NUMERIC
) TO service_role;

-- =====================================================
-- 7. SHIPMENT SERVICES TABLE (configurable, not hard-coded)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shipment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  estimated_days_min INT,
  estimated_days_max INT,
  is_international BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipment_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_services" ON public.shipment_services
  FOR SELECT USING (is_active = true);
CREATE POLICY "service_role_services" ON public.shipment_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.shipment_services TO authenticated, anon;
GRANT ALL ON public.shipment_services TO service_role;

INSERT INTO public.shipment_services (name, description, estimated_days_min, estimated_days_max, is_international, sort_order) VALUES
  ('Standard Delivery', 'Regular domestic delivery service', 3, 7, false, 1),
  ('Express Delivery', 'Fast domestic delivery with priority handling', 1, 3, false, 2),
  ('Same Day / Next Day', 'Urgent delivery within 24 hours', 0, 1, false, 3),
  ('International Shipping', 'Worldwide delivery with customs handling', 5, 21, true, 4),
  ('Freight', 'Large cargo and bulk shipments', 7, 30, false, 5),
  ('Special Handling', 'Fragile, hazardous, or temperature-controlled items', 3, 14, false, 6)
ON CONFLICT (name) DO NOTHING;
