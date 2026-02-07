/// <reference path="../deno.d.ts" />
/**
 * Alert Evaluator
 * Core logic for evaluating alert rules and determining actions
 */

import {
  AlertRule,
  AlertConditionState,
  AlertEvent,
  EvaluationResult,
  ExecutionContext,
  SupabaseClient,
} from './types.ts';
import { resolveMetricValue } from './metric-resolver.ts';
import {
  compareValues,
  isInCooldown,
  getCooldownExpiry,
  logger,
  createError,
} from './utils.ts';

/**
 * Evaluate a single alert rule and determine the action to take
 */
export async function evaluateAlertRule(
  rule: AlertRule,
  state: AlertConditionState,
  context: ExecutionContext,
  supabaseClient: SupabaseClient
): Promise<EvaluationResult> {
  const result: EvaluationResult = {
    rule,
    state,
    currentValue: null,
    rawValue: null,
    isBreached: false,
    wasBreached: state.is_currently_triggered,
    action: 'none',
  };

  try {
    // Step 1: Resolve current metric value
    const metricResult = await resolveMetricValue(rule, supabaseClient);

    if (metricResult.error) {
      logger.warn(`Metric resolution failed for rule ${rule.id}`, context, {
        ruleId: rule.id,
        error: metricResult.error,
      });
      result.error = metricResult.error;
      return result;
    }

    result.currentValue = metricResult.value;
    result.rawValue = metricResult.rawValue;

    // Step 2: Evaluate the condition
    if (result.currentValue === null) {
      result.error = 'Metric value is null';
      return result;
    }

    result.isBreached = compareValues(
      result.currentValue,
      rule.comparison_operator,
      rule.threshold_value
    );

    // Step 3: Determine action based on current and previous state
    result.action = determineAction(
      result.isBreached,
      result.wasBreached,
      state,
      rule
    );

    logger.info(`Rule ${rule.name} evaluated`, context, {
      ruleId: rule.id,
      currentValue: result.currentValue,
      threshold: rule.threshold_value,
      operator: rule.comparison_operator,
      isBreached: result.isBreached,
      wasBreached: result.wasBreached,
      action: result.action,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.error = message;
    context.errors.push(createError(error as Error, rule.id));
    return result;
  }
}

/**
 * Determine what action to take based on evaluation result
 */
function determineAction(
  isBreached: boolean,
  wasBreached: boolean,
  state: AlertConditionState,
  rule: AlertRule
): 'trigger' | 'resolve' | 'none' | 'cooldown' {
  // Case 1: Newly breached (was normal, now breached)
  if (isBreached && !wasBreached) {
    // Check cooldown
    if (isInCooldown(state.last_triggered_at, rule.cooldown_minutes)) {
      return 'cooldown';
    }
    return 'trigger';
  }

  // Case 2: Still breached (was breached, still breached)
  if (isBreached && wasBreached) {
    return 'none'; // Already triggered, nothing to do
  }

  // Case 3: Resolved (was breached, now normal)
  if (!isBreached && wasBreached) {
    if (rule.auto_resolve) {
      // Check if we need consecutive normal checks before resolving
      const checkCount = rule.resolution_config?.check_count || 1;
      if (state.consecutive_normal_checks + 1 >= checkCount) {
        return 'resolve';
      }
    }
    return 'none'; // Wait for more normal checks
  }

  // Case 4: Still normal (was normal, still normal)
  return 'none';
}

/**
 * Create an alert event record
 */
export function createAlertEvent(
  result: EvaluationResult,
  status: 'triggered' | 'resolved',
  context: ExecutionContext
): Omit<AlertEvent, 'id' | 'created_at'> {
  return {
    alert_rule_id: result.rule.id,
    status,
    triggered_value: result.currentValue,
    threshold_value: result.rule.threshold_value,
    comparison_operator: result.rule.comparison_operator,
    severity: result.rule.severity,
    metric_key: result.rule.metric_key,
    source_type: result.rule.source_type,
    context: {
      previous_value: result.state.last_value ?? undefined,
      evaluation_id: context.executionId,
      resolution_reason: status === 'resolved' ? 'Metric returned to normal' : undefined,
    },
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    resolved_by: null,
  };
}

/**
 * Update alert condition state based on evaluation result
 */
export function createStateUpdate(
  result: EvaluationResult
): Partial<AlertConditionState> {
  const now = new Date().toISOString();

  const baseUpdate: Partial<AlertConditionState> = {
    last_evaluated_at: now,
    last_value: result.currentValue,
    last_value_raw: result.rawValue,
    last_error: result.error || null,
    last_error_at: result.error ? now : null,
    consecutive_errors: result.error 
      ? (result.state.consecutive_errors || 0) + 1 
      : 0,
  };

  switch (result.action) {
    case 'trigger':
      return {
        ...baseUpdate,
        last_triggered_at: now,
        is_currently_triggered: true,
        trigger_count: (result.state.trigger_count || 0) + 1,
        is_in_cooldown: true,
        cooldown_expires_at: getCooldownExpiry(now, result.rule.cooldown_minutes).toISOString(),
        consecutive_normal_checks: 0,
      };

    case 'resolve':
      return {
        ...baseUpdate,
        is_currently_triggered: false,
        is_in_cooldown: false,
        cooldown_expires_at: null,
        consecutive_normal_checks: 0,
      };

    case 'cooldown':
      return {
        ...baseUpdate,
        // Don't change triggered state when in cooldown
      };

    case 'none':
    default:
      // If not breached and was triggered, increment normal check count
      if (!result.isBreached && result.wasBreached) {
        return {
          ...baseUpdate,
          consecutive_normal_checks: (result.state.consecutive_normal_checks || 0) + 1,
        };
      }
      return baseUpdate;
  }
}
