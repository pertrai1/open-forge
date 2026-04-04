## 1. Storage Interface

- [ ] 1.1 Define `StorageBackend` interface in `src/storage/interface.ts` with `append()`, `query()`, `count()` methods
- [ ] 1.2 Export `StorageBackend` from `src/index.ts`

## 2. In-Memory Storage

- [ ] 2.1 Implement `MemoryStorageBackend` class in `src/storage/memory.ts`
- [ ] 2.2 Implement `append()` — push event to internal array
- [ ] 2.3 Implement `query()` — filter internal array by EventFilter fields (pipelineId, stage, action, from, to)
- [ ] 2.4 Implement `count()` — return filtered count without extra allocation

## 3. File-Based Storage

- [ ] 3.1 Implement `FileStorageBackend` class in `src/storage/file.ts`
- [ ] 3.2 Implement `append()` — serialize event as JSON, append line to file, create dirs on first write
- [ ] 3.3 Implement `query()` — read JSONL file line-by-line, parse, filter by EventFilter
- [ ] 3.4 Implement `count()` — count matching lines without holding all in memory
- [ ] 3.5 Handle missing/empty file gracefully (return empty array / zero)

## 4. Tests

- [ ] 4.1 Write shared storage contract tests that both backends must pass
- [ ] 4.2 Write memory-specific tests (ephemeral behavior)
- [ ] 4.3 Write file-specific tests (persistence across instances, JSONL format, missing file handling)
- [ ] 4.4 Verify all tests pass and quality gates clear
