/// <reference path="../deno.d.ts" />
/**
 * Alert Engine Utilities
 * Helper functions for logging, comparison, and common operations
 */

import {
  AlertSeverity,
  ComparisonOperator,
  ExecutionContext,
  ExecutionError,
} from './types.ts';

// =====================================================
// LOGGING
// =====================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  executionId?: string;
  ruleId?: string;
  channelId?: string;
  data?: Record<string, unknown>;
}

/**
 * Structured logger for the alert engine
 */
export function log(
  level: LogLevel,
  message: string,
  context?: ExecutionContext,
  data?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    executionId: context?.executionId,
    ...data,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case LogLevel.ERROR:
      console.error(output);
      break;
    case LogLevel.WARN:
      console.warn(output);
      break;
    case LogLevel.DEBUG:
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (msg: string, ctx?: ExecutionContext, data?: Record<string, unknown>) =>
    log(LogLevel.DEBUG, msg, ctx, data),
  info: (msg: string, ctx?: ExecutionContext, data?: Record<string, unknown>) =>
    log(LogLevel.INFO, msg, ctx, data),
  warn: (msg: string, ctx?: ExecutionContext, data?: Record<string, unknown>) =>
    log(LogLevel.WARN, msg, ctx, data),
  error: (msg: string, ctx?: ExecutionContext, data?: Record<string, unknown>) =>
    log(LogLevel.ERROR, msg, ctx, data),
};

// =====================================================
// COMPARISON OPERATIONS
// =====================================================

/**
 * Compare two values using the specified operator
 */
export function compareValues(
  currentValue: number,
  operator: ComparisonOperator,
  thresholdValue: number
): boolean {
  switch (operator) {
    case '>':
      return currentValue > thresholdValue;
    case '<':
      return currentValue < thresholdValue;
    case '>=':
      return currentValue >= thresholdValue;
    case '<=':
      return currentValue <= thresholdValue;
    case '=':
      return currentValue === thresholdValue;
    case '!=':
      return currentValue !== thresholdValue;
    default:
      throw new Error(`Unknown comparison operator: ${operator}`);
  }
}

/**
 * Get human-readable description of comparison
 */
export function describeComparison(
  operator: ComparisonOperator,
  threshold: number
): string {
  const ops: Record<ComparisonOperator, string> = {
    '>': 'greater than',
    '<': 'less than',
    '>=': 'greater than or equal to',
    '<=': 'less than or equal to',
    '=': 'equal to',
    '!=': 'not equal to',
  };
  return `${ops[operator]} ${threshold}`;
}

// =====================================================
// COOLDOWN LOGIC
// =====================================================

/**
 * Check if alert rule is within cooldown period
 */
export function isInCooldown(
  lastTriggeredAt: string | null,
  cooldownMinutes: number
): boolean {
  if (!lastTriggeredAt) return false;

  const cooldownEnd = new Date(lastTriggeredAt);
  cooldownEnd.setMinutes(cooldownEnd.getMinutes() + cooldownMinutes);

  return new Date() < cooldownEnd;
}

/**
 * Calculate when cooldown expires
 */
export function getCooldownExpiry(
  lastTriggeredAt: string,
  cooldownMinutes: number
): Date {
  const expiry = new Date(lastTriggeredAt);
  expiry.setMinutes(expiry.getMinutes() + cooldownMinutes);
  return expiry;
}

// =====================================================
// SEVERITY UTILITIES
// =====================================================

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
};

/**
 * Compare severities (returns true if a >= b)
 */
export function severityMeetsMinimum(
  severity: AlertSeverity,
  minSeverity: AlertSeverity
): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minSeverity];
}

/**
 * Get emoji for severity (for Slack/log output)
 */
export function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
      return '🔵';
    default:
      return '⚪';
  }
}

/**
 * Get color for severity (hex)
 */
export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return '#dc2626';
    case 'warning':
      return '#f59e0b';
    case 'info':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

// =====================================================
// ERROR HANDLING
// =====================================================

/**
 * Create an execution error object
 */
export function createError(
  error: Error | string,
  ruleId?: string,
  channelId?: string
): ExecutionError {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    rule_id: ruleId,
    channel_id: channelId,
    error: message,
    timestamp: new Date().toISOString(),
    stack,
  };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// =====================================================
// TIMING UTILITIES
// =====================================================

/**
 * Calculate duration in milliseconds
 */
export function calculateDuration(startTime: Date): number {
  return Date.now() - startTime.getTime();
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

// =====================================================
// UUID GENERATION
// =====================================================

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// =====================================================
// MESSAGE FORMATTING
// =====================================================

/**
 * Format alert message for notifications
 */
export function formatAlertMessage(
  alertName: string,
  metricKey: string,
  currentValue: number,
  operator: ComparisonOperator,
  threshold: number,
  severity: AlertSeverity,
  isResolution = false
): string {
  const emoji = getSeverityEmoji(severity);
  const action = isResolution ? 'RESOLVED' : 'TRIGGERED';
  const comparison = describeComparison(operator, threshold);

  return [
    `${emoji} **Alert ${action}**: ${alertName}`,
    '',
    `**Metric**: ${metricKey}`,
    `**Current Value**: ${currentValue}`,
    `**Condition**: ${comparison}`,
    `**Severity**: ${severity.toUpperCase()}`,
    '',
    `_Time: ${new Date().toISOString()}_`,
  ].join('\n');
}

/**
 * Format alert title for notifications
 */
export function formatAlertTitle(
  alertName: string,
  severity: AlertSeverity,
  isResolution = false
): string {
  const emoji = getSeverityEmoji(severity);
  const status = isResolution ? 'Resolved' : 'Triggered';
  return `${emoji} [${severity.toUpperCase()}] ${alertName} - ${status}`;
}
