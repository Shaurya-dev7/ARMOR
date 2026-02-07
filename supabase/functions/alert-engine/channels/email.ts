/// <reference path="../../deno.d.ts" />
/**
 * Email Notification Channel
 * Sends email notifications via Resend API
 */

import type { NotificationPayload, NotificationResult } from '../types.ts';
import { getSeverityColor } from '../utils.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send email notification using Resend
 */
export async function sendEmailNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const startTime = Date.now();
  const apiKey = Deno.env.get('RESEND_API_KEY');

  if (!apiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY environment variable not set',
      latencyMs: Date.now() - startTime,
    };
  }

  const { channel, event, rule, title, message } = payload;
  const config = channel.config;

  if (!config.to || config.to.length === 0) {
    return {
      success: false,
      error: 'No recipient email addresses configured',
      latencyMs: Date.now() - startTime,
    };
  }

  const htmlContent = generateEmailHtml(payload);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from || 'alerts@example.com',
        to: config.to,
        subject: title,
        html: htmlContent,
      }),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return {
        success: false,
        responseCode: response.status,
        responseBody,
        error: `Resend API error: ${response.status}`,
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
 * Generate HTML email content
 */
function generateEmailHtml(payload: NotificationPayload): string {
  const { event, rule, message } = payload;
  const color = getSeverityColor(event.severity);
  const isResolved = event.status === 'resolved';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: ${color}; padding: 20px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">
        ${isResolved ? '✅ Alert Resolved' : '🚨 Alert Triggered'}
      </h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">
        ${rule.name}
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 120px;">Severity</td>
          <td style="padding: 8px 0; font-weight: 600; text-transform: uppercase;">${event.severity}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Metric</td>
          <td style="padding: 8px 0; font-family: monospace;">${rule.metric_key}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Current Value</td>
          <td style="padding: 8px 0; font-weight: 600;">${event.triggered_value}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Threshold</td>
          <td style="padding: 8px 0;">${event.comparison_operator} ${event.threshold_value}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Time</td>
          <td style="padding: 8px 0;">${new Date(event.created_at).toLocaleString()}</td>
        </tr>
      </table>
      
      ${rule.description ? `
      <div style="margin-top: 20px; padding: 16px; background: #f9f9f9; border-radius: 4px;">
        <p style="margin: 0; color: #666; font-size: 14px;">${rule.description}</p>
      </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div style="padding: 16px 24px; background: #f9f9f9; border-top: 1px solid #eee; font-size: 12px; color: #999;">
      Alert ID: ${event.id}
    </div>
  </div>
</body>
</html>
  `.trim();
}
