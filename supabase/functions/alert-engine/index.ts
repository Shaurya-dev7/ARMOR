/// <reference path="../deno.d.ts" />
/**
 * Alert Engine - Supabase Edge Function
 * Main entry point for the cron-triggered alert evaluation system
 * 
 * NOTE: This is a Deno Edge Function. TypeScript/VSCode may show errors for:
 * - Deno URL imports (https://deno.land/...)
 * - .ts extension imports
 * These are valid in the Deno runtime and will work when deployed.
 */

// @ts-ignore - Deno imports work at runtime
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - ESM import works at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import type {
  AlertRule,
  AlertConditionState,
  NotificationChannel,
  ExecutionContext,
  AlertEngineRequest,
  AlertEngineResponse,
  AlertExecutionLog,
  SupabaseClient,
} from './types.ts';
import { evaluateAlertRule, createAlertEvent, createStateUpdate } from './evaluator.ts';
import { dispatchNotifications } from './dispatcher.ts';
import { logger, generateUUID, calculateDuration, createError } from './utils.ts';

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Environment configuration
const FUNCTION_VERSION = '1.0.0';

serve(async (req: Request) => {
  const executionId = generateUUID();
  const startedAt = new Date();

  // Initialize execution context
  const context: ExecutionContext = {
    executionId,
    startedAt,
    dryRun: false,
    environment: Deno.env.get('ENVIRONMENT') || 'production',
    errors: [],
    stats: {
      rulesEvaluated: 0,
      rulesSkipped: 0,
      alertsTriggered: 0,
      alertsResolved: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
    },
  };

  logger.info('Alert engine execution started', context);

  try {
    // Parse request body (for manual invocations)
    let requestBody: AlertEngineRequest = {};
    if (req.method === 'POST') {
      try {
        const text = await req.text();
        if (text) {
          requestBody = JSON.parse(text);
        }
      } catch {
        // Ignore parsing errors, use defaults
      }
    }

    context.dryRun = requestBody.dry_run || Deno.env.get('ALERT_DRY_RUN') === 'true';

    if (context.dryRun) {
      logger.info('Running in DRY RUN mode - no notifications will be sent', context);
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch all active alert rules
    let rulesQuery = supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true);

    // Filter to specific rules if provided
    if (requestBody.rule_ids && requestBody.rule_ids.length > 0) {
      rulesQuery = rulesQuery.in('id', requestBody.rule_ids);
    }

    const { data: rules, error: rulesError } = await rulesQuery;

    if (rulesError) {
      throw new Error(`Failed to fetch alert rules: ${rulesError.message}`);
    }

    logger.info(`Fetched ${rules?.length || 0} active alert rules`, context);

    if (!rules || rules.length === 0) {
      return createResponse(context, startedAt, true);
    }

    // Fetch all alert states
    const { data: states, error: statesError } = await supabase
      .from('alert_conditions_state')
      .select('*')
      .in(
        'alert_rule_id',
        rules.map((r: AlertRule) => r.id)
      );

    if (statesError) {
      throw new Error(`Failed to fetch alert states: ${statesError.message}`);
    }

    // Create state lookup map
    const stateMap = new Map<string, AlertConditionState>();
    states?.forEach((s: AlertConditionState) => stateMap.set(s.alert_rule_id, s));

    // Fetch all active notification channels
    const { data: channels, error: channelsError } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('is_active', true);

    if (channelsError) {
      logger.warn(`Failed to fetch notification channels: ${channelsError.message}`, context);
    }

    // Process each rule
    for (const rule of rules as AlertRule[]) {
      try {
        // Get or create state for this rule
        let state = stateMap.get(rule.id);

        if (!state) {
          // State should be auto-created by trigger, but create if missing
          const { data: newState, error: stateInsertError } = await supabase
            .from('alert_conditions_state')
            .insert({ alert_rule_id: rule.id })
            .select()
            .single();

          if (stateInsertError) {
            logger.error(`Failed to create state for rule ${rule.id}`, context, {
              error: stateInsertError.message,
            });
            context.stats.rulesSkipped++;
            continue;
          }

          state = newState;
        }

        // Evaluate the rule
        const result = await evaluateAlertRule(rule, state as AlertConditionState, context, supabase);
        context.stats.rulesEvaluated++;

        // Update state
        const stateUpdate = createStateUpdate(result);
        await supabase
          .from('alert_conditions_state')
          .update(stateUpdate)
          .eq('alert_rule_id', rule.id);

        // Handle actions
        if (result.action === 'trigger') {
          // Create alert event
          const eventData = createAlertEvent(result, 'triggered', context);
          const { data: event, error: eventError } = await supabase
            .from('alert_events')
            .insert(eventData)
            .select()
            .single();

          if (eventError) {
            logger.error(`Failed to create alert event: ${eventError.message}`, context);
            context.errors.push(createError(eventError.message, rule.id));
          } else {
            context.stats.alertsTriggered++;
            logger.info(`Alert triggered for rule ${rule.name}`, context, {
              ruleId: rule.id,
              eventId: event.id,
              value: result.currentValue,
            });

            // Dispatch notifications
            if (channels && channels.length > 0) {
              await dispatchNotifications(
                event,
                rule,
                channels as NotificationChannel[],
                context,
                supabase,
                context.dryRun
              );
            }
          }
        } else if (result.action === 'resolve') {
          // Create resolution event
          const eventData = createAlertEvent(result, 'resolved', context);
          const { data: event, error: eventError } = await supabase
            .from('alert_events')
            .insert(eventData)
            .select()
            .single();

          if (eventError) {
            logger.error(`Failed to create resolution event: ${eventError.message}`, context);
            context.errors.push(createError(eventError.message, rule.id));
          } else {
            context.stats.alertsResolved++;
            logger.info(`Alert resolved for rule ${rule.name}`, context, {
              ruleId: rule.id,
              eventId: event.id,
            });

            // Dispatch resolution notifications
            if (channels && channels.length > 0) {
              await dispatchNotifications(
                event,
                rule,
                channels as NotificationChannel[],
                context,
                supabase,
                context.dryRun
              );
            }
          }
        } else if (result.action === 'cooldown') {
          logger.debug(`Rule ${rule.name} in cooldown, skipping notification`, context);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error processing rule ${rule.id}: ${message}`, context);
        context.errors.push(createError(error as Error, rule.id));
        context.stats.rulesSkipped++;
      }
    }

    // Log execution summary
    await logExecution(context, startedAt, true, supabase);

    return createResponse(context, startedAt, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Fatal error in alert engine: ${message}`, context);
    context.errors.push(createError(error as Error));

    // Try to log the failed execution
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await logExecution(context, startedAt, false, supabase);
      }
    } catch {
      // Ignore logging failures
    }

    return createResponse(context, startedAt, false);
  }
});

