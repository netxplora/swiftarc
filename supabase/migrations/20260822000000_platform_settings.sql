-- Migration: 20260822000000_platform_settings.sql

-- 1. Create platform_settings (Singleton table)
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE CHECK (is_singleton),
    visual_assets JSONB DEFAULT '{}'::jsonb,
    design_system JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    compliance_legal JSONB DEFAULT '{}'::jsonb,
    global_seo JSONB DEFAULT '{}'::jsonb,
    notifications_alerts JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed default settings
INSERT INTO platform_settings (
    visual_assets, design_system, contact_info, compliance_legal, global_seo, notifications_alerts
) VALUES (
    '{"primaryLogo": "", "logoLight": "", "logoDark": "", "favicon": "", "appIcon": "", "socialImage": "", "emailLogo": "", "documentLogo": ""}',
    '{"lightMode": {"primary": "#EA580C", "primaryHover": "#C2410C", "secondary": "#032D60", "accent": "#2563EB", "background": "#FFFFFF", "foreground": "#032D60", "card": "#FFFFFF", "cardBorder": "#E2E8F0", "mutedBackground": "#F8FAFC", "mutedText": "#64748B", "inputBackground": "#FFFFFF", "inputBorder": "#CBD5E1", "success": "#16A34A", "warning": "#F59E0B", "error": "#DC2626", "info": "#2563EB"}, "darkMode": {"primary": "#F97316", "primaryHover": "#EA580C", "secondary": "#021836", "accent": "#60A5FA", "background": "#020617", "foreground": "#F8FAFC", "card": "#0F172A", "cardElevated": "#172033", "cardBorder": "#1E293B", "mutedBackground": "#0B1120", "mutedText": "#94A3B8", "inputBackground": "#0F172A", "inputBorder": "#334155", "success": "#22C55E", "warning": "#FBBF24", "error": "#F87171", "info": "#60A5FA"}, "typography": {"display": "Nunito Sans", "sans": "Inter", "mono": "Source Code Pro"}, "borderRadius": "0.5rem", "cardRadius": "0.75rem", "buttonStyles": "solid", "inputStyles": "outline", "shadows": "soft", "surfaceHierarchy": "elevated"}',
    '{"platformName": "SwiftArc", "website": "https://swiftarc.com", "supportEmail": "support@swiftarc.com", "phone": "+1 (555) 123-4567", "address": "123 Logistics Way, Suite 100", "workingHours": "Mon-Fri 9am-6pm", "socialLinks": {"twitter": "", "linkedin": "", "facebook": ""}}',
    '{"privacyUrl": "/privacy", "termsUrl": "/terms", "shippingPolicy": "/shipping", "cookiePolicy": "/cookies", "refundPolicy": "/refunds", "otherLegal": ""}',
    '{"defaultTitle": "SwiftArc - Logistics & Courier", "defaultDescription": "A reliable logistics platform for shipment management.", "canonicalUrl": "https://swiftarc.com", "ogTitle": "SwiftArc", "ogDescription": "Global Logistics Platform", "ogImage": "", "robotsConfig": "index, follow", "sitemapConfig": "/sitemap.xml"}',
    '{"systemNotifications": true, "shipmentNotifications": true, "paymentNotifications": true, "accountNotifications": true, "securityNotifications": true, "maintenanceAlerts": true}'
) ON CONFLICT (is_singleton) DO NOTHING;

-- 2. Create platform_fees
CREATE TABLE IF NOT EXISTS platform_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('fixed', 'percentage')),
    value DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default platform fees
INSERT INTO platform_fees (name, fee_type, value, min_amount, max_amount, is_active)
VALUES 
    ('Standard Processing Fee', 'fixed', 2.5000, NULL, NULL, TRUE),
    ('Fuel Surcharge', 'percentage', 5.0000, NULL, NULL, TRUE),
    ('Platform Commission', 'percentage', 10.0000, NULL, NULL, TRUE),
    ('Insurance Surcharge', 'percentage', 2.0000, 1.00, 50.00, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Create notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL UNIQUE,
    channels JSONB DEFAULT '["email", "in_app"]'::jsonb,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create settings_audit_logs
CREATE TABLE IF NOT EXISTS settings_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "Admins can update platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "Public can view active platform_fees" ON platform_fees;
DROP POLICY IF EXISTS "Admins can manage platform_fees" ON platform_fees;
DROP POLICY IF EXISTS "Public can view active notification_templates" ON notification_templates;
DROP POLICY IF EXISTS "Admins can manage notification_templates" ON notification_templates;
DROP POLICY IF EXISTS "Admins can view audit logs" ON settings_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON settings_audit_logs;

-- Policies
-- platform_settings: anyone can read, only admin/moderator can update
CREATE POLICY "Public can view platform_settings" ON platform_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update platform_settings" ON platform_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- platform_fees: anyone can read active, admin can manage
CREATE POLICY "Public can view active platform_fees" ON platform_fees
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage platform_fees" ON platform_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- notification_templates: anyone can read active, admin can manage
CREATE POLICY "Public can view active notification_templates" ON notification_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage notification_templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- settings_audit_logs: only admins can view or insert
CREATE POLICY "Admins can view audit logs" ON settings_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can insert audit logs" ON settings_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Triggers for auto-logging platform_settings changes
CREATE OR REPLACE FUNCTION log_platform_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.visual_assets IS DISTINCT FROM NEW.visual_assets THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'visual_assets', 'UPDATE', OLD.visual_assets, NEW.visual_assets);
    END IF;
    IF OLD.design_system IS DISTINCT FROM NEW.design_system THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'design_system', 'UPDATE', OLD.design_system, NEW.design_system);
    END IF;
    IF OLD.contact_info IS DISTINCT FROM NEW.contact_info THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'contact_info', 'UPDATE', OLD.contact_info, NEW.contact_info);
    END IF;
    IF OLD.compliance_legal IS DISTINCT FROM NEW.compliance_legal THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'compliance_legal', 'UPDATE', OLD.compliance_legal, NEW.compliance_legal);
    END IF;
    IF OLD.global_seo IS DISTINCT FROM NEW.global_seo THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'global_seo', 'UPDATE', OLD.global_seo, NEW.global_seo);
    END IF;
    IF OLD.notifications_alerts IS DISTINCT FROM NEW.notifications_alerts THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'notifications_alerts', 'UPDATE', OLD.notifications_alerts, NEW.notifications_alerts);
    END IF;
    
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_platform_settings_update ON platform_settings;
CREATE TRIGGER trigger_log_platform_settings_update
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_platform_settings_update();

-- Function for platform_fees auto-logging
CREATE OR REPLACE FUNCTION log_platform_fees_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'platform_fees', 'INSERT', NULL, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'platform_fees', 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        NEW.updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO settings_audit_logs (admin_id, category, action, previous_value, new_value)
        VALUES (auth.uid(), 'platform_fees', 'DELETE', row_to_json(OLD)::jsonb, NULL);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_platform_fees_changes ON platform_fees;
CREATE TRIGGER trigger_log_platform_fees_changes
    BEFORE INSERT OR UPDATE OR DELETE ON platform_fees
    FOR EACH ROW
    EXECUTE FUNCTION log_platform_fees_changes();
