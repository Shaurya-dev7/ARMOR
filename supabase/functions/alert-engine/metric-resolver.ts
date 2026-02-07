/// <reference path="../deno.d.ts" />
/**
 * Metric Resolver
 * Fetches current metric values from various sources
 */

import type {
  AlertRule,
  MetricResolutionResult,
  SourceConfig,
  SupabaseClient,
} from './types.ts';
import { withTimeout } from './utils.ts';

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Resolve the current value of a metric based on its source type
 */
export async function resolveMetricValue(
  rule: AlertRule,
  supabaseClient: SupabaseClient
): Promise<MetricResolutionResult> {
  const startTime = Date.now();

  try {
    switch (rule.source_type) {
      case 'api':
        return await resolveApiMetric(rule.source_config, startTime);

      case 'db':
        return await resolveDbMetric(rule.source_config, supabaseClient, startTime);

      case 'internal_metric':
        return await resolveInternalMetric(rule.source_config, startTime);

      default:
        return {
          value: null,
          rawValue: null,
          error: `Unknown source type: ${rule.source_type}`,
          latencyMs: Date.now() - startTime,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      value: null,
      rawValue: null,
      error: message,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Resolve metric from external API
 */
async function resolveApiMetric(
  config: SourceConfig,
  startTime: number
): Promise<MetricResolutionResult> {
  if (!config.url) {
    return {
      value: null,
      rawValue: null,
      error: 'API source requires url in config',
      latencyMs: Date.now() - startTime,
    };
  }

  const timeout = config.timeout_ms || DEFAULT_TIMEOUT_MS;

  const fetchPromise = fetch(config.url, {
    method: config.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  const response = await withTimeout(
    fetchPromise,
    timeout,
    `API request timed out after ${timeout}ms`
  );

  if (!response.ok) {
    return {
      value: null,
      rawValue: null,
      error: `API returned status ${response.status}`,
      latencyMs: Date.now() - startTime,
    };
  }

  const data = await response.json();
  const rawValue = data;

  // Extract value using JSONPath-like notation (simplified)
  const value = extractValue(data, config.path || '$');

  if (typeof value !== 'number') {
    return {
      value: null,
      rawValue,
      error: `Extracted value is not a number: ${typeof value}`,
      latencyMs: Date.now() - startTime,
    };
  }

  return {
    value,
    rawValue,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Resolve metric from database query
 */
async function resolveDbMetric(
  config: SourceConfig,
  supabaseClient: SupabaseClient,
  startTime: number
): Promise<MetricResolutionResult> {
  if (!config.query) {
    return {
      value: null,
      rawValue: null,
      error: 'DB source requires query in config',
      latencyMs: Date.now() - startTime,
    };
  }

  // Execute raw SQL query via RPC function
  // Assumes you have created a secure RPC function for this
  const { data, error } = await supabaseClient.rpc('execute_metric_query', {
    query_text: config.query,
  });

  if (error) {
    return {
      value: null,
      rawValue: null,
      error: `Database query failed: ${error.message}`,
      latencyMs: Date.now() - startTime,
    };
  }

  const rawValue = data;

  // Extract the first numeric value from the result
  let value: number | null = null;

  if (Array.isArray(data) && data.length > 0) {
    const firstRow = data[0];
    const firstValue = Object.values(firstRow)[0];
    value = typeof firstValue === 'number' ? firstValue : parseFloat(String(firstValue));
  } else if (typeof data === 'number') {
    value = data;
  }

  if (value === null || isNaN(value)) {
    return {
      value: null,
      rawValue,
      error: 'Could not extract numeric value from query result',
      latencyMs: Date.now() - startTime,
    };
  }

  return {
    value,
    rawValue,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Resolve internal system metric
 */
async function resolveInternalMetric(
  config: SourceConfig,
  startTime: number
): Promise<MetricResolutionResult> {
  if (!config.metric) {
    return {
      value: null,
      rawValue: null,
      error: 'Internal metric source requires metric name in config',
      latencyMs: Date.now() - startTime,
    };
  }

  // Built-in internal metrics
  const internalMetrics: Record<string, () => number> = {
    'system.timestamp': () => Date.now(),
    'system.random': () => Math.random() * 100,
    // Add more internal metrics as needed
  };

  const metricFn = internalMetrics[config.metric];

  if (!metricFn) {
    return {
      value: null,
      rawValue: null,
      error: `Unknown internal metric: ${config.metric}`,
      latencyMs: Date.now() - startTime,
    };
  }

  const value = metricFn();

  return {
    value,
    rawValue: { metric: config.metric, value },
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Extract value from object using simple path notation
 * Supports: $.field, $.field.nested, $.array[0].field
 */
function extractValue(obj: unknown, path: string): unknown {
  if (path === '$' || path === '') {
    return obj;
  }

  // Remove leading $. if present
  const cleanPath = path.replace(/^\$\.?/, '');

  if (!cleanPath) {
    return obj;
  }

  const parts = cleanPath.split(/\.|\[|\]/).filter(Boolean);
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
