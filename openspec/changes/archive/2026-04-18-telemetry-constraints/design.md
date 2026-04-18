## Context

The telemetry package (`@open-forge/telemetry`) has completed Phases 0–2: types are defined, storage backends (memory + file) are implemented, and `TelemetryImpl` provides `emit()`, `query()`, and `getPipelineSummary()`. The constraint types (`Constraint`, `ConstraintEvaluator`, `ConstraintResult`, `ConstraintViolation`, `ConstraintCheckResult`) are already defined in `src/types.ts` from Phase 0, but no implementations exist yet.

The `ConstraintEvaluator` interface requires three methods: `evaluate(pipelineId)`, `addConstraint(constraint)`, and `removeConstraint(name)`. The evaluator receives a `StorageBackend` (same as `TelemetryImpl`) to query events for evaluation.

The existing `TelemetryImpl` pattern is the reference: constructor takes a `StorageBackend`, methods are async, validation is synchronous and throws. The constraint evaluator should follow this same pattern.

## Goals / Non-Goals

**Goals:**

- Implement `ConstraintEvaluatorImpl` that evaluates registered constraints against pipeline events
- Provide 5 default constraints (max-retries, token-budget, duration, consecutive-failures, lint-violations)
- Provide builder utilities for constructing constraints declaratively without implementing `Constraint` directly
- Synchronous evaluation (blocking) with < 50ms p99 for 1000 events
- Audit logging of all evaluations (structured result with timestamp)
- Zero new runtime dependencies

**Non-Goals:**

- Hot-reload of constraint definitions (F-024, deferred to future)
- Asynchronous evaluation with callbacks (F-033, deferred to future)
- Integration with `createTelemetry()` factory (that's Phase 4)
- Integration with eslint-plugin-llm-core (F-043, requires cross-package coordination)

## Decisions

### 1. Single-file evaluator with separated defaults and builders

**Decision**: `src/constraints.ts` contains `ConstraintEvaluatorImpl`. Default constraints go in `src/constraints/defaults.ts`. Builder utilities go in `src/constraints/builder.ts`.

**Rationale**: The evaluator is a single class — no need for a directory. Defaults and builders are separate because they're consumed independently (users can use defaults without builders, or builders without defaults).

**Alternative considered**: All constraints code in one file. Rejected — the default constraints alone will be substantial (5 constraints with different logic), and mixing builder utilities with implementation makes testing harder.

### 2. Evaluator receives StorageBackend, not Telemetry

**Decision**: `ConstraintEvaluatorImpl` takes a `StorageBackend` constructor parameter, not a `Telemetry` instance.

**Rationale**: Constraints only need to query events, which `StorageBackend` provides directly. Taking `Telemetry` would create a circular dependency once Phase 4's factory wires them together (factory creates both, evaluator would reference telemetry which references storage). Same pattern as `TelemetryImpl`.

### 3. Constraint scoping via scope property + event filtering

**Decision**: `Constraint.scope` (`'stage' | 'pipeline'`) determines whether the constraint receives all pipeline events or only events for a specific stage. Stage-scoped constraints are evaluated once per completed stage. Pipeline-scoped constraints are evaluated once per evaluation call.

**Rationale**: A token-budget constraint needs all events (pipeline scope). A duration constraint for a specific stage only needs that stage's events (stage scope). The scope property is already defined in the `Constraint` type — we honor it by filtering events before passing them to `check()`.

### 4. Builder functions return Constraint objects

**Decision**: `threshold()`, `boolean()`, `aggregation()` builder functions return `Constraint` instances directly.

**Rationale**: Users shouldn't need to implement the `Constraint` interface manually for common patterns. Builders encapsulate the `check` function logic:

- `threshold({ name, value, operator, extract })` — compares an extracted value against a threshold
- `boolean({ name, assert, extract })` — asserts a boolean condition on events
- `aggregation({ name, fn, value, operator })` — aggregates (sum/count/avg) then compares

Each builder sets `scope` from an optional parameter (defaults to `'pipeline'`).

### 5. Severity derived from constraint metadata, not built into check

**Decision**: The `ConstraintCheckResult` already has `passed` and `message`. Severity (`warning`/`error`/`critical`) is set by the evaluator based on whether the constraint is a default (configurable severity) or custom (defaults to `error`).

**Rationale**: The `Constraint` type doesn't have a severity field — it was intentionally kept simple in Phase 0. Severity mapping lives in the evaluator: default constraints define their severity, custom constraints default to `error`. This avoids changing existing types.

## Risks / Trade-offs

- **Performance with many constraints** → Each constraint runs `check()` against filtered events. For N constraints and M events, worst case is O(N×M). Mitigation: Events are queried once from storage (single I/O), then filtered in-memory per constraint. With 1000 events and ~10 constraints, this stays well under 50ms.

- **Stage-scoped evaluation requires knowing which stage just completed** → The evaluator doesn't receive stage context in `evaluate(pipelineId)`. Mitigation: For stage-scoped constraints, the evaluator checks all stages found in events. This is slightly less efficient but avoids changing the `ConstraintEvaluator` interface.

- **No severity field on Constraint type** → Severity is mapped by convention (default constraints define it, custom defaults to `error`). This is a minor friction point. If it becomes problematic, adding an optional `severity` field to `Constraint` is a non-breaking additive change.
