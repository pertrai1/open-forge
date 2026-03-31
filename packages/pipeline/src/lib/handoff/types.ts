/**
 * HANDOFF types — HandoffState, TaskLog, Convention, and related interfaces.
 */

/** A single entry in the task log (append-only, last 5 verbatim). */
export interface TaskLogEntry {
  /** Task identifier (e.g., "1.3"). */
  readonly taskId: string;
  /** What was done. */
  readonly description: string;
  /** Key decision made during this task. */
  readonly keyDecision: string;
  /** Files created or modified. */
  readonly filesModified: readonly string[];
  /** Commit hash (if committed). */
  readonly commitHash: string;
  /** ISO 8601 timestamp. */
  readonly timestamp: string;
}

/** An active convention that implementers must follow. */
export interface Convention {
  /** Convention name (e.g., "Error handling pattern"). */
  readonly name: string;
  /** Description of the pattern. */
  readonly pattern: string;
  /** Why this convention exists. */
  readonly rationale: string;
  /** How to apply it. */
  readonly usage: string;
}

/** An architecture decision record. */
export interface ArchitectureDecision {
  /** Decision title. */
  readonly title: string;
  /** ISO 8601 date. */
  readonly date: string;
  /** What was decided. */
  readonly decision: string;
  /** Why this approach was chosen. */
  readonly rationale: string;
  /** Other options that were evaluated. */
  readonly alternativesConsidered: readonly string[];
}

/** Goal context traced from requirements. */
export interface GoalContext {
  /** The problem being solved (from REQUIREMENTS.md). */
  readonly problem: string;
  /** The relevant user story or capability. */
  readonly userStory: string;
  /** The spec requirement being built. */
  readonly specRequirement: string;
  /** What this task delivers. */
  readonly currentTask: string;
}

/** A compressed history entry (oldest entries condensed). */
export interface CompressedHistoryEntry {
  /** Range of tasks (e.g., "Tasks 1.1–1.4"). */
  readonly taskRange: string;
  /** Condensed summary. */
  readonly summary: string;
  /** Files involved. */
  readonly files: readonly string[];
}

/** An open issue or blocker. */
export interface OpenIssue {
  /** Issue description. */
  readonly description: string;
  /** Whether the issue is resolved. */
  readonly resolved: boolean;
}

/** Current state section of HANDOFF (rewritten on every update). */
export interface CurrentState {
  /** Tasks completed so far. */
  readonly tasksCompleted: readonly string[];
  /** Packages/modules touched. */
  readonly packagesTouched: readonly string[];
  /** Current branch name. */
  readonly branch: string;
  /** Current phase number. */
  readonly currentPhase: number;
  /** Overall status. */
  readonly status: 'in-progress' | 'blocked' | 'complete';
}

/** The full HANDOFF state bridging sessions. */
export interface HandoffState {
  /** Session identifier. */
  readonly sessionId: string;
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;
  /** ISO 8601 last update timestamp. */
  readonly updatedAt: string;
  /** Current state (rewritten on every update, ~15 lines max). */
  readonly currentState: CurrentState;
  /** Goal context traced from requirements. */
  readonly goalContext: GoalContext;
  /** Active conventions (mandatory to follow). */
  readonly conventions: readonly Convention[];
  /** Architecture decision records. */
  readonly architectureDecisions: readonly ArchitectureDecision[];
  /** Open issues and blockers. */
  readonly openIssues: readonly OpenIssue[];
  /** Last 5 task log entries (verbatim). */
  readonly taskLog: readonly TaskLogEntry[];
  /** Compressed history (oldest entries, max ~10 bullets). */
  readonly compressedHistory: readonly CompressedHistoryEntry[];
}

/** Structured wake context for session handoff. */
export interface WakeContext {
  /** Change name. */
  readonly changeName: string;
  /** Branch name. */
  readonly branch: string;
  /** Next task ID and description. */
  readonly nextTask: string;
  /** Progress string (e.g., "3/8 tasks complete"). */
  readonly progress: string;
  /** Goal context summary. */
  readonly goalContext: string;
  /** Packages touched. */
  readonly packagesTouched: readonly string[];
  /** Key active conventions. */
  readonly activeConventions: readonly string[];
  /** Open issues summary. */
  readonly openIssues: readonly string[];
  /** Last commit hash and message. */
  readonly lastCommit: string;
}
