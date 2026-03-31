/**
 * Metrics types — InvocationMetrics, CostManifest, and related interfaces.
 */

import type { AgentRole } from '../../types.js';

/** Outcome of a single agent invocation. */
export type InvocationOutcome = 'pass' | 'fail' | 'error' | 'timeout';

/** A single agent invocation record. */
export interface InvocationMetrics {
  /** Invocation number (1-based, sequential). */
  readonly invocationNumber: number;
  /** Role of the agent. */
  readonly role: AgentRole;
  /** Input tokens consumed. */
  readonly inputTokens: number;
  /** Output tokens generated. */
  readonly outputTokens: number;
  /** Cached tokens (input tokens served from cache). */
  readonly cacheTokens: number;
  /** Estimated cost in USD. */
  readonly costUsd: number;
  /** Outcome of the invocation. */
  readonly outcome: InvocationOutcome;
  /** Number of skill references loaded. */
  readonly skillRefs: number;
  /** Duration in milliseconds. */
  readonly durationMs: number;
  /** ISO 8601 timestamp. */
  readonly timestamp: string;
  /** Phase number this invocation belongs to. */
  readonly phase: number;
  /** Task ID (if applicable). */
  readonly taskId: string | null;
}

/** Aggregated totals for a cost manifest. */
export interface CostManifestTotals {
  /** Total input tokens. */
  readonly totalInputTokens: number;
  /** Total output tokens. */
  readonly totalOutputTokens: number;
  /** Total cached tokens. */
  readonly totalCacheTokens: number;
  /** Total estimated cost in USD. */
  readonly totalCostUsd: number;
  /** Total number of invocations. */
  readonly totalInvocations: number;
  /** Number of successful invocations. */
  readonly successfulInvocations: number;
  /** Number of failed invocations (retries). */
  readonly failedInvocations: number;
  /** Total duration in milliseconds. */
  readonly totalDurationMs: number;
}

/** Per-role aggregation. */
export interface RoleMetrics {
  /** Agent role. */
  readonly role: AgentRole;
  /** Number of invocations for this role. */
  readonly invocationCount: number;
  /** Total cost for this role. */
  readonly totalCostUsd: number;
  /** First-pass rate (pass on first attempt). */
  readonly firstPassRate: number;
  /** Average duration per invocation in milliseconds. */
  readonly avgDurationMs: number;
}

/** Per-phase aggregation. */
export interface PhaseMetrics {
  /** Phase number. */
  readonly phase: number;
  /** Total cost for this phase. */
  readonly totalCostUsd: number;
  /** Number of invocations in this phase. */
  readonly invocationCount: number;
  /** Number of retries in this phase. */
  readonly retryCount: number;
}

/** The full cost manifest for a pipeline run. */
export interface CostManifest {
  /** Pipeline run identifier. */
  readonly runId: string;
  /** All invocation records. */
  readonly invocations: readonly InvocationMetrics[];
  /** Aggregated totals. */
  readonly totals: CostManifestTotals;
  /** Per-role breakdown. */
  readonly byRole: readonly RoleMetrics[];
  /** Per-phase breakdown. */
  readonly byPhase: readonly PhaseMetrics[];
}
