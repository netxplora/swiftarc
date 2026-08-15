-- =====================================================
-- SwiftArc Admin Backend Phase 2: CMS, Drivers, Fleet
-- =====================================================

-- 1. CMS Pages
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft', 'Archived')),
  author TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basic Seed for CMS
INSERT INTO public.cms_pages (title, slug, status, author, views) VALUES
  ('Landing Home Page', '/', 'Published', 'Admin', 12450),
  ('About Us & Global Network', '/about', 'Published', 'Content Team', 3280),
  ('Customs & International Regulations', '/customs', 'Published', 'Legal', 1940),
  ('Terms of Service', '/terms', 'Published', 'Legal', 890),
  ('Privacy Policy', '/privacy', 'Published', 'Legal', 720),
  ('Shipping Rates & Calculator', '/rates', 'Published', 'Product', 5610),
  ('Holiday Shipping Guide 2026', '/resources/holiday', 'Draft', 'Content Team', 0)
ON CONFLICT (slug) DO NOTHING;

-- 2. Drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  deliveries INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Off Duty' CHECK (status IN ('On Duty', 'In Transit', 'Off Duty')),
  zone TEXT NOT NULL DEFAULT 'Unassigned',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Fleet Vehicles
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'In Transit', 'Maintenance')),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  fuel_level INTEGER NOT NULL DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
  location TEXT NOT NULL DEFAULT 'Depot',
  mileage INTEGER NOT NULL DEFAULT 0,
  next_service_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_cms" ON public.cms_pages FOR SELECT USING (status = 'Published');
CREATE POLICY "admin_all_cms" ON public.cms_pages FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT SELECT ON public.cms_pages TO anon;

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;

ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_fleet" ON public.fleet_vehicles FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_vehicles TO authenticated;
