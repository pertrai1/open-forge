## Why

The telemetry package can emit and query pipeline events (Phases 0–2), but has no mechanism to evaluate whether a pipeline is operating within acceptable bounds. Without constraint evaluation, there is nothing to prevent runaway token spend, infinite retry loops, or stages that exceed duration limits. This is the critical-path blocker for Wave 1 — the pipeline orchestrator and evaluations integration both depend on constraints being functional.

## What Changes

- Implement the `ConstraintEvaluator` interface already defined in `src/types.ts` — `evaluate()`, `addConstraint()`, `removeConstraint()`
- Implement the `Constraint` type's evaluation contract — threshold, boolean, and aggregation constraint types scoped per-stage or per-pipeline
- Provide a default constraint set covering the five common pipeline guardrails: max-retries, token-budget, duration, consecutive-failures, and lint-violations
- Provide builder utilities (`threshold()`, `boolean()`, `aggregation()`) for constructing constraints declaratively
- All constraint evaluations must complete in < 50ms p99 for 1000 events (NF-002)

## Capabilities

### New Capabilities

- `constraint-evaluator`: Core constraint evaluation engine — add/remove constraints, evaluate against pipeline events, return structured results with violations and severity levels
- `default-constraints`: Pre-built constraint implementations for agent pipelines — max-retries, token-budget, duration, consecutive-failures, lint-violations
- `constraint-builder`: Declarative builder utilities for constructing threshold, boolean, and aggregation constraints

### Modified Capabilities

(No existing specs require modification — constraint types were already defined in Phase 0)

## Impact

- **Package**: `@open-forge/telemetry` only — no cross-package changes
- **Files added**: `src/ConstraintEvaluatorImpl.ts`, `src/constraints/defaults.ts`, `src/constraints/builder.ts`, `tests/constraints.test.ts`
- **Existing files**: No modifications to `TelemetryImpl.ts`, `types.ts`, or storage backends
- **Dependencies**: Zero new runtime dependencies (NF-022)
- **Downstream**: Unblocks telemetry Phase 4 (`createTelemetry()` factory), which wires constraints + telemetry together
- **Requirements covered**: F-020, F-021, F-022, F-023, F-030, F-031, F-032, F-034, NF-002
