-- =====================================================
-- Sample Data for Testing the Alert System
-- Run after the schema migrations
-- =====================================================

-- =====================================================
-- NOTIFICATION CHANNELS
-- =====================================================

-- Email channel
INSERT INTO notification_channels (id, name, description, type, config, min_severity, is_active)
VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'Admin Email Alerts',
  'Send critical alerts to admin email',
  'email',
  '{"to": ["admin@example.com"], "from": "alerts@yourapp.com"}',
  'warning',
  true
);

-- Slack channel
INSERT INTO notification_channels (id, name, description, type, config, min_severity, is_active)
VALUES (
  'c0000002-0000-0000-0000-000000000002',
  'Slack #alerts',
  'Post all alerts to Slack',
  'slack',
  '{"channel": "#alerts"}',
  'info',
  true
);

-- Webhook channel
INSERT INTO notification_channels (id, name, description, type, config, min_severity, is_active)
VALUES (
  'c0000003-0000-0000-0000-000000000003',
  'External Webhook',
  'Generic webhook for integrations',
  'webhook',
  '{"url": "https://api.example.com/alerts/receive", "method": "POST"}',
  'critical',
  true
);

-- =====================================================
-- ALERT RULES - API Source Examples
-- =====================================================

-- Example: Monitor Near-Earth Objects count
INSERT INTO alert_rules (
  id, name, description, source_type, source_config,
  metric_key, comparison_operator, threshold_value,
  severity, cooldown_minutes, is_active,
  notification_channel_ids
)
VALUES (
  'r0000001-0000-0000-0000-000000000001',
  'High NEO Count Alert',
  'Alert when there are too many near-Earth objects approaching',
  'api',
  '{
    "url": "https://api.nasa.gov/neo/rest/v1/feed?api_key=DEMO_KEY",
    "path": "$.element_count",
    "timeout_ms": 10000
  }',
  'neo.count',
  '>',
  50,
  'warning',
  60,
  true,
  ARRAY['c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002']::uuid[]
);

-- Example: Monitor satellite count from CelesTrak
INSERT INTO alert_rules (
  id, name, description, source_type, source_config,
  metric_key, comparison_operator, threshold_value,
  severity, cooldown_minutes, is_active
)
VALUES (
  'r0000002-0000-0000-0000-000000000002',
  'Satellite Database Size',
  'Alert if satellite database exceeds threshold',
  'db',
  '{
    "query": "SELECT COUNT(*) as count FROM satellites"
  }',
  'satellites.count',
  '>',
  10000,
  'info',
  120,
  false  -- Disabled by default, enable when you have the table
);

-- =====================================================
-- ALERT RULES - Internal Metric Examples
-- =====================================================

-- Example: System timestamp check (for testing)
INSERT INTO alert_rules (
  id, name, description, source_type, source_config,
  metric_key, comparison_operator, threshold_value,
  severity, cooldown_minutes, is_active
)
VALUES (
  'r0000003-0000-0000-0000-000000000003',
  'Test Alert - Always Triggers',
  'This alert always triggers for testing purposes (random > 10)',
  'internal_metric',
  '{"metric": "system.random"}',
  'system.random',
  '>',
  10,
  'info',
  5,
  true
);

-- =====================================================
-- TEST ALERT EVENT (for UI testing)
-- =====================================================

INSERT INTO alert_events (
  id, alert_rule_id, status, triggered_value, threshold_value,
  comparison_operator, severity, metric_key, source_type, context
)
VALUES (
  'e0000001-0000-0000-0000-000000000001',
  'r0000001-0000-0000-0000-000000000001',
  'triggered',
  55,
  50,
  '>',
  'warning',
  'neo.count',
  'api',
  '{"evaluation_id": "test-evaluation-001"}'
);

-- =====================================================
-- VERIFY INSERTED DATA
-- =====================================================

-- You can run these queries to verify:
-- SELECT * FROM notification_channels;
-- SELECT * FROM alert_rules;
-- SELECT * FROM alert_conditions_state;
-- SELECT * FROM alert_events;
