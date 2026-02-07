/// <reference path="../deno.d.ts" />
/**
 * Notification Dispatcher
 * Orchestrates sending notifications across all configured channels
 */

import type {
  AlertEvent,
  AlertRule,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
  ExecutionContext,
  DeliveryStatus,
  SupabaseClient,
} from './types.ts';
import { sendEmailNotification } from './channels/email.ts';
import { sendSlackNotification } from './channels/slack.ts';
import { sendWebhookNotification } from './channels/webhook.ts';
import { sendSmsNotification } from './channels/sms.ts';
import {
  logger,
  delay,
  severityMeetsMinimum,
  createError,
  formatAlertMessage,
  formatAlertTitle,
} from './utils.ts';

// Retry configuration
const RETRY_DELAYS_MS = [1000, 3000, 10000]; // Exponential backoff

interface DispatchResult {
  channel: NotificationChannel;
  result: NotificationResult;
  attempts: number;
}

/**
 * Dispatch notifications for an alert event
 */
export async function dispatchNotifications(
  event: AlertEvent,
  rule: AlertRule,
  channels: NotificationChannel[],
  context: ExecutionContext,
  supabaseClient: SupabaseClient,
  dryRun: boolean = false
): Promise<DispatchResult[]> {
  const results: DispatchResult[] = [];

  // Filter channels by severity and active status
  const eligibleChannels = channels.filter((channel) => {
    if (!channel.is_active) {
      logger.debug(`Skipping inactive channel ${channel.name}`, context);
      return false;
    }

    if (!severityMeetsMinimum(event.severity, channel.min_severity)) {
      logger.debug(
        `Skipping channel ${channel.name} - severity ${event.severity} below minimum ${channel.min_severity}`,
        context
      );
      return false;
    }

    // If rule has specific channel IDs, filter to those
    if (rule.notification_channel_ids.length > 0) {
      return rule.notification_channel_ids.includes(channel.id);
    }

    return true;
  });

  if (eligibleChannels.length === 0) {
    logger.info('No eligible notification channels for this alert', context);
    return results;
  }

  logger.info(`Dispatching to ${eligibleChannels.length} channels`, context, {
    channels: eligibleChannels.map((c) => c.name),
  });

  // Build base payload
  const isResolution = event.status === 'resolved';
  const basePayload: Omit<NotificationPayload, 'channel'> = {
    event,
    rule,
    title: formatAlertTitle(rule.name, event.severity, isResolution),
    message: formatAlertMessage(
      rule.name,
      rule.metric_key,
      event.triggered_value || 0,
      event.comparison_operator,
      event.threshold_value,
      event.severity,
      isResolution
    ),
  };

  // Send to each channel
  for (const channel of eligibleChannels) {
    const payload: NotificationPayload = {
      ...basePayload,
      channel,
    };

    let result: NotificationResult;
    let attempts = 0;

    if (dryRun) {
      // In dry-run mode, skip actual sending
      result = {
        success: true,
        latencyMs: 0,
        responseBody: 'DRY_RUN: Notification would be sent',
      };
      logger.info(`[DRY RUN] Would send to ${channel.name}`, context);
    } else {
      // Send with retries
      result = await sendWithRetry(channel, payload, context);
      attempts = result.success ? 1 : RETRY_DELAYS_MS.length + 1;
    }

    results.push({ channel, result, attempts });

    // Record to database
    await recordNotification(
      event.id,
      channel.id,
      result,
      attempts,
      supabaseClient,
      dryRun
    );

    // Update stats
    if (result.success) {
      context.stats.notificationsSent++;
    } else {
      context.stats.notificationsFailed++;
      context.errors.push(createError(result.error || 'Unknown error', undefined, channel.id));
    }
  }

  return results;
}

/**
 * Send notification with retry logic
 */
async function sendWithRetry(
  channel: NotificationChannel,
  payload: NotificationPayload,
  context: ExecutionContext
): Promise<NotificationResult> {
  let lastResult: NotificationResult | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      const delayMs = RETRY_DELAYS_MS[attempt - 1];
      logger.info(`Retrying ${channel.name} after ${delayMs}ms (attempt ${attempt + 1})`, context);
      await delay(delayMs);
    }

    try {
      lastResult = await sendToChannel(channel, payload);

      if (lastResult.success) {
        logger.info(`Successfully sent to ${channel.name}`, context, {
          channelId: channel.id,
          latencyMs: lastResult.latencyMs,
        });
        return lastResult;
      }

      logger.warn(`Failed to send to ${channel.name}: ${lastResult.error}`, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastResult = {
        success: false,
        error: message,
        latencyMs: 0,
      };
      logger.error(`Exception sending to ${channel.name}: ${message}`, context);
    }
  }

  return lastResult || {
    success: false,
    error: 'All retry attempts exhausted',
    latencyMs: 0,
  };
}

/**
 * Route to appropriate channel handler
 */
async function sendToChannel(
  channel: NotificationChannel,
  payload: NotificationPayload
): Promise<NotificationResult> {
  switch (channel.type) {
    case 'email':
      return sendEmailNotification(payload);

    case 'slack':
      return sendSlackNotification(payload);

    case 'webhook':
      return sendWebhookNotification(payload);

    case 'sms':
      return sendSmsNotification(payload);

    default:
      return {
        success: false,
        error: `Unknown channel type: ${channel.type}`,
        latencyMs: 0,
      };
  }
}

/**
 * Record notification attempt in database
 */
async function recordNotification(
  alertEventId: string,
  channelId: string,
  result: NotificationResult,
  attempts: number,
  supabaseClient: SupabaseClient,
  _dryRun: boolean
): Promise<void> {
  const status: DeliveryStatus = _dryRun
    ? 'skipped'
    : result.success
    ? 'sent'
    : 'failed';

  const { error } = await supabaseClient.from('alert_notifications').insert({
    alert_event_id: alertEventId,
    channel_id: channelId,
    delivery_status: status,
    attempt_count: attempts,
    response_code: result.responseCode || null,
    response_body: result.responseBody || null,
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null,
  });

  if (error) {
    logger.error(`Failed to record notification: ${error.message}`);
  }
}
