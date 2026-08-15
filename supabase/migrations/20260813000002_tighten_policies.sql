-- 1. Restrict telemetry updates to service_role / admin only
-- We need to ensure that the telemetry column is not updated by standard users.
-- Since the application uses RLS, we can revoke UPDATE on the telemetry column for authenticated users if possible, or add a trigger to protect it.
-- However, Supabase RLS is at the row level, not column level.
-- To protect the column, we can use a trigger that prevents changes to 'telemetry' unless the user is a service_role or admin.
-- We can check if auth.jwt()->>'role' = 'service_role'.

CREATE OR REPLACE FUNCTION prevent_unauthorized_telemetry_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.telemetry IS DISTINCT FROM OLD.telemetry THEN
        -- Only allow the service_role (which backend API functions use via supabaseAdmin)
        -- to update the telemetry column.
        IF auth.role() != 'service_role' THEN
            RAISE EXCEPTION 'Unauthorized: Only service_role can update telemetry';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_telemetry ON shipments;
CREATE TRIGGER trg_protect_telemetry
BEFORE UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION prevent_unauthorized_telemetry_update();

-- 2. Audit Log for Shipment Status Changes
CREATE TABLE IF NOT EXISTS shipment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shipment_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION audit_shipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO shipment_audit_logs (shipment_id, old_status, new_status, changed_by, changed_at)
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid()::text,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_status ON shipments;
CREATE TRIGGER trg_audit_status
AFTER UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION audit_shipment_status_change();

-- 3. Policy for service_role to create events for any shipment
-- Currently, shipment_events likely only allows inserts by the owner.
-- The service_role inherently bypasses RLS, so admin API functions using supabaseAdmin (service_role key)
-- already have permission to insert into shipment_events.
-- But if there's any strict policy blocking it, we'll explicitly add one for service_role.

CREATE POLICY "Service Role can insert events" ON shipment_events
    FOR INSERT 
    TO service_role
    WITH CHECK (true);
