-- Create pickups table
CREATE TABLE IF NOT EXISTS public.pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reference TEXT UNIQUE NOT NULL,
    contact_name TEXT NOT NULL,
    company TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    instructions TEXT,
    pickup_date DATE NOT NULL,
    slot TEXT NOT NULL,
    package_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_pickups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pickups_updated_at ON public.pickups;
CREATE TRIGGER pickups_updated_at
BEFORE UPDATE ON public.pickups
FOR EACH ROW
EXECUTE FUNCTION set_pickups_updated_at();

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_pickups_user_id ON public.pickups(user_id);
CREATE INDEX IF NOT EXISTS idx_pickups_date ON public.pickups(pickup_date);

-- Enable RLS
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own pickups
DROP POLICY IF EXISTS "Users can read own pickups" ON public.pickups;
CREATE POLICY "Users can read own pickups" ON public.pickups
FOR SELECT USING (
    auth.uid() = user_id
);

-- Policy 2: Users can insert their own pickups
DROP POLICY IF EXISTS "Users can insert own pickups" ON public.pickups;
CREATE POLICY "Users can insert own pickups" ON public.pickups
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL
);

-- Policy 3: Users can update their own pickups
DROP POLICY IF EXISTS "Users can update own pickups" ON public.pickups;
CREATE POLICY "Users can update own pickups" ON public.pickups
FOR UPDATE USING (
    auth.uid() = user_id
);

-- Policy 4: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all pickups" ON public.pickups;
CREATE POLICY "Admins can manage all pickups" ON public.pickups
FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
