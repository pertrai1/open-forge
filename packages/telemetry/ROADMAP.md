# @open-forge/telemetry — Implementation Roadmap

## Overview

This roadmap breaks down the [telemetry REQUIREMENTS](../../docs/open-forge-telemetry-REQUIREMENTS.md) into atomic, self-contained tasks.

**Tech Stack**: TypeScript / Node.js 20+
**Distribution**: npm package (`@open-forge/telemetry`)
**Architecture**: Event capture, constraint evaluation, pluggable storage
**Constraint**: Zero required runtime dependencies for core functionality

---

## Phase 0: Foundation (COMPLETE)

**Goal**: Package scaffolding and type definitions.

### Tasks

- [x] 0.1 Initialize package with `package.json`, `tsconfig.json`, vitest, eslint [deps: None]
- [x] 0.2 Define all core types in `src/types.ts` [deps: None]
- [x] 0.3 Export types from `src/index.ts` [deps: 0.2]
- [x] 0.4 Write type validation tests [deps: 0.3]

---

## Phase 1: Storage Layer

**Goal**: Implement pluggable storage backends starting with the zero-config default.

### Tasks

- [ ] 1.1 Define storage interface [deps: 0.2] [deliverable: `src/storage/interface.ts` — StorageBackend with append(), query(), count()]
- [ ] 1.2 Implement in-memory storage [deps: 1.1] [deliverable: `src/storage/memory.ts` — for testing and lightweight use]
- [ ] 1.3 Implement file-based storage [deps: 1.1] [deliverable: `src/storage/file.ts` — JSONL append-only file, default zero-config backend]
- [ ] 1.4 Write storage tests [deps: 1.2, 1.3] [deliverable: `tests/storage.test.ts`]

**Parallel Groups**:

- Group A: 1.1 (independent)
- Group B: 1.2, 1.3 (both require 1.1, independent of each other)
- Group C: 1.4 (requires Group B)

**Requirements covered**: F-010, F-011, F-012, NF-001, NF-010

---

## Phase 2: Telemetry Core

**Goal**: Implement event emission and querying — the `Telemetry` interface.

### Tasks

- [ ] 2.1 Implement `emit()` [deps: 1.2] [deliverable: `src/telemetry.ts` — validates event, writes to storage, async-safe]
- [ ] 2.2 Implement `query()` [deps: 2.1] [deliverable: `src/telemetry.ts` — filter by pipelineId, stage, action, time range]
- [ ] 2.3 Implement `getPipelineSummary()` [deps: 2.2] [deliverable: `src/telemetry.ts` — aggregate events into PipelineSummary]
- [ ] 2.4 Write telemetry tests [deps: 2.1, 2.2, 2.3] [deliverable: `tests/telemetry.test.ts`]

**Parallel Groups**:

- Sequential: 2.1 → 2.2 → 2.3 → 2.4

**Requirements covered**: F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-013

---

## Phase 3: Constraint Evaluator

**Goal**: Implement constraint definition and evaluation — the `ConstraintEvaluator` interface.

### Tasks

- [ ] 3.1 Implement constraint evaluator [deps: 2.2] [deliverable: `src/constraints.ts` — addConstraint(), removeConstraint(), evaluate()]
- [ ] 3.2 Implement default constraints [deps: 3.1] [deliverable: `src/constraints/defaults.ts` — max-retries, token-budget, duration, consecutive-failures, lint-violations]
- [ ] 3.3 Implement constraint builder utilities [deps: 3.1] [deliverable: `src/constraints/builder.ts` — threshold(), boolean(), aggregation() helpers]
- [ ] 3.4 Write constraint tests [deps: 3.1, 3.2, 3.3] [deliverable: `tests/constraints.test.ts`]

**Parallel Groups**:

- Group A: 3.1 (independent)
- Group B: 3.2, 3.3 (both require 3.1, independent of each other)
- Group C: 3.4 (requires Group B)

**Requirements covered**: F-020, F-021, F-022, F-023, F-030, F-031, F-032, F-034, NF-002

---

## Phase 4: Integration API

**Goal**: Implement the `OpenForgeTelemetry` facade and `createTelemetry()` factory.

### Tasks

- [ ] 4.1 Implement `createTelemetry()` factory [deps: 2.1, 3.1] [deliverable: `src/factory.ts` — wires storage, telemetry, constraints together]
- [ ] 4.2 Implement `onStageEvent()` convenience method [deps: 4.1] [deliverable: `src/factory.ts` — emit + evaluate in one call]
- [ ] 4.3 Implement `serializeContext()` [deps: 4.1] [deliverable: `src/factory.ts` — token-limited summary for agent context injection]
- [ ] 4.4 Update `src/index.ts` with implementation exports [deps: 4.1, 4.2, 4.3] [deliverable: `src/index.ts` — export createTelemetry and all implementations]
- [ ] 4.5 Write integration tests [deps: 4.1, 4.2, 4.3] [deliverable: `tests/integration.test.ts` — end-to-end: create → emit → query → evaluate]

**Parallel Groups**:

- Group A: 4.1 (independent)
- Group B: 4.2, 4.3 (both require 4.1, independent of each other)
- Group C: 4.4 (requires Group B)
- Group D: 4.5 (requires Group B)

**Requirements covered**: F-040, F-041, F-042, NF-011, NF-030

---

## Phase 5: Documentation & Polish

**Goal**: README, examples, and performance validation.

### Tasks

- [ ] 5.1 Write README with usage examples [deps: 4.4] [deliverable: `README.md`]
- [ ] 5.2 Write EXAMPLES.md [deps: 4.4] [deliverable: `EXAMPLES.md` — common usage patterns]
- [ ] 5.3 Add performance benchmark test [deps: 4.5] [deliverable: `tests/benchmark.test.ts` — verify NF-001, NF-002, NF-003 SLAs]

**Parallel Groups**:

- All independent

---

## Dependency Graph

```
Phase 0 (Foundation) ✅
    │
    └──→ Phase 1 (Storage)
              │
              └──→ Phase 2 (Telemetry Core)
                        │
                        └──→ Phase 3 (Constraints)
                                  │
                                  └──→ Phase 4 (Integration API)
                                            │
                                            └──→ Phase 5 (Docs)
```

---

## Deferred to Future Phases

| Requirement                                 | Reason                                            |
| ------------------------------------------- | ------------------------------------------------- |
| F-024 (hot-reload constraints)              | P2 — add after core is stable                     |
| F-033 (async evaluation)                    | P2 — synchronous is sufficient for v1             |
| F-043 (eslint-plugin integration)           | P1 — requires eslint-plugin-llm-core coordination |
| F-050, F-051, F-052 (observability exports) | P1/P2 — add after core is proven                  |
| SQLite storage backend                      | P1 — file-based is sufficient for v1              |