/**
 * Create HTTP response
 */
function createResponse(
  context: ExecutionContext,
  startedAt: Date,
  success: boolean
): Response {
  const durationMs = calculateDuration(startedAt);

  const response: AlertEngineResponse = {
    success,
    execution_id: context.executionId,
    duration_ms: durationMs,
    stats: context.stats,
    errors: context.errors.length > 0 ? context.errors : undefined,
  };

  logger.info('Alert engine execution completed', context, {
    durationMs,
    success,
    stats: context.stats,
  });

  return new Response(JSON.stringify(response), {
    status: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Log execution to database
 */
async function logExecution(
  context: ExecutionContext,
  startedAt: Date,
  success: boolean,
  supabase: SupabaseClient
): Promise<void> {
  const completedAt = new Date();
  const durationMs = calculateDuration(startedAt);

  const log: Omit<AlertExecutionLog, 'id' | 'created_at'> = {
    execution_id: context.executionId,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    duration_ms: durationMs,
    success,
    dry_run: context.dryRun,
    rules_evaluated: context.stats.rulesEvaluated,
    rules_skipped: context.stats.rulesSkipped,
    alerts_triggered: context.stats.alertsTriggered,
    alerts_resolved: context.stats.alertsResolved,
    notifications_sent: context.stats.notificationsSent,
    notifications_failed: context.stats.notificationsFailed,
    errors: context.errors,
    environment: context.environment,
    function_version: FUNCTION_VERSION,
  };

  const { error } = await supabase.from('alert_execution_logs').insert(log);

  if (error) {
    logger.error(`Failed to log execution: ${error.message}`);
  }
}
