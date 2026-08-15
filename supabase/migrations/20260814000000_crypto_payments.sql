-- =====================================================
-- SwiftArc Customs Clearance Payments & Crypto Integration
-- =====================================================

-- 1. Digital Currency Assets
CREATE TABLE IF NOT EXISTS public.digital_currency_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  qr_code_url TEXT,
  min_payment_amount NUMERIC(18,8) DEFAULT 0,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_currency_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_assets" ON public.digital_currency_assets;
CREATE POLICY "public_read_assets" ON public.digital_currency_assets FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "service_role_assets" ON public.digital_currency_assets;
CREATE POLICY "service_role_assets" ON public.digital_currency_assets FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.digital_currency_assets TO authenticated, anon;
GRANT ALL ON public.digital_currency_assets TO service_role;


-- 2. Crypto Purchase Providers
CREATE TABLE IF NOT EXISTS public.crypto_purchase_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  supported_countries TEXT,
  supported_assets TEXT,
  supported_networks TEXT,
  instructions TEXT,
  customer_facing_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_purchase_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_providers" ON public.crypto_purchase_providers;
CREATE POLICY "public_read_providers" ON public.crypto_purchase_providers FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "service_role_providers" ON public.crypto_purchase_providers;
CREATE POLICY "service_role_providers" ON public.crypto_purchase_providers FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.crypto_purchase_providers TO authenticated, anon;
GRANT ALL ON public.crypto_purchase_providers TO service_role;


-- 3. Enhance Customs Holds (Clearance Cases)
-- Update the status check constraint
ALTER TABLE public.customs_holds DROP CONSTRAINT IF EXISTS customs_holds_status_check;
ALTER TABLE public.customs_holds ADD CONSTRAINT customs_holds_status_check CHECK (
  status IN (
    'open', 
    'awaiting_documents', 
    'payment_required', 
    'payment_submitted', 
    'payment_verification', 
    'under_review', 
    'clearance_processing', 
    'cleared', 
    'released', 
    'escalated', 
    'closed'
  )
);
ALTER TABLE public.customs_holds ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'awaiting_payment', 'payment_submitted', 'verification_required', 'confirming', 'paid', 'underpaid', 'overpaid', 'failed', 'expired', 'rejected', 'refund_required'));


-- 4. Payment Quotes
CREATE TABLE IF NOT EXISTS public.payment_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customs_hold_id UUID NOT NULL REFERENCES public.customs_holds(id) ON DELETE CASCADE,
  fiat_amount NUMERIC(12,2) NOT NULL,
  fiat_currency TEXT NOT NULL DEFAULT 'USD',
  crypto_amount NUMERIC(18,8) NOT NULL,
  crypto_asset_id UUID NOT NULL REFERENCES public.digital_currency_assets(id) ON DELETE RESTRICT,
  exchange_rate NUMERIC(18,8) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_quotes_read" ON public.payment_quotes;
CREATE POLICY "customer_quotes_read" ON public.payment_quotes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "service_role_quotes" ON public.payment_quotes;
CREATE POLICY "service_role_quotes" ON public.payment_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.payment_quotes TO authenticated;
GRANT ALL ON public.payment_quotes TO service_role;


-- 5. Payment Submissions (Verification workflow)
CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_quote_id UUID REFERENCES public.payment_quotes(id) ON DELETE SET NULL,
  customs_hold_id UUID NOT NULL REFERENCES public.customs_holds(id) ON DELETE CASCADE,
  transaction_hash TEXT NOT NULL,
  network TEXT NOT NULL,
  amount_claimed NUMERIC(18,8) NOT NULL,
  crypto_asset_id UUID REFERENCES public.digital_currency_assets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'verification_required'
    CHECK (status IN ('verification_required', 'verified', 'rejected', 'underpaid', 'overpaid')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_submissions_read" ON public.payment_submissions;
CREATE POLICY "customer_submissions_read" ON public.payment_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "service_role_submissions" ON public.payment_submissions;
CREATE POLICY "service_role_submissions" ON public.payment_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.payment_submissions TO authenticated;
GRANT ALL ON public.payment_submissions TO service_role;


-- 6. Payment Audit Logs
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  previous_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_audit_logs" ON public.payment_audit_logs;
CREATE POLICY "service_role_audit_logs" ON public.payment_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.payment_audit_logs TO service_role;
