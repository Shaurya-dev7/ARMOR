/**
 * Alert Engine Unit Tests
 * Run with: deno test --allow-env evaluator.test.ts
 */

// @ts-ignore - Deno testing module
import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.177.0/testing/asserts.ts';

import { compareValues, isInCooldown, severityMeetsMinimum } from './utils.ts';

// Declare Deno global for TypeScript
declare const Deno: {
  test(name: string, fn: () => void): void;
};

// =====================================================
// COMPARISON TESTS
// =====================================================

Deno.test('compareValues: greater than', () => {
  assertEquals(compareValues(10, '>', 5), true);
  assertEquals(compareValues(5, '>', 10), false);
  assertEquals(compareValues(5, '>', 5), false);
});

Deno.test('compareValues: less than', () => {
  assertEquals(compareValues(5, '<', 10), true);
  assertEquals(compareValues(10, '<', 5), false);
  assertEquals(compareValues(5, '<', 5), false);
});

Deno.test('compareValues: greater than or equal', () => {
  assertEquals(compareValues(10, '>=', 5), true);
  assertEquals(compareValues(5, '>=', 5), true);
  assertEquals(compareValues(4, '>=', 5), false);
});

Deno.test('compareValues: less than or equal', () => {
  assertEquals(compareValues(5, '<=', 10), true);
  assertEquals(compareValues(5, '<=', 5), true);
  assertEquals(compareValues(6, '<=', 5), false);
});

Deno.test('compareValues: equal', () => {
  assertEquals(compareValues(5, '=', 5), true);
  assertEquals(compareValues(5, '=', 10), false);
});

Deno.test('compareValues: not equal', () => {
  assertEquals(compareValues(5, '!=', 10), true);
  assertEquals(compareValues(5, '!=', 5), false);
});

// =====================================================
// COOLDOWN TESTS
// =====================================================

Deno.test('isInCooldown: null last triggered', () => {
  assertEquals(isInCooldown(null, 60), false);
});

Deno.test('isInCooldown: within cooldown period', () => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  assertEquals(isInCooldown(fiveMinutesAgo, 60), true); // 60 min cooldown
});

Deno.test('isInCooldown: after cooldown period', () => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
  assertEquals(isInCooldown(twoHoursAgo, 60), false); // 60 min cooldown expired
});

Deno.test('isInCooldown: exactly at cooldown expiry', () => {
  const now = new Date();
  const exactCooldown = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  // At exactly 60 mins, cooldown should be expired
  assertEquals(isInCooldown(exactCooldown, 60), false);
});

// =====================================================
// SEVERITY TESTS
// =====================================================

Deno.test('severityMeetsMinimum: info meets info', () => {
  assertEquals(severityMeetsMinimum('info', 'info'), true);
});

Deno.test('severityMeetsMinimum: warning meets info', () => {
  assertEquals(severityMeetsMinimum('warning', 'info'), true);
});

Deno.test('severityMeetsMinimum: critical meets info', () => {
  assertEquals(severityMeetsMinimum('critical', 'info'), true);
});

Deno.test('severityMeetsMinimum: info does not meet warning', () => {
  assertEquals(severityMeetsMinimum('info', 'warning'), false);
});

Deno.test('severityMeetsMinimum: warning meets warning', () => {
  assertEquals(severityMeetsMinimum('warning', 'warning'), true);
});

Deno.test('severityMeetsMinimum: critical meets critical', () => {
  assertEquals(severityMeetsMinimum('critical', 'critical'), true);
});

Deno.test('severityMeetsMinimum: warning does not meet critical', () => {
  assertEquals(severityMeetsMinimum('warning', 'critical'), false);
});
