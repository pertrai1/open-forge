## Context

The `@open-forge/telemetry` package currently exports only TypeScript types (Phase 0). The storage layer is the first real implementation — it provides the persistence mechanism that `emit()` and `query()` (Phase 2) will use. The existing `PipelineEvent` and `EventFilter` types in `src/types.ts` define the data model.

Constraint: Zero required runtime dependencies for core functionality (per package ROADMAP).

## Goals / Non-Goals

**Goals:**

- Define a `StorageBackend` interface that decouples telemetry logic from persistence
- Ship two concrete backends: in-memory (for tests/lightweight) and file-based JSONL (for production default)
- All backends satisfy the same contract and are interchangeable
- File backend works zero-config with only a path

**Non-Goals:**

- SQLite or database backends (deferred per ROADMAP)
- Concurrent write safety across processes (single-writer assumption for v1)
- Streaming/pagination for large result sets (can be added later)
- Hot-swapping backends at runtime

## Decisions

### 1. StorageBackend as a standalone interface (not extending Telemetry)

**Decision**: `StorageBackend` is a separate interface with `append()`, `query()`, `count()` — it does NOT extend or overlap with the `Telemetry` interface.

**Rationale**: `Telemetry.emit()` will do validation and enrichment before calling `StorageBackend.append()`. Keeping them separate enforces single responsibility. The `Telemetry` implementation (Phase 2) composes a `StorageBackend`.

**Alternative considered**: Having `Telemetry` directly implement storage. Rejected — couples business logic to I/O.

### 2. JSONL for file storage format

**Decision**: One JSON object per line, append-only.

**Rationale**: Simple, human-readable, no corruption from partial writes (each line is independent), streamable, and requires no dependencies. Alternatives like SQLite or binary formats add complexity for marginal gains at this scale.

### 3. File storage creates directories on first write, not on construction

**Decision**: The `FileStorageBackend` constructor stores the path. Directory/file creation happens on first `append()`.

**Rationale**: Avoids side effects during construction. `query()` on a non-existent file returns empty — no error.

### 4. Query filtering uses in-process filtering

**Decision**: Both backends load/scan events and filter in-process using `EventFilter` fields.

**Rationale**: Simplicity. At expected telemetry volumes (hundreds to low thousands of events per pipeline), in-process filtering is fast enough. Indexing can be added in a future phase if needed.

## Risks / Trade-offs

- **[Large file performance]** → File backend reads the entire file for queries. Mitigation: acceptable for v1 volumes; SQLite backend is in the deferred items list.
- **[No concurrent writes]** → Single-writer assumption. Mitigation: pipeline is single-threaded; document the limitation.
- **[JSONL corruption on crash]** → Partial line write possible if process crashes mid-append. Mitigation: each line is independent; partial lines are skipped on read.

## Open Questions

None — scope is well-defined by the ROADMAP and requirements doc.
