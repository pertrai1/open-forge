/**
 * Orchestrator types — Intent, Strategy, SessionState, and related interfaces.
 */

import type { ExecutionMode, PhaseState } from '../../types.js';

/** Intent classification for incoming requirements. */
export type Intent =
  | 'new-project'
  | 'feature-add'
  | 'bug-fix'
  | 'refactor'
  | 'migration';

/** Strategy mapped to each intent. */
export type Strategy =
  | 'full-pipeline'
  | 'incremental'
  | 'targeted'
  | 'transformation'
  | 'port';

/** Intent-to-strategy mapping. */
export interface IntentStrategyMapping {
  readonly intent: Intent;
  readonly strategy: Strategy;
  readonly description: string;
}

/** Session status. */
export type SessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** State of a single orchestrator session. */
export interface SessionState {
  /** Unique session identifier. */
  readonly sessionId: string;
  /** Current status. */
  readonly status: SessionStatus;
  /** Classified intent. */
  readonly intent: Intent;
  /** Selected strategy. */
  readonly strategy: Strategy;
  /** Execution mode. */
  readonly mode: ExecutionMode;
  /** Current phase state. */
  readonly currentPhase: PhaseState | null;
  /** Total phases in the roadmap. */
  readonly totalPhases: number;
  /** Number of completed phases. */
  readonly completedPhases: number;
  /** ISO 8601 start timestamp. */
  readonly startedAt: string;
  /** ISO 8601 last activity timestamp. */
  readonly lastActivityAt: string;
  /** Clarification rounds used (max 2). */
  readonly clarificationRoundsUsed: number;
  /** Maximum clarification rounds allowed. */
  readonly maxClarificationRounds: number;
}

/** Phase range for range execution mode. */
export interface PhaseRange {
  /** Start phase (inclusive). */
  readonly start: number;
  /** End phase (inclusive). */
  readonly end: number;
}

/** Options for starting a pipeline run. */
export interface PipelineRunOptions {
  /** Execution mode. */
  readonly mode: ExecutionMode;
  /** Specific phase number (for single-phase mode). */
  readonly phase?: number;
  /** Phase range (for range mode). */
  readonly range?: PhaseRange;
  /** Path to requirements file. */
  readonly requirementsPath?: string;
  /** Whether to resume from last checkpoint. */
  readonly resume?: boolean;
}
