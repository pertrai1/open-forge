## Why

Phase 0 (types) and Phase 1 (storage) are complete, but the `Telemetry` interface defined in `src/types.ts` has no implementation. Pipeline stages have no way to emit events, query history, or retrieve aggregated summaries. This is the core value layer — without it, the storage backends have nothing to store and downstream consumers (constraint evaluator, integration API) are blocked.

## What Changes

- Add `src/telemetry.ts` implementing the `Telemetry` interface (`emit`, `query`, `getPipelineSummary`)
- `emit()` validates incoming events, delegates to a `StorageBackend`, and handles async errors without crashing the pipeline (NF-011)
- `query()` accepts an `EventFilter` and delegates filtering to the storage backend
- `getPipelineSummary()` aggregates stored events for a pipeline into a `PipelineSummary` (total duration, token usage, completed stages, retry count, status)
- Add `tests/telemetry.test.ts` covering all three methods with both storage backends
- Update `src/index.ts` to export the new `TelemetryImpl` class

## Capabilities

### New Capabilities

- `event-emission`: Validates and persists pipeline events via `emit()`. Enforces required fields (timestamp, pipelineId, phase, stage, action), delegates to pluggable `StorageBackend`, and provides async-safe error handling per NF-011.
- `event-query`: Retrieves filtered pipeline events via `query()`. Accepts `EventFilter` with pipelineId (required), stage, action, and time range — delegates to storage backend's existing `query()` method.
- `pipeline-summary`: Aggregates events into a `PipelineSummary` via `getPipelineSummary()`. Computes totalDurationMs from `complete` events, totalTokens from tokenUsage, stagesCompleted from unique stages, currentStage from latest event, retryCount from `retry` actions, and derives status (`running`/`completed`/`failed`/`halted`) from event actions.

### Modified Capabilities

_(No existing specs are modified — this is additive on top of the storage layer.)_

## Impact

- **Code**: New file `src/telemetry.ts`, new test file `tests/telemetry.test.ts`, updated exports in `src/index.ts`
- **Dependencies**: Depends on `StorageBackend` interface and existing implementations (MemoryStorageBackend, FileStorageBackend). No new runtime dependencies.
- **API**: Adds concrete `TelemetryImpl` class implementing the already-defined `Telemetry` interface. No breaking changes — the interface was defined but unimplemented.
- **Downstream**: Unblocks Phase 3 (Constraint Evaluator) and Phase 4 (Integration API / `createTelemetry` factory).
- **Requirements covered**: F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-013
