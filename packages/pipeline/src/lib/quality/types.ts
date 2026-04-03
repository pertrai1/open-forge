/**
 * Quality gate types — GateResult, CheckResult, and gate-related interfaces.
 */

/** Names of the six sequential quality gates. */
export type GateName =
  | 'verify'
  | 'qa-testing'
  | 'security-audit'
  | 'architect-review'
  | 'code-review'
  | 'integration-testing';

/** Quality check categories (pre-gate checks). */
export type CheckCategory = 'lint' | 'typecheck' | 'test' | 'build';

/** Verdict from a quality gate. */
export type GateVerdict = 'pass' | 'fail' | 'request-changes';

/** Severity of a finding within a gate. */
export type FindingSeverity = 'must-fix' | 'should-fix' | 'suggestion';

/** A single finding from a quality gate. */
export interface GateFinding {
  /** Severity level. */
  readonly severity: FindingSeverity;
  /** File path where the finding applies. */
  readonly filePath: string;
  /** Line number (if applicable). */
  readonly line: number | null;
  /** Description of the finding. */
  readonly description: string;
  /** Suggested remediation. */
  readonly remediation: string;
}

/** Result of a single quality check (lint, typecheck, test, build). */
export interface CheckResult {
  /** Which check was run. */
  readonly category: CheckCategory;
  /** Whether the check passed. */
  readonly passed: boolean;
  /** Exit code from the check command. */
  readonly exitCode: number;
  /** Output from the check (stdout + stderr). */
  readonly output: string;
  /** Duration in milliseconds. */
  readonly durationMs: number;
}

/** Result of a full quality gate. */
export interface GateResult {
  /** Which gate was run. */
  readonly gate: GateName;
  /** Overall verdict. */
  readonly verdict: GateVerdict;
  /** Individual findings. */
  readonly findings: readonly GateFinding[];
  /** Number of must-fix findings. */
  readonly mustFixCount: number;
  /** Duration in milliseconds. */
  readonly durationMs: number;
  /** Which attempt this was (1-based). */
  readonly attempt: number;
}

/** Summary of all gates for a phase. */
export interface GateSequenceResult {
  /** Results from each gate in order. */
  readonly gateResults: readonly GateResult[];
  /** Whether all gates passed. */
  readonly allPassed: boolean;
  /** The first gate that failed (null if all passed). */
  readonly firstFailedGate: GateName | null;
  /** Total duration across all gates in milliseconds. */
  readonly totalDurationMs: number;
}
