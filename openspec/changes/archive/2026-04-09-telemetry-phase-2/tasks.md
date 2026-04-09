## 1. emit() — TDD Implementation

- [x] 1.1 Write failing tests for `emit()` validation: rejects missing timestamp, missing pipelineId, missing stage, missing action, empty timestamp, empty pipelineId — all throw and do not persist
- [x] 1.2 Write failing tests for `emit()` delegation: valid event persists to MemoryStorageBackend, preserves all optional fields (durationMs, tokenUsage, agentId, model, filesModified, filesCreated, error, metadata), accepts event with only required fields
- [x] 1.3 Write failing test for `emit()` error handling: storage backend append() throws → emit() resolves without throwing (NF-011)
- [x] 1.4 Implement `TelemetryImpl` class in `src/TelemetryImpl.ts` — constructor accepting `StorageBackend`, private `validateEvent()` method, `emit()` with sync validation + async storage delegation + try/catch on append
- [x] 1.5 Verify all emit tests pass, existing tests still pass

## 2. query() — TDD Implementation

- [x] 2.1 Write failing tests for `query()` delegation: returns matching events, returns empty for no matches
- [x] 2.2 Write failing tests for `query()` filter fields: filter by pipelineId only, by pipelineId+stage, by pipelineId+action, by time range (from/to), with all fields combined
- [x] 2.3 Implement `query()` on `TelemetryImpl` — pure delegation to `storage.query(filter)`
- [x] 2.4 Verify all query tests pass, all prior tests still pass

## 3. getPipelineSummary() — TDD Implementation

- [x] 3.1 Write failing tests for `totalDurationMs`: sums durationMs from complete events, returns 0 with no complete events, excludes non-complete events
- [x] 3.2 Write failing tests for `totalTokens`: sums prompt+completion across events with tokenUsage, returns 0 with no tokenUsage, skips events without tokenUsage
- [x] 3.3 Write failing tests for `stagesCompleted`: unique stages from complete events, deduplicates repeated completions, empty array with no completions
- [x] 3.4 Write failing tests for `currentStage`: last event's stage by timestamp, undefined with no events
- [x] 3.5 Write failing tests for `retryCount`: counts retry actions, returns 0 with no retries
- [x] 3.6 Write failing tests for `status` derivation: halted on escalate, failed on fail without escalate, completed on last complete, running for in-progress, escalation precedes failure, running with no events
- [x] 3.7 Write failing test for `pipelineId`: returned summary has pipelineId matching argument
- [x] 3.8 Implement `getPipelineSummary()` on `TelemetryImpl` — query all events by pipelineId, single-pass aggregation computing all PipelineSummary fields
- [x] 3.9 Verify all summary tests pass, all prior tests still pass

## 4. Exports and Quality Gates

- [x] 4.1 Update `src/index.ts` to export `TelemetryImpl` from `./TelemetryImpl.js`
- [x] 4.2 Run `npx nx build telemetry` — verify build passes with no errors
- [x] 4.3 Run `npx nx test telemetry` — verify all tests pass (existing + new)
- [x] 4.4 Run `npx nx lint telemetry` — verify no lint errors
