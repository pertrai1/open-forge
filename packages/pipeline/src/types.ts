/**
 * Shared pipeline state types — PipelineState, PhaseState, ExecutionMode.
 */

/** Execution mode for the pipeline. */
export type ExecutionMode = 'single-phase' | 'continuous' | 'range';

/** Status of a pipeline phase. */
export type PhaseStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'blocked'
  | 'failed';

/** Agent role within the pipeline. */
export type AgentRole =
  | 'orchestrator'
  | 'test-author'
  | 'implementer'
  | 'gate-agent'
  | 'cleanup-agent';

/** Supported programming languages. */
export type Language = 'typescript' | 'javascript' | 'python' | 'go';

/** Log level for observability. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** State of a single phase during execution. */
export interface PhaseState {
  /** Phase number. */
  readonly phaseNumber: number;
  /** Phase name. */
  readonly phaseName: string;
  /** Current status. */
  readonly status: PhaseStatus;
  /** Task IDs that are still pending. */
  readonly pendingTasks: readonly string[];
  /** Task IDs that have been completed. */
  readonly completedTasks: readonly string[];
  /** Whether all quality gates have passed for this phase. */
  readonly qualityGatesPassed: boolean;
  /** Number of retry attempts made. */
  readonly retryCount: number;
  /** Maximum retry attempts allowed. */
  readonly maxRetries: number;
}

/** Overall pipeline execution state. */
export interface PipelineState {
  /** Unique pipeline run identifier. */
  readonly runId: string;
  /** Execution mode. */
  readonly mode: ExecutionMode;
  /** All phase states. */
  readonly phases: readonly PhaseState[];
  /** Index of the currently executing phase. */
  readonly currentPhaseIndex: number;
  /** ISO 8601 start timestamp. */
  readonly startedAt: string;
  /** ISO 8601 completion timestamp (null if still running). */
  readonly completedAt: string | null;
  /** Whether a drift sentinel has been detected. */
  readonly driftDetected: boolean;
}

/** Drift sentinel file content. */
export interface DriftSentinel {
  /** Phase number where drift was detected. */
  readonly phase: number;
  /** Reason for drift (e.g., "quality checks failed after 3 cycles"). */
  readonly reason: string;
  /** ISO 8601 timestamp. */
  readonly timestamp: string;
}

/** Blocker documented in PIPELINE-ISSUES.md. */
export interface PipelineIssue {
  /** Phase where the issue occurred. */
  readonly phase: number;
  /** Task ID (if applicable). */
  readonly taskId: string | null;
  /** Exact error message. */
  readonly errorMessage: string;
  /** Context: files, commands, expected outcome. */
  readonly context: string;
  /** What was tried to resolve it. */
  readonly attemptedSolutions: readonly string[];
  /** What the agent needs from a human. */
  readonly humanActionNeeded: string;
  /** ISO 8601 timestamp. */
  readonly timestamp: string;
}
