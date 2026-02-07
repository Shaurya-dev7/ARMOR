-- =====================================================
-- Alert & Notification System Schema
-- Version: 1.0.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Source type for alert rules
CREATE TYPE alert_source_type AS ENUM ('api', 'db', 'internal_metric');

-- Comparison operators for threshold evaluation
CREATE TYPE comparison_operator AS ENUM ('>', '<', '=', '>=', '<=', '!=');

-- Severity levels
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- Alert status
CREATE TYPE alert_status AS ENUM ('triggered', 'resolved');

-- Notification channel types
CREATE TYPE notification_channel_type AS ENUM ('email', 'slack', 'webhook', 'sms');

-- Notification delivery status
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- =====================================================
-- TABLE: alert_rules
-- Stores all alert definitions configured by admins
-- =====================================================
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Source configuration
    source_type alert_source_type NOT NULL,
    source_config JSONB NOT NULL DEFAULT '{}',
    -- source_config examples:
    -- { "url": "https://api.example.com/metrics", "path": "$.value" } for API
    -- { "query": "SELECT count(*) FROM users", "database": "main" } for DB
    -- { "metric": "system.cpu_usage" } for internal_metric
    
    -- Metric identification
    metric_key VARCHAR(255) NOT NULL,
    
    -- Threshold configuration  
    comparison_operator comparison_operator NOT NULL,
    threshold_value NUMERIC NOT NULL,
    
    -- Alert behavior
    severity alert_severity NOT NULL DEFAULT 'warning',
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Auto-resolution configuration
    auto_resolve BOOLEAN DEFAULT true,
    resolution_config JSONB DEFAULT '{}',
    -- { "check_count": 3, "check_interval_minutes": 5 }
    
    -- Notification routing
    notification_channel_ids UUID[] DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    tags VARCHAR(255)[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active rules lookup
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_alert_rules_severity ON alert_rules(severity);
CREATE INDEX idx_alert_rules_source_type ON alert_rules(source_type);

-- =====================================================
-- TABLE: alert_conditions_state
-- Tracks the current state of each alert rule for cooldown logic
-- =====================================================
CREATE TABLE alert_conditions_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID NOT NULL UNIQUE REFERENCES alert_rules(id) ON DELETE CASCADE,
    
    -- Last evaluation results
    last_evaluated_at TIMESTAMPTZ,
    last_value NUMERIC,
    last_value_raw JSONB, -- Original value before parsing
    
    -- Trigger state
    last_triggered_at TIMESTAMPTZ,
    is_currently_triggered BOOLEAN DEFAULT false,
    trigger_count INTEGER DEFAULT 0,
    
    -- Cooldown tracking
    is_in_cooldown BOOLEAN DEFAULT false,
    cooldown_expires_at TIMESTAMPTZ,
    
    -- Resolution tracking
    consecutive_normal_checks INTEGER DEFAULT 0,
    
    -- Error tracking
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    consecutive_errors INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_alert_state_rule ON alert_conditions_state(alert_rule_id);
CREATE INDEX idx_alert_state_triggered ON alert_conditions_state(is_currently_triggered) 
    WHERE is_currently_triggered = true;

-- =====================================================
-- TABLE: alert_events
-- Records every alert trigger and resolution event
-- =====================================================
CREATE TABLE alert_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    
    -- Event details
    status alert_status NOT NULL,
    triggered_value NUMERIC,
    threshold_value NUMERIC NOT NULL,
    comparison_operator comparison_operator NOT NULL,
    
    -- Context
    severity alert_severity NOT NULL,
    metric_key VARCHAR(255) NOT NULL,
    source_type alert_source_type NOT NULL,
    
    -- Additional context
    context JSONB DEFAULT '{}',
    -- { "previous_value": 45.2, "duration_above_threshold_minutes": 15 }
    
    -- Resolution tracking
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id), -- NULL for auto-resolution
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying events
CREATE INDEX idx_alert_events_rule ON alert_events(alert_rule_id);
CREATE INDEX idx_alert_events_status ON alert_events(status);
CREATE INDEX idx_alert_events_severity ON alert_events(severity);
CREATE INDEX idx_alert_events_created ON alert_events(created_at DESC);

-- =====================================================
-- TABLE: notification_channels
-- Stores notification channel configurations
-- =====================================================
CREATE TABLE notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Channel type
    type notification_channel_type NOT NULL,
    
    -- Channel-specific configuration (encrypted in production)
    config JSONB NOT NULL DEFAULT '{}',
    -- Email: { "to": ["admin@example.com"], "from": "alerts@example.com" }
    -- Slack: { "webhook_url": "https://hooks.slack.com/...", "channel": "#alerts" }
    -- Webhook: { "url": "https://...", "method": "POST", "headers": {} }
    -- SMS: { "to": ["+1234567890"] }
    
    -- Filtering
    min_severity alert_severity DEFAULT 'info',
    -- Only send notifications for alerts >= this severity
    
    -- Rate limiting per channel
    rate_limit_per_hour INTEGER DEFAULT 100,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active channels
