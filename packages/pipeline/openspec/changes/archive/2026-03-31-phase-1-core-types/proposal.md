## Why

Phase 0 established the project skeleton but all source files are empty placeholders. No downstream module (ROADMAP parser, HANDOFF manager, orchestrator, quality gates) can be implemented until the shared type contracts exist. Phase 1 defines these contracts so that Phases 2–10 can develop against stable interfaces in parallel.

## What Changes

- Define ROADMAP domain types: `Phase`, `Task`, `ParallelGroup`, `Roadmap` interfaces in `src/lib/roadmap/types.ts`
- Define HANDOFF domain types: `HandoffState`, `TaskLog`, `Convention`, `CompressedHistory` interfaces in `src/lib/handoff/types.ts`
- Define pipeline state types: `PipelineState`, `PhaseState`, `ExecutionMode`, `DriftSentinel` in `src/types.ts`
- Define quality gate types: `GateResult`, `CheckResult`, `GateVerdict`, `GateName` in `src/lib/quality/types.ts`
- Define metrics types: `InvocationMetrics`, `CostManifest`, `ToolResultMetadata` in `src/lib/metrics/types.ts`
- Define orchestrator types: `Intent`, `Strategy`, `SessionState`, `WakeContext` in `src/lib/orchestrator/types.ts`
- Create Zod schemas for `forge.config.json` validation in `src/lib/config/schema.ts` with `ForgeConfigSchema` and inferred `ForgeConfig` type
- Write type-level tests validating schema parsing, type assignability, and edge cases

## Capabilities

### New Capabilities

- `roadmap-types`: ROADMAP domain interfaces — Phase, Task, ParallelGroup, Roadmap, and task complexity classification
- `handoff-types`: HANDOFF domain interfaces — HandoffState, TaskLog, Convention, CompressedHistory, and wake context
- `pipeline-types`: Pipeline execution state — PipelineState, PhaseState, ExecutionMode, DriftSentinel, and failure handling
- `quality-types`: Quality gate contracts — GateResult, CheckResult, GateVerdict, GateName, and self-correction loop types
- `metrics-types`: Observability and cost tracking — InvocationMetrics, CostManifest, ToolResultMetadata
- `orchestrator-types`: Session and routing — Intent, Strategy, SessionState, WakeContext
- `config-schema`: Zod-validated configuration — ForgeConfigSchema with layered config support

### Modified Capabilities

_None — no existing specs are changing._

## Impact

- **Files created/modified**: 7 type files across `src/` and `src/lib/`, plus 1 test file
- **APIs**: These types become the public contract for all downstream modules — any future change requires updating these first
- **Dependencies**: Uses only `zod` (already installed) for schema validation in `config/schema.ts`; all other files are pure TypeScript interfaces with zero runtime dependencies
- **Systems**: No runtime behavior changes — this is purely compile-time type infrastructure
