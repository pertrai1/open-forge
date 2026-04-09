## Context

The telemetry package has completed Phase 0 (types) and Phase 1 (storage backends). The `Telemetry` interface is defined in `src/types.ts` with three methods — `emit()`, `query()`, `getPipelineSummary()` — but has no implementation. Storage backends (`MemoryStorageBackend`, `FileStorageBackend`) implement the `StorageBackend` contract (`append`, `query`, `count`) and are ready to consume.

The `Telemetry` implementation is the composition layer: it accepts a `StorageBackend` at construction, validates events before persisting, delegates queries to storage, and computes `PipelineSummary` by aggregating stored events. No new types are needed — all interfaces already exist.

This is a single-module change (`src/TelemetryImpl.ts`) with no external dependencies.

## Goals / Non-Goals

**Goals:**

- Implement `emit()` that validates required event fields and delegates to `StorageBackend.append()`
- Implement `query()` that delegates directly to `StorageBackend.query()` (filtering is already handled by storage + `matchesFilter`)
- Implement `getPipelineSummary()` that aggregates all events for a pipeline into a `PipelineSummary`
- Graceful error handling in `emit()` — telemetry failure must not crash the pipeline (NF-011)
- Export `TelemetryImpl` from `src/index.ts`

**Non-Goals:**

- Constraint evaluation (Phase 3)
- Factory function / `createTelemetry()` (Phase 4)
- Validation of optional fields (`durationMs`, `tokenUsage`, etc.) beyond type-checking
- Event batching or write coalescing
- Retry logic on storage failure (storage backends handle their own errors)

## Decisions

### 1. Constructor injection of `StorageBackend`

`TelemetryImpl` takes a `StorageBackend` instance via constructor. No default backend selection — the factory (`createTelemetry`, Phase 4) handles that.

**Rationale**: Keeps `TelemetryImpl` pure and testable. Consumers inject the backend they want. The existing `describeStorageContract` test pattern in `tests/storage.test.ts` demonstrates this same injection approach works well.

**Alternative considered**: Accept `StorageBackend` per-method. Rejected — the backend is a lifecycle dependency, not per-call configuration.

### 2. Synchronous validation in `emit()` before async storage

`emit()` validates required fields (`timestamp`, `pipelineId`, `phase`, `stage`, `action`) synchronously, then calls `storage.append()` asynchronously. Validation errors throw immediately (caller's responsibility). Storage errors are caught and logged per NF-011.

**Rationale**: Required field validation is deterministic and should fail fast. Storage I/O is where async errors occur and where NF-011 (don't crash pipeline) applies.

### 3. `emit()` error handling: catch-and-swallow with optional error callback

On storage failure, `emit()` catches the error and does NOT re-throw. The method resolves normally so the pipeline continues. A future enhancement can add an optional `onError` callback, but for v1 the contract is: telemetry failure is silent to the caller.

**Rationale**: NF-011 explicitly states the system must not crash the pipeline on telemetry failure. If callers need to know about failures, they can observe via `query()` returning fewer events than expected.

**Alternative considered**: Return a result type `{ success: boolean; error?: Error }`. Rejected — this would change the `Telemetry` interface signature, which returns `Promise<void>` and is already defined.

### 4. `query()` is a pure delegation

`query()` passes the `EventFilter` directly to `storage.query()` and returns the result. No additional filtering, transformation, or caching.

**Rationale**: The storage layer already implements filtering via `matchesFilter()`. Adding another filter layer would duplicate logic. If future needs require client-side filtering (e.g., on fields not in `EventFilter`), that's a separate concern.

### 5. `getPipelineSummary()` aggregation strategy

Query ALL events for the pipeline (filter by `pipelineId` only), then aggregate in memory:

- `totalDurationMs`: Sum of `durationMs` from events where `action === 'complete'`
- `totalTokens`: Sum of `tokenUsage.prompt + tokenUsage.completion` from all events with `tokenUsage`
- `stagesCompleted`: Unique stage names from events where `action === 'complete'`, preserving insertion order
- `currentStage`: Stage name from the chronologically last event (by `timestamp`)
- `retryCount`: Count of events where `action === 'retry'`
- `status`: Derived from event actions:
  - `'halted'` if any event has `action === 'escalate'`
  - `'failed'` if any event has `action === 'fail'` (and no escalation)
  - `'completed'` if the last event has `action === 'complete'` for the final stage
  - `'running'` otherwise

**Rationale**: Single query, single pass aggregation. No complex joins or multi-query flows. The event set per pipeline is bounded (NF-003: 10,000+ events supported), so in-memory aggregation is fine.

**Alternative considered**: Multiple targeted queries (one per metric). Rejected — would be slower and more complex for bounded datasets.

### 6. Single class, single file

All three methods live in one `TelemetryImpl` class in `src/TelemetryImpl.ts`.

**Rationale**: The class is small (3 methods + constructor + validation helper). No need to split until complexity warrants it. Follows the pattern of `MemoryStorageBackend` — one class per file.

### 7. Validation helper as a module-level function, not a separate module

A module-level `validateEvent()` function checks required fields. Not extracted to a separate utility.

**Rationale**: Validation logic is ~10 lines and specific to `TelemetryImpl`. If it grows or needs reuse (e.g., in the factory), extract then. YAGNI.

## Risks / Trade-offs

- **Silent emit failures** → Callers won't know if events weren't persisted. Mitigation: the storage backends are reliable (memory never fails, file handles OS errors). If telemetry is critical, Phase 4 can add an `onError` callback.

- **Full event scan for summary** → `getPipelineSummary()` loads all events for a pipeline into memory. For 10,000 events this is fine (~1-5MB). For future scale (100K+), consider a streaming/accumulator approach. Not a concern for v1.

- **Timestamp string comparison** → `currentStage` is determined by sorting on `timestamp` (ISO 8601 strings). ISO 8601 is lexicographically sortable, so string comparison is correct. No need for `Date` parsing.

- **Status derivation edge case** → If a pipeline has both `fail` and `escalate` events, status is `halted` (escalation takes precedence). This matches the pipeline semantics: escalation means human intervention, which overrides any transient failure.
