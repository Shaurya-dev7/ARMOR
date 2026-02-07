-- =====================================================
-- Row Level Security (RLS) Policies
-- Version: 1.0.0
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_conditions_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_execution_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role in user_metadata or app_metadata
    RETURN (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() ->> 'role') = 'service_role'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICIES: alert_rules
-- Admin can CRUD, authenticated users can read active rules
-- =====================================================

-- Admin full access
CREATE POLICY "Admins can do everything on alert_rules"
    ON alert_rules
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Authenticated users can read active rules
CREATE POLICY "Authenticated users can view active alert rules"
    ON alert_rules
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Service role bypass (for Edge Functions)
CREATE POLICY "Service role has full access to alert_rules"
    ON alert_rules
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- POLICIES: alert_conditions_state
-- Admin and service_role only - contains internal state
-- =====================================================

CREATE POLICY "Admins can read alert_conditions_state"
    ON alert_conditions_state
    FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Service role has full access to alert_conditions_state"
    ON alert_conditions_state
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- POLICIES: alert_events
-- Authenticated users can read, only service_role can write
-- =====================================================

CREATE POLICY "Authenticated users can view alert events"
    ON alert_events
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage alert events"
    ON alert_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Admins can manually resolve alerts
CREATE POLICY "Admins can update alert events"
    ON alert_events
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- =====================================================
-- POLICIES: notification_channels
-- Admin only - contains sensitive config (API keys, webhooks)
-- =====================================================

CREATE POLICY "Admins can manage notification channels"
    ON notification_channels
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Service role has full access to notification_channels"
    ON notification_channels
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- POLICIES: alert_notifications
-- Authenticated users can read, service_role can write
-- =====================================================

CREATE POLICY "Authenticated users can view notifications"
    ON alert_notifications
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage notifications"
    ON alert_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- POLICIES: alert_execution_logs
-- Admin only access - operational data
-- =====================================================

CREATE POLICY "Admins can view execution logs"
    ON alert_execution_logs
    FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Service role has full access to execution logs"
    ON alert_execution_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- GRANT STATEMENTS
-- Ensure proper role permissions
-- =====================================================

-- Authenticated role grants
GRANT SELECT ON alert_rules TO authenticated;
GRANT SELECT ON alert_events TO authenticated;
GRANT SELECT ON alert_notifications TO authenticated;
GRANT SELECT ON active_alerts TO authenticated;
GRANT SELECT ON recent_executions TO authenticated;

-- Service role grants (full access)
GRANT ALL ON alert_rules TO service_role;
GRANT ALL ON alert_conditions_state TO service_role;
GRANT ALL ON alert_events TO service_role;
GRANT ALL ON notification_channels TO service_role;
GRANT ALL ON alert_notifications TO service_role;
GRANT ALL ON alert_execution_logs TO service_role;

-- Grant sequence usage for inserts
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
