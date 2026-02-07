/// <reference path="../../deno.d.ts" />
/**
 * Slack Notification Channel
 * Sends notifications via Slack Incoming Webhooks
 */

import type { NotificationPayload, NotificationResult } from '../types.ts';
import { getSeverityColor, getSeverityEmoji } from '../utils.ts';

/**
 * Send Slack notification via webhook
 */
export async function sendSlackNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const startTime = Date.now();
  const { channel, event, rule } = payload;

  // Use channel-specific webhook or fallback to environment variable
  const webhookUrl = channel.config.webhook_url || Deno.env.get('SLACK_WEBHOOK_URL');

  if (!webhookUrl) {
    return {
      success: false,
      error: 'No Slack webhook URL configured',
      latencyMs: Date.now() - startTime,
    };
  }

  const slackMessage = buildSlackMessage(payload);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return {
        success: false,
        responseCode: response.status,
        responseBody,
        error: `Slack webhook error: ${response.status}`,
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      responseCode: response.status,
      responseBody,
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
 * Build Slack Block Kit message
 */
function buildSlackMessage(payload: NotificationPayload): Record<string, unknown> {
  const { event, rule, title } = payload;
  const color = getSeverityColor(event.severity);
  const emoji = getSeverityEmoji(event.severity);
  const isResolved = event.status === 'resolved';

  return {
    text: title, // Fallback for notifications
    blocks: [
      // Header
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${isResolved ? 'Alert Resolved' : 'Alert Triggered'}: ${rule.name}`,
          emoji: true,
        },
      },
      // Severity and time
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Severity:* ${event.severity.toUpperCase()} | *Time:* ${new Date(event.created_at).toLocaleString()}`,
          },
        ],
      },
      // Divider
      { type: 'divider' },
      // Metric details
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Metric:*\n\`${rule.metric_key}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Current Value:*\n${event.triggered_value}`,
          },
          {
            type: 'mrkdwn',
            text: `*Threshold:*\n${event.comparison_operator} ${event.threshold_value}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${isResolved ? '✅ Resolved' : '🔴 Active'}`,
          },
        ],
      },
    ],
    // Attachment for color sidebar
    attachments: [
      {
        color: color,
        blocks: rule.description
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: rule.description,
                },
              },
            ]
          : [],
      },
    ],
  };
}
