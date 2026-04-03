/**
 * Metrics helper — thin pure wrappers for recording tool results
 * and calculating aggregated totals.
 */

import type { AgentRole } from '../../types.js';
import type {
  InvocationMetrics,
  InvocationOutcome,
  CostManifestTotals,
} from '../metrics/types.js';

/** Input data for constructing an InvocationMetrics record. */
interface ToolResultData {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheTokens: number;
  readonly costUsd: number;
  readonly outcome: InvocationOutcome;
  readonly skillRefs: number;
  readonly durationMs: number;
}

interface RecordToolResultInput {
  readonly invocationNumber: number;
  readonly role: AgentRole;
  readonly phase: number;
  readonly taskId: string | null;
  readonly result: ToolResultData;
}

/**
 * Construct a complete InvocationMetrics record with an ISO 8601 timestamp.
 */
export function recordToolResult(
  input: RecordToolResultInput
): InvocationMetrics {
  const { invocationNumber, role, phase, taskId, result } = input;
  return {
    invocationNumber,
    role,
    phase,
    taskId,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    cacheTokens: result.cacheTokens,
    costUsd: result.costUsd,
    outcome: result.outcome,
    skillRefs: result.skillRefs,
    durationMs: result.durationMs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compute aggregated totals from an array of invocation records.
 */
export function calculateTotals(
  invocations: readonly InvocationMetrics[]
): CostManifestTotals {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheTokens = 0;
  let totalCostUsd = 0;
  let totalDurationMs = 0;
  let successfulInvocations = 0;
  let failedInvocations = 0;

  for (const inv of invocations) {
    totalInputTokens += inv.inputTokens;
    totalOutputTokens += inv.outputTokens;
    totalCacheTokens += inv.cacheTokens;
    totalCostUsd += inv.costUsd;
    totalDurationMs += inv.durationMs;
    if (inv.outcome === 'pass') {
      successfulInvocations++;
    } else {
      failedInvocations++;
    }
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCacheTokens,
    totalCostUsd,
    totalInvocations: invocations.length,
    successfulInvocations,
    failedInvocations,
    totalDurationMs,
  };
}
