import {
  recordToolResult,
  calculateTotals,
} from '../src/lib/helper/metrics.js';
import type { InvocationMetrics } from '../src/lib/metrics/types.js';

describe('recordToolResult', () => {
  it('should build metrics record with all fields', () => {
    const result = recordToolResult({
      invocationNumber: 1,
      role: 'implementer',
      phase: 3,
      taskId: '3.1',
      result: {
        inputTokens: 1000,
        outputTokens: 200,
        cacheTokens: 500,
        costUsd: 0.05,
        outcome: 'pass',
        skillRefs: 2,
        durationMs: 3000,
      },
    });

    expect(result.invocationNumber).toBe(1);
    expect(result.role).toBe('implementer');
    expect(result.phase).toBe(3);
    expect(result.taskId).toBe('3.1');
    expect(result.inputTokens).toBe(1000);
    expect(result.outputTokens).toBe(200);
    expect(result.cacheTokens).toBe(500);
    expect(result.costUsd).toBe(0.05);
    expect(result.outcome).toBe('pass');
    expect(result.skillRefs).toBe(2);
    expect(result.durationMs).toBe(3000);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should handle null taskId', () => {
    const result = recordToolResult({
      invocationNumber: 2,
      role: 'orchestrator',
      phase: 1,
      taskId: null,
      result: {
        inputTokens: 500,
        outputTokens: 100,
        cacheTokens: 0,
        costUsd: 0.01,
        outcome: 'pass',
        skillRefs: 0,
        durationMs: 1000,
      },
    });
    expect(result.taskId).toBeNull();
  });
});

describe('calculateTotals', () => {
  const makeMetrics = (
    overrides: Partial<InvocationMetrics>
  ): InvocationMetrics => ({
    invocationNumber: 1,
    role: 'implementer',
    inputTokens: 100,
    outputTokens: 10,
    cacheTokens: 50,
    costUsd: 0.01,
    outcome: 'pass',
    skillRefs: 1,
    durationMs: 100,
    timestamp: '2025-01-01T00:00:00Z',
    phase: 1,
    taskId: null,
    ...overrides,
  });

  it('should sum all numeric fields', () => {
    const invocations = [
      makeMetrics({
        inputTokens: 100,
        outputTokens: 10,
        cacheTokens: 50,
        costUsd: 0.01,
        durationMs: 100,
      }),
      makeMetrics({
        inputTokens: 200,
        outputTokens: 20,
        cacheTokens: 100,
        costUsd: 0.02,
        durationMs: 200,
      }),
      makeMetrics({
        inputTokens: 300,
        outputTokens: 30,
        cacheTokens: 150,
        costUsd: 0.03,
        durationMs: 300,
      }),
    ];
    const totals = calculateTotals(invocations);
    expect(totals.totalInputTokens).toBe(600);
    expect(totals.totalOutputTokens).toBe(60);
    expect(totals.totalCacheTokens).toBe(300);
    expect(totals.totalCostUsd).toBeCloseTo(0.06);
    expect(totals.totalDurationMs).toBe(600);
    expect(totals.totalInvocations).toBe(3);
  });

  it('should count successes and failures', () => {
    const invocations = [
      makeMetrics({ outcome: 'pass' }),
      makeMetrics({ outcome: 'fail' }),
      makeMetrics({ outcome: 'error' }),
      makeMetrics({ outcome: 'pass' }),
      makeMetrics({ outcome: 'timeout' }),
    ];
    const totals = calculateTotals(invocations);
    expect(totals.successfulInvocations).toBe(2);
    expect(totals.failedInvocations).toBe(3);
  });

  it('should return zeros for empty array', () => {
    const totals = calculateTotals([]);
    expect(totals.totalInputTokens).toBe(0);
    expect(totals.totalOutputTokens).toBe(0);
    expect(totals.totalCacheTokens).toBe(0);
    expect(totals.totalCostUsd).toBe(0);
    expect(totals.totalDurationMs).toBe(0);
    expect(totals.totalInvocations).toBe(0);
    expect(totals.successfulInvocations).toBe(0);
    expect(totals.failedInvocations).toBe(0);
  });
});
