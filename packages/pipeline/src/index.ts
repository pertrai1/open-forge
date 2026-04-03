// @open-forge/pipeline entry point

// Config
export {
  ForgeConfigSchema,
  ProjectConfigSchema,
  AgentConfigSchema,
  PipelineConfigSchema,
  AgentsConfigSchema,
  QualityConfigSchema,
  LoggingConfigSchema,
} from './lib/config/schema.js';
export type {
  ForgeConfig,
  ProjectConfig,
  PipelineConfig,
  AgentsConfig,
  QualityConfig,
  LoggingConfig,
} from './lib/config/schema.js';

// Handoff
export {
  readHandoff,
  writeHandoff,
  appendTaskLog,
  updateCurrentState,
  HandoffReadError,
  HandoffWriteError,
} from './lib/handoff/manager.js';
export type {
  HandoffState,
  TaskLogEntry,
  CurrentState,
  GoalContext,
  Convention,
  ArchitectureDecision,
  CompressedHistoryEntry,
  OpenIssue,
  WakeContext,
} from './lib/handoff/types.js';

// Helper — Checkpoint
export {
  createCheckpoint,
  rollbackToCheckpoint,
  deleteCheckpoints,
  listCheckpoints,
  getCheckpointDiff,
  CheckpointNotFoundError,
  CheckpointBudgetExceededError,
  CheckpointGitError,
} from './lib/helper/checkpoint.js';
export type { CheckpointTarget, CheckpointDiffOptions } from './lib/helper/checkpoint.js';

// Helper — Drift sentinel
export {
  writeDriftSentinel,
  readDriftSentinel,
  checkDriftSentinel,
  clearDriftSentinel,
  DriftSentinelError,
} from './lib/helper/drift.js';

// Helper — Roadmap task marking
export {
  markTaskDone,
  markTaskUndone,
  getNextTask,
  RoadmapTaskNotFoundError,
} from './lib/helper/roadmap.js';

// Helper — Handoff utilities
export {
  getActiveConventions,
  getWakeContext,
  getLastCommit,
} from './lib/helper/handoff.js';

// Helper — Metrics utilities
export {
  recordToolResult,
  calculateTotals,
} from './lib/helper/metrics.js';

// Helper — Injection scanner
export {
  scanForInjection,
  sanitizeUnicode,
} from './lib/helper/scanner.js';
export type { ScanFindingType, ScanFinding, ScanResult } from './lib/helper/scanner.js';

// Metrics
export {
  logInvocation,
  readInvocations,
  getCostManifest,
} from './lib/metrics/logger.js';
export type {
  InvocationOutcome,
  InvocationMetrics,
  CostManifest,
  CostManifestTotals,
  RoleMetrics,
  PhaseMetrics,
} from './lib/metrics/types.js';

// Orchestrator
export type {
  Intent,
  Strategy,
  IntentStrategyMapping,
  SessionStatus,
  SessionState,
  PhaseRange,
  PipelineRunOptions,
} from './lib/orchestrator/types.js';

// Quality
export type {
  GateName,
  CheckCategory,
  GateVerdict,
  FindingSeverity,
  GateFinding,
  CheckResult,
  GateResult,
  GateSequenceResult,
} from './lib/quality/types.js';

// Roadmap
export { parseRoadmap, parsePhase, parseTask, RoadmapParseError } from './lib/roadmap/parser.js';
export { generateRoadmap } from './lib/roadmap/generator.js';
export { detectParallelGroups } from './lib/roadmap/parallel.js';
export type {
  RoadmapTask,
  RoadmapPhase,
  Roadmap,
  ParallelGroup,
  TaskComplexity,
  TaskStatus,
} from './lib/roadmap/types.js';

// Shared types
export type {
  ExecutionMode,
  PhaseStatus,
  AgentRole,
  ToolRestriction,
  Language,
  ModelTier,
  LogLevel,
  PhaseState,
  PipelineState,
  DriftSentinel,
  PipelineIssue,
} from './types.js';
