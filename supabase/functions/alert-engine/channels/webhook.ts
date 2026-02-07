/// <reference path="../../deno.d.ts" />
/**
 * Webhook Notification Channel
 * Sends notifications to generic HTTP endpoints
 */

import type { NotificationPayload, NotificationResult } from '../types.ts';

/**
 * Send webhook notification
 */
export async function sendWebhookNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const startTime = Date.now();
  const { channel, event, rule } = payload;
  const config = channel.config;

  if (!config.url) {
    return {
      success: false,
      error: 'No webhook URL configured',
      latencyMs: Date.now() - startTime,
    };
  }

  const webhookPayload = buildWebhookPayload(payload);

  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseBody = await response.text();

    // Consider 2xx as success
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        responseCode: response.status,
        responseBody,
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      success: false,
      responseCode: response.status,
      responseBody,
      error: `Webhook returned status ${response.status}`,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Build standardized webhook payload
 */
function buildWebhookPayload(payload: NotificationPayload): Record<string, unknown> {
  const { event, rule } = payload;

  return {
    type: 'alert',
    timestamp: new Date().toISOString(),
    alert: {
      id: event.id,
      rule_id: rule.id,
      name: rule.name,
      description: rule.description,
      status: event.status,
      severity: event.severity,
      metric: {
        key: rule.metric_key,
        current_value: event.triggered_value,
        threshold_value: event.threshold_value,
        operator: event.comparison_operator,
      },
      source_type: rule.source_type,
      triggered_at: event.created_at,
      resolved_at: event.resolved_at,
      context: event.context,
    },
    tags: rule.tags || [],
  };
}
