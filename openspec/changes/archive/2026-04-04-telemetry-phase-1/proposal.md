## Why

The telemetry package currently exports only type definitions (Phase 0). Every downstream consumer — the pipeline orchestrator, constraint evaluator, and evaluations integration — needs real storage backends that can persist and query pipeline events. Without a storage layer, telemetry cannot function. This is the critical path: Wave 1 in the unified ROADMAP, blocking all subsequent waves.

## What Changes

- New `StorageBackend` interface defining the contract for all storage implementations (`append`, `query`, `count`)
- In-memory storage backend for testing and lightweight/ephemeral use cases
- File-based JSONL storage backend as the default zero-config production backend (append-only, no external dependencies)
- All backends are pluggable — consumers choose at `createTelemetry()` time (Phase 4)

## Capabilities

### New Capabilities

- `storage-interface`: Defines the `StorageBackend` contract — `append()`, `query()`, `count()` — that all storage implementations must satisfy
- `memory-storage`: In-memory `StorageBackend` implementation for testing and lightweight use
- `file-storage`: JSONL append-only file `StorageBackend` implementation as the default zero-config backend

### Modified Capabilities

<!-- No existing capabilities are being modified — this is all new implementation -->

## Impact

- **New files**: `src/storage/interface.ts`, `src/storage/memory.ts`, `src/storage/file.ts`, `tests/storage.test.ts`
- **Modified files**: `src/index.ts` (export storage implementations)
- **APIs**: New `StorageBackend` interface and two concrete implementations
- **Dependencies**: Zero runtime dependencies (Node.js `fs` and `path` for file backend only)
- **Downstream**: Unblocks Phase 2 (Telemetry Core) which needs storage to implement `emit()` and `query()`
