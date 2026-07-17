-- Payment System: payment_methods, wallets, payment_transactions
-- Adds pending_payment status support to shipments workflow

-- 1. Payment methods (admin-configurable)
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,           -- 'card', 'bank_transfer', 'crypto'
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read payment methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "service_role manages payment methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.payment_methods TO authenticated, anon;
GRANT ALL ON public.payment_methods TO service_role;

-- Seed default methods
INSERT INTO public.payment_methods (key, label, description, sort_order) VALUES
  ('card', 'Credit / Debit Card', 'Pay securely with Visa, Mastercard, or other major cards.', 1),
  ('bank_transfer', 'Bank Transfer', 'Pay via direct bank transfer. Processing may take 1–3 business days.', 2),
  ('crypto', 'Digital Currency', 'Pay with Bitcoin, Ethereum, USDT, or other supported digital currencies.', 3);

-- 2. Wallets (admin-managed global crypto addresses)
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL,             -- 'BTC', 'ETH', 'USDT', 'SOL', etc.
  network text NOT NULL,              -- 'Bitcoin', 'Ethereum', 'Tron TRC-20', 'Solana', etc.
  address text NOT NULL,
  label text,                         -- e.g. "Main BTC Wallet"
  qr_code_url text,                   -- URL to stored QR image
  instructions text,                  -- Admin-configured payment instructions
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read active wallets" ON public.wallets FOR SELECT USING (status = 'active');
CREATE POLICY "service_role manages wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.wallets TO authenticated, anon;
GRANT ALL ON public.wallets TO service_role;

-- 3. Payment transactions
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL,                -- 'card', 'bank_transfer', 'crypto'
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  -- crypto-specific
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL,
  crypto_currency text,                -- 'BTC', 'ETH', etc.
  crypto_network text,
  crypto_address text,
  crypto_amount text,                  -- string to preserve decimal precision
  -- references
  reference text NOT NULL UNIQUE,      -- 'PAY-XXXXXX'
  -- card / bank
  card_last4 text,
  bank_reference text,
  -- status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','verified','rejected','expired','refunded')),
  admin_note text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  expires_at timestamptz,              -- for crypto payments
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own transactions" ON public.payment_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users insert own transactions" ON public.payment_transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own pending" ON public.payment_transactions FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "service_role manages transactions" ON public.payment_transactions FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

-- Indexes
CREATE INDEX idx_txn_shipment ON public.payment_transactions (shipment_id);
CREATE INDEX idx_txn_user ON public.payment_transactions (user_id);
CREATE INDEX idx_txn_status ON public.payment_transactions (status);
CREATE INDEX idx_txn_reference ON public.payment_transactions (reference);
CREATE INDEX idx_wallets_currency ON public.wallets (currency, network);

-- Trigger: auto-update shipment status when a transaction is verified
CREATE OR REPLACE FUNCTION public.on_payment_verified()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    UPDATE public.shipments
      SET status = 'label_created', updated_at = now()
      WHERE id = NEW.shipment_id AND status = 'pending_payment';

    INSERT INTO public.shipment_events (shipment_id, status, location, notes)
    VALUES (NEW.shipment_id, 'label_created', 'Payment Gateway', 'Payment verified — reference ' || NEW.reference);

    INSERT INTO public.notifications (user_id, title, body, category, tone)
    VALUES (
      NEW.user_id,
      'Payment confirmed',
      'Your payment ' || NEW.reference || ' has been verified. Your shipment label is ready.',
      'payment',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_payment_verified
  AFTER UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_payment_verified();
