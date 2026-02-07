-- =====================================================
-- Database Function for Metric Queries
-- Allows secure execution of pre-defined metric queries
-- =====================================================

-- Enable the pg_net extension for HTTP requests from pg_cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- FUNCTION: execute_metric_query
-- Safely execute read-only queries for metric resolution
-- =====================================================
CREATE OR REPLACE FUNCTION execute_metric_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    sanitized_query TEXT;
BEGIN
    -- Basic validation - only allow SELECT queries
    sanitized_query := TRIM(LOWER(query_text));
    
    IF NOT (sanitized_query LIKE 'select%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Check for dangerous patterns
    IF sanitized_query ~ '(insert|update|delete|drop|alter|create|truncate|grant|revoke)' THEN
        RAISE EXCEPTION 'Dangerous SQL patterns detected';
    END IF;
    
    -- Execute the query and return as JSONB
    EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text)
    INTO result;
    
    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to service role only
REVOKE ALL ON FUNCTION execute_metric_query(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION execute_metric_query(TEXT) TO service_role;

-- =====================================================
-- FUNCTION: trigger_alert_engine
-- Helper function to trigger the alert engine via pg_cron
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_alert_engine()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_url TEXT;
    service_key TEXT;
BEGIN
    -- Get these from app settings (set via Supabase CLI or dashboard)
    project_url := current_setting('app.supabase_url', true);
    service_key := current_setting('app.service_role_key', true);
    
    IF project_url IS NULL OR service_key IS NULL THEN
        RAISE NOTICE 'Alert engine not configured - missing app settings';
        RETURN;
    END IF;
    
    -- Make async HTTP call to the edge function
    PERFORM net.http_post(
        url := project_url || '/functions/v1/alert-engine',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key
        ),
        body := '{}'::jsonb
    );
    
    RAISE NOTICE 'Alert engine triggered at %', NOW();
END;
$$;

-- =====================================================
-- PG_CRON SCHEDULING
-- Note: pg_cron must be enabled in Supabase dashboard
-- =====================================================

-- To set up the cron job, run this after enabling pg_cron:
/*
-- Schedule alert evaluation every 5 minutes
SELECT cron.schedule(
    'evaluate-alerts',           -- job name
    '*/5 * * * *',               -- every 5 minutes
    'SELECT trigger_alert_engine()'
);

-- To view scheduled jobs:
SELECT * FROM cron.job;

-- To unschedule:
SELECT cron.unschedule('evaluate-alerts');
*/

-- =====================================================
-- APP SETTINGS (set these in Supabase)
-- =====================================================
-- 
-- In your Supabase dashboard or via CLI, set these database settings:
-- 
-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
--
-- IMPORTANT: Keep these secure! Service role key has full access.
