-- =====================================================
-- SwiftArc Admin Backend: pricing_rules, system_settings, audit_logs
-- =====================================================

-- 1. Pricing Rules (single-row config table)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  per_km_rate NUMERIC(10,4) NOT NULL DEFAULT 1.85,
  per_kg_rate NUMERIC(10,4) NOT NULL DEFAULT 2.50,
  surge_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.15,
  insurance_rate NUMERIC(5,2) NOT NULL DEFAULT 0.80,
  hazmat_surcharge NUMERIC(10,2) NOT NULL DEFAULT 45.00,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 7.50,
  carbon_offset_per_km_kg NUMERIC(10,6) NOT NULL DEFAULT 0.001,
  signature_fee NUMERIC(10,2) NOT NULL DEFAULT 4.50,
  -- Vehicle category overrides stored as JSONB
  vehicle_rates JSONB NOT NULL DEFAULT '{
    "bike":      {"base": 12.0, "perKm": 1.2, "perKg": 1.0, "maxWt": 25},
    "van":       {"base": 28.0, "perKm": 1.8, "perKg": 1.5, "maxWt": 500},
    "box_truck": {"base": 75.0, "perKm": 2.8, "perKg": 2.2, "maxWt": 2500},
    "freight_semi": {"base": 180.0, "perKm": 4.5, "perKg": 3.0, "maxWt": 20000}
  }'::jsonb,
  zone_multipliers JSONB NOT NULL DEFAULT '{
    "urban": 1.00,
    "suburban": 1.15,
    "regional": 1.35,
    "international": 1.80
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed with defaults
INSERT INTO public.pricing_rules (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS: only admins can read/write (enforced at server level, but add basic policy)
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_pricing_rules" ON public.pricing_rules
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, UPDATE ON public.pricing_rules TO authenticated;


-- 2. System Settings (key-value store)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed defaults
INSERT INTO public.system_settings (key, value, description) VALUES
  ('rate_limit',       '120',                    'Max API calls per minute per client'),
  ('session_timeout',  '60',                     'Idle session expiry in minutes'),
  ('enforce_2fa',      'false',                  'Require 2FA for all admin accounts'),
  ('ip_allowlist',     '',                       'Comma-separated IP allowlist (empty = all)'),
  ('email_sender',     'noreply@swiftarc.com',   'System email sender address'),
  ('webhook_url',      '',                       'External webhook endpoint URL'),
  ('alert_threshold',  '95',                     'SLA alert threshold percentage'),
  ('maintenance_mode', 'false',                  'Enable site-wide maintenance mode'),
  ('default_currency', 'USD',                    'Default platform currency'),
  ('timezone',         'UTC',                    'System timezone')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_system_settings" ON public.system_settings
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, UPDATE, INSERT ON public.system_settings TO authenticated;


-- 3. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target TEXT,
  details JSONB,
  ip TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs (severity);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_logs" ON public.audit_logs
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
