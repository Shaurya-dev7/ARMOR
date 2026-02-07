/// <reference path="../../deno.d.ts" />
/**
 * SMS Notification Channel
 * Sends SMS notifications via Twilio
 */

import type { NotificationPayload, NotificationResult } from '../types.ts';
import { getSeverityEmoji } from '../utils.ts';

/**
 * Send SMS notification using Twilio
 */
export async function sendSmsNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const startTime = Date.now();

  // Get Twilio credentials from environment
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)',
      latencyMs: Date.now() - startTime,
    };
  }

  const { channel, event, rule } = payload;
  const config = channel.config;

  if (!config.phone_numbers || config.phone_numbers.length === 0) {
    return {
      success: false,
      error: 'No phone numbers configured',
      latencyMs: Date.now() - startTime,
    };
  }

  const message = buildSmsMessage(payload);
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + btoa(`${accountSid}:${authToken}`);

  // Send to all configured numbers
  const results: Array<{ to: string; success: boolean; error?: string }> = [];

  for (const toNumber of config.phone_numbers) {
    try {
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toNumber,
          From: fromNumber,
          Body: message,
        }),
      });

      const responseBody = await response.text();

      if (response.ok) {
        results.push({ to: toNumber, success: true });
      } else {
        results.push({ to: toNumber, success: false, error: `Status ${response.status}` });
      }
    } catch (error) {
      results.push({
        to: toNumber,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const allSuccess = results.every((r) => r.success);
  const failures = results.filter((r) => !r.success);

  return {
    success: allSuccess,
    responseBody: JSON.stringify(results),
    error: failures.length > 0 
      ? `Failed to send to: ${failures.map((f) => f.to).join(', ')}`
      : undefined,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Build SMS message text (limited to 160 chars for single segment)
 */
function buildSmsMessage(payload: NotificationPayload): string {
  const { event, rule } = payload;
  const emoji = getSeverityEmoji(event.severity);
  const isResolved = event.status === 'resolved';

  // Keep message concise for SMS
  const status = isResolved ? 'RESOLVED' : 'ALERT';
  const severity = event.severity.toUpperCase();

  return [
    `${emoji} ${status}: ${rule.name}`,
    `${severity} | ${rule.metric_key}`,
    `Value: ${event.triggered_value} (threshold: ${event.comparison_operator}${event.threshold_value})`,
  ].join('\n');
}
