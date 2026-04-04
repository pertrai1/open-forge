## 1. Storage Interface

- [x] 1.1 Define `StorageBackend` interface in `src/storage/StorageBackend.ts` with `append()`, `query()`, `count()` methods
- [x] 1.2 Export `StorageBackend` from `src/index.ts`

## 2. In-Memory Storage

- [x] 2.1 Implement `MemoryStorageBackend` class in `src/storage/MemoryStorageBackend.ts`
- [x] 2.2 Implement `append()` — push event to internal array
- [x] 2.3 Implement `query()` — filter internal array by EventFilter fields (pipelineId, stage, action, from, to)
- [x] 2.4 Implement `count()` — return filtered count

## 3. File-Based Storage

- [x] 3.1 Implement `FileStorageBackend` class in `src/storage/FileStorageBackend.ts`
- [x] 3.2 Implement `append()` — serialize event as JSON, append line to file, create dirs on first write
- [x] 3.3 Implement `query()` — read JSONL file, parse, filter by EventFilter
- [x] 3.4 Implement `count()` — count matching events via query
- [x] 3.5 Handle missing/empty file gracefully (return empty array / zero)

## 4. Shared Utilities

- [x] 4.1 Extract `matchesFilter` to `src/storage/matchesFilter.ts` — shared across both backends

## 5. Tests

- [x] 5.1 Write shared storage contract tests that both backends must pass
- [x] 5.2 Write memory-specific tests (ephemeral behavior)
- [x] 5.3 Write file-specific tests (persistence across instances, JSONL format, missing file handling)
- [x] 5.4 Verify all tests pass and quality gates clear
