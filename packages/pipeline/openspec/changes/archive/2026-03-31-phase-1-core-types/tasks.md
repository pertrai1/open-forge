## 1. ROADMAP Types

- [x] 1.1 Write failing tests for TaskComplexity exhaustive matching and Task interface shape
- [x] 1.2 Define TaskComplexity, Task, ParallelGroup, Phase, and Roadmap in `src/lib/roadmap/types.ts`
- [x] 1.3 Verify tests pass and commit

## 2. HANDOFF Types

- [x] 2.1 Write failing tests for HandoffState, CurrentState, GoalContext, TaskLog, Convention, WakeContext shapes
- [x] 2.2 Define CurrentState, GoalContext, Convention, TaskLog, WakeContext, and HandoffState in `src/lib/handoff/types.ts`
- [x] 2.3 Verify tests pass and commit

## 3. Pipeline State Types

- [x] 3.1 Write failing tests for ExecutionMode, PipelineStatus, PhaseState, PipelineState, DriftSentinel, PhaseRange
- [x] 3.2 Define ExecutionMode, PipelineStatus, PhaseState, PipelineState, DriftSentinel, and PhaseRange in `src/types.ts`
- [x] 3.3 Verify tests pass and commit

## 4. Quality Gate Types

- [x] 4.1 Write failing tests for GateName, GateVerdict, CheckResult, GateResult, QualityGateSequence
- [x] 4.2 Define GateName, GateVerdict, CheckResult, GateResult, and QualityGateSequence in `src/lib/quality/types.ts`
- [x] 4.3 Verify tests pass and commit

## 5. Metrics Types

- [x] 5.1 Write failing tests for InvocationOutcome, InvocationMetrics, CostManifest, ToolResultMetadata
- [x] 5.2 Define InvocationOutcome, InvocationMetrics, CostManifest, and ToolResultMetadata in `src/lib/metrics/types.ts`
- [x] 5.3 Verify tests pass and commit

## 6. Orchestrator Types

- [x] 6.1 Write failing tests for Intent, Strategy, SessionState, IntentStrategyMap
- [x] 6.2 Define Intent, Strategy, SessionState, and IntentStrategyMap in `src/lib/orchestrator/types.ts`
- [x] 6.3 Verify tests pass and commit

## 7. Config Schema (Zod)

- [x] 7.1 Write failing tests for ForgeConfigSchema parse (valid full, empty, invalid language), ForgeConfig type, SUPPORTED_LANGUAGES
- [x] 7.2 Define SUPPORTED_LANGUAGES, ForgeConfigSchema, and ForgeConfig in `src/lib/config/schema.ts`
- [x] 7.3 Verify tests pass and commit

## 8. Final Verification

- [x] 8.1 Run full typecheck (`nx run @open-forge/pipeline:typecheck`) — zero errors
- [x] 8.2 Run full lint (`nx run @open-forge/pipeline:lint`) — zero errors
- [x] 8.3 Run full test suite (`nx run @open-forge/pipeline:test`) — all pass