CREATE INDEX idx_notification_channels_active ON notification_channels(is_active) 
    WHERE is_active = true;
CREATE INDEX idx_notification_channels_type ON notification_channels(type);

-- =====================================================
-- TABLE: alert_notifications
-- Tracks individual notification delivery attempts
-- =====================================================
CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_event_id UUID NOT NULL REFERENCES alert_events(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    
    -- Delivery tracking
    delivery_status delivery_status NOT NULL DEFAULT 'pending',
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Response details
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    
    -- Timing
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification tracking
CREATE INDEX idx_alert_notifications_event ON alert_notifications(alert_event_id);
CREATE INDEX idx_alert_notifications_channel ON alert_notifications(channel_id);
CREATE INDEX idx_alert_notifications_status ON alert_notifications(delivery_status);
CREATE INDEX idx_alert_notifications_pending ON alert_notifications(next_retry_at) 
    WHERE delivery_status = 'pending';

-- =====================================================
-- TABLE: alert_execution_logs
-- Audit log for cron job executions
-- =====================================================
CREATE TABLE alert_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Execution metadata
    execution_id UUID NOT NULL, -- Unique ID per cron run
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Results
    success BOOLEAN NOT NULL DEFAULT true,
    dry_run BOOLEAN NOT NULL DEFAULT false,
    
    -- Statistics
    rules_evaluated INTEGER DEFAULT 0,
    rules_skipped INTEGER DEFAULT 0,
    alerts_triggered INTEGER DEFAULT 0,
    alerts_resolved INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    notifications_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    errors JSONB DEFAULT '[]',
    -- [{ "rule_id": "...", "error": "...", "timestamp": "..." }]
    
    -- Environment info
    environment VARCHAR(50) DEFAULT 'production',
    function_version VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for log queries
CREATE INDEX idx_execution_logs_started ON alert_execution_logs(started_at DESC);
CREATE INDEX idx_execution_logs_success ON alert_execution_logs(success);
CREATE INDEX idx_execution_logs_execution_id ON alert_execution_logs(execution_id);

-- =====================================================
-- FUNCTIONS: Auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_conditions_state_updated_at
    BEFORE UPDATE ON alert_conditions_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_channels_updated_at
    BEFORE UPDATE ON notification_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_notifications_updated_at
    BEFORE UPDATE ON alert_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Initialize state for new alert rules
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_alert_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO alert_conditions_state (alert_rule_id)
    VALUES (NEW.id)
    ON CONFLICT (alert_rule_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_alert_state_on_rule_insert
    AFTER INSERT ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION initialize_alert_state();

-- =====================================================
-- VIEWS: Convenience views for common queries
-- =====================================================

-- Active alerts with their current state
CREATE VIEW active_alerts AS
SELECT 
    ar.id,
    ar.name,
    ar.description,
    ar.severity,
    ar.metric_key,
    acs.last_triggered_at,
    acs.last_value,
    acs.is_in_cooldown,
    acs.cooldown_expires_at,
    ae.id as latest_event_id,
    ae.triggered_value as latest_triggered_value,
    ae.created_at as latest_event_at
FROM alert_rules ar
JOIN alert_conditions_state acs ON ar.id = acs.alert_rule_id
LEFT JOIN LATERAL (
    SELECT * FROM alert_events 
    WHERE alert_rule_id = ar.id AND status = 'triggered'
    ORDER BY created_at DESC LIMIT 1
) ae ON true
WHERE ar.is_active = true 
  AND acs.is_currently_triggered = true;

-- Recent execution summary
CREATE VIEW recent_executions AS
SELECT 
    execution_id,
    started_at,
    duration_ms,
    success,
    dry_run,
    rules_evaluated,
    alerts_triggered,
    alerts_resolved,
    notifications_sent,
    notifications_failed,
    jsonb_array_length(errors) as error_count
FROM alert_execution_logs
ORDER BY started_at DESC
LIMIT 100;

-- =====================================================
-- COMMENTS: Document the schema
-- =====================================================
COMMENT ON TABLE alert_rules IS 'Defines alert conditions and thresholds to monitor';
COMMENT ON TABLE alert_conditions_state IS 'Tracks current state and cooldown for each alert rule';
COMMENT ON TABLE alert_events IS 'Historical record of all alert triggers and resolutions';
COMMENT ON TABLE notification_channels IS 'Configuration for notification delivery channels';
COMMENT ON TABLE alert_notifications IS 'Tracks delivery status for each notification attempt';
COMMENT ON TABLE alert_execution_logs IS 'Audit log for alert engine cron executions';
