/// <reference path="../deno.d.ts" />
/**
 * Alert Engine Types
 * TypeScript interfaces and type definitions for the alert system
 */

// =====================================================
// ENUMS (matching PostgreSQL types)
// =====================================================

export type AlertSourceType = 'api' | 'db' | 'internal_metric';

export type ComparisonOperator = '>' | '<' | '=' | '>=' | '<=' | '!=';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'triggered' | 'resolved';

export type NotificationChannelType = 'email' | 'slack' | 'webhook' | 'sms';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

// =====================================================
// DATABASE ENTITIES
// =====================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  source_type: AlertSourceType;
  source_config: SourceConfig;
  metric_key: string;
  comparison_operator: ComparisonOperator;
  threshold_value: number;
  severity: AlertSeverity;
  cooldown_minutes: number;
  auto_resolve: boolean;
  resolution_config: ResolutionConfig;
  notification_channel_ids: string[];
  is_active: boolean;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceConfig {
  // API source
  url?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  path?: string; // JSONPath to extract value
  timeout_ms?: number;
  
  // DB source
  query?: string;
  database?: string;
  
  // Internal metric
  metric?: string;
}

export interface ResolutionConfig {
  check_count?: number;
  check_interval_minutes?: number;
}

export interface AlertConditionState {
  id: string;
  alert_rule_id: string;
  last_evaluated_at: string | null;
  last_value: number | null;
  last_value_raw: unknown;
  last_triggered_at: string | null;
  is_currently_triggered: boolean;
  trigger_count: number;
  is_in_cooldown: boolean;
  cooldown_expires_at: string | null;
  consecutive_normal_checks: number;
  last_error: string | null;
  last_error_at: string | null;
  consecutive_errors: number;
  created_at: string;
  updated_at: string;
}

export interface AlertEvent {
  id: string;
  alert_rule_id: string;
  status: AlertStatus;
  triggered_value: number | null;
  threshold_value: number;
  comparison_operator: ComparisonOperator;
  severity: AlertSeverity;
  metric_key: string;
  source_type: AlertSourceType;
  context: EventContext;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface EventContext {
  previous_value?: number;
  duration_above_threshold_minutes?: number;
  resolution_reason?: string;
  evaluation_id?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string | null;
  type: NotificationChannelType;
  config: ChannelConfig;
  min_severity: AlertSeverity;
  rate_limit_per_hour: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelConfig {
  // Email
  to?: string[];
  from?: string;
  
  // Slack
  webhook_url?: string;
  channel?: string;
  
  // Webhook
  url?: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  
  // SMS
  phone_numbers?: string[];
}

export interface AlertNotification {
  id: string;
  alert_event_id: string;
  channel_id: string;
  delivery_status: DeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  response_code: number | null;
  response_body: string | null;
  error_message: string | null;
  scheduled_at: string;
  sent_at: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertExecutionLog {
  id: string;
  execution_id: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  success: boolean;
  dry_run: boolean;
  rules_evaluated: number;
  rules_skipped: number;
  alerts_triggered: number;
  alerts_resolved: number;
  notifications_sent: number;
  notifications_failed: number;
  errors: ExecutionError[];
  environment: string;
  function_version: string | null;
  created_at: string;
}

export interface ExecutionError {
  rule_id?: string;
  channel_id?: string;
  error: string;
  timestamp: string;
  stack?: string;
}

// =====================================================
// EVALUATION TYPES
// =====================================================

export interface EvaluationResult {
  rule: AlertRule;
  state: AlertConditionState;
  currentValue: number | null;
  rawValue: unknown;
  isBreached: boolean;
  wasBreached: boolean;
  action: 'trigger' | 'resolve' | 'none' | 'cooldown';
  error?: string;
}

export interface MetricResolutionResult {
  value: number | null;
  rawValue: unknown;
  error?: string;
  latencyMs: number;
}

export interface ExecutionContext {
  executionId: string;
  startedAt: Date;
  dryRun: boolean;
  environment: string;
  errors: ExecutionError[];
  stats: ExecutionStats;
}

export interface ExecutionStats {
  rulesEvaluated: number;
  rulesSkipped: number;
  alertsTriggered: number;
  alertsResolved: number;
  notificationsSent: number;
  notificationsFailed: number;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export interface NotificationPayload {
  event: AlertEvent;
  rule: AlertRule;
  channel: NotificationChannel;
  message: string;
  title: string;
}

export interface NotificationResult {
  success: boolean;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  latencyMs: number;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface AlertEngineRequest {
  dry_run?: boolean;
  rule_ids?: string[]; // Specific rules to evaluate
  force?: boolean; // Bypass cooldown
}

export interface AlertEngineResponse {
  success: boolean;
  execution_id: string;
  duration_ms: number;
  stats: ExecutionStats;
  errors?: ExecutionError[];
}

// =====================================================
// SUPABASE CLIENT TYPE
// =====================================================

// Generic type for Supabase client to avoid dynamic import issues
// deno-lint-ignore no-explicit-any
export type SupabaseClient = any;
