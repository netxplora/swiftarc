-- 1. Create Storage Bucket for Package Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'shipment-package-images',
    'shipment-package-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET 
    public = true, 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for shipment-package-images bucket
-- Note: It is public, so anyone can select an object, but we still create a policy for reading just in case.
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'shipment-package-images');

CREATE POLICY "Admin Insert Access" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'shipment-package-images' 
    AND (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

CREATE POLICY "Admin Update Access" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'shipment-package-images' 
    AND (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

CREATE POLICY "Admin Delete Access" ON storage.objects
FOR DELETE USING (
    bucket_id = 'shipment-package-images' 
    AND (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
);


-- 2. Create Relational Table `package_images`
CREATE TABLE IF NOT EXISTS public.package_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_images_shipment_id ON public.package_images(shipment_id);

-- Enable RLS
ALTER TABLE public.package_images ENABLE ROW LEVEL SECURITY;

-- 3. Database RLS Policies for `package_images`
-- Admins can do everything
CREATE POLICY "Admins can manage package images" ON public.package_images
FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Public/Unauthenticated users can view images if they know the tracking number (tied to shipment visibility)
CREATE POLICY "Anyone can view package images of accessible shipments" ON public.package_images
FOR SELECT USING (
    true -- The images are already in a public bucket, and the tracking page queries them openly.
         -- If we wanted strict security we'd restrict it to shipments the user has access to, 
         -- but public tracking allows anyone with the tracking number to view the shipment.
);
