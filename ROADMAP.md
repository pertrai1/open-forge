# Open Forge — Unified Roadmap

This is the **coordination roadmap** for the open-forge monorepo. It defines the cross-package sequencing — which packages get worked on, in what order, and why.

For detailed task breakdowns, see the per-package ROADMAPs:

- [`packages/pipeline/ROADMAP.md`](packages/pipeline/ROADMAP.md) — Phases 0–3 complete, 4–12 remaining
- [`packages/mcp/ROADMAP.md`](packages/mcp/ROADMAP.md) — Phases 0–9 complete, Phase 10 optional
- [`packages/telemetry/ROADMAP.md`](packages/telemetry/ROADMAP.md) — Phases 0–2 complete, 3–5 remaining
- [`packages/evaluations/ROADMAP.md`](packages/evaluations/ROADMAP.md) — Phase 0 complete, 1–7 remaining

---

## How to Read This

Each **wave** is a set of work that can proceed in parallel across packages. Waves are sequenced by cross-package dependencies — a wave cannot start until its prerequisites are met.

Within each wave, the listed package phases reference the detailed tasks in the corresponding package ROADMAP.

---

## Wave 1: Core Infrastructure

**Goal**: Build the foundational implementations that everything else depends on.

**Why first**: Pipeline Phase 4 (orchestrator) needs telemetry wiring. Evaluations need telemetry events to integrate with. Both need these to exist as real implementations, not just types.

| Package     | Phase                    | Work                                                        | Status      |
| ----------- | ------------------------ | ----------------------------------------------------------- | ----------- |
| `telemetry` | Phase 1: Storage         | Pluggable storage backends (memory, file)                   | Complete    |
| `telemetry` | Phase 2: Telemetry Core  | `emit()`, `query()`, `getPipelineSummary()`                 | Complete    |
| `telemetry` | Phase 3: Constraints     | Constraint evaluator, default constraints, builder utils    | Not started |
| `telemetry` | Phase 4: Integration API | `createTelemetry()`, `onStageEvent()`, `serializeContext()` | Not started |

**Completion gate**: `createTelemetry()` returns a working instance, events can be emitted and queried, constraints evaluate correctly. `npx nx affected -t build,test,lint` passes.

**Unblocks**: Wave 2 (pipeline orchestrator can wire telemetry), Wave 3 (evaluations can integrate with telemetry)

---

## Wave 2: Pipeline Orchestrator + Evaluations Core

**Goal**: Pipeline gains orchestration capabilities. Evaluations becomes functional independently of telemetry.

**Why now**: Pipeline has all the helper utilities (Phases 0–3) and can now build the orchestrator with telemetry wired in. Evaluations core (datasets, evaluators, runner, statistics, reports) has no dependency on telemetry and can proceed in parallel.

| Package       | Phase                   | Work                                                                                                          | Status      |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| `pipeline`    | Phase 4: Orchestrator   | Session manager, intent router, phase executor, context compressor                                            | Not started |
| `evaluations` | Phase 1: Datasets       | Loader, validation, introspection, splitting                                                                  | Not started |
| `evaluations` | Phase 2: Evaluators     | Registry, deterministic evaluators (tool-selection, task-completion, safety, cost-efficiency), custom adapter | Not started |
| `evaluations` | Phase 3: Runner + Stats | Sync/batch/streaming runner, confidence intervals, significance testing, regression detection                 | Not started |
| `evaluations` | Phase 4: Reports        | JSON report generator, comparator, persistence, markdown formatter                                            | Not started |

**Parallel strategy**:

- Pipeline Phase 4 and Evaluations Phases 1–4 are fully independent — can run in parallel
- Within evaluations, Phases 1 and 2 can run in parallel; Phase 3 depends on both; Phase 4 depends on Phase 3

**Completion gate**: Pipeline orchestrator can manage sessions and route intents. Evaluations can load a dataset, run evaluators, produce a report with statistical analysis, and compare baselines. `npx nx affected -t build,test,lint` passes.

**Unblocks**: Wave 3 (evaluations telemetry integration), Wave 4 (pipeline quality gates need orchestrator)

---

## Wave 3: Integration Layer

**Goal**: Connect the packages — evaluations consumes telemetry, pipeline wires telemetry into execution.

**Why now**: Telemetry is implemented (Wave 1), evaluations core works (Wave 2), pipeline orchestrator exists (Wave 2). Now we connect them.

| Package       | Phase                          | Work                                                               | Status      |
| ------------- | ------------------------------ | ------------------------------------------------------------------ | ----------- |
| `pipeline`    | Phase 5: Execution Engine      | Per-phase workflow, quality checker, gate runner, retry loop       | Not started |
| `evaluations` | Phase 5: Telemetry Integration | Consume telemetry events, trace extraction, constraint-driven eval | Not started |

**Parallel strategy**:

- Pipeline Phase 5 and Evaluations Phase 5 are independent — can run in parallel
- Both depend on telemetry being functional (Wave 1)

**Completion gate**: Pipeline runs quality gates with retry logic. Evaluations can consume telemetry events and include constraint violations in reports. `npx nx affected -t build,test,lint` passes.

**Unblocks**: Wave 4 (pipeline gates, firewalls), Wave 5 (LLM judges)

---

## Wave 4: Pipeline Quality & Safety

**Goal**: Complete the pipeline's quality enforcement stack — firewalls, gates, lessons, entropy management.

**Why now**: The execution engine (Wave 3) provides the foundation. These are the self-correction mechanisms that make the pipeline autonomous.

| Package    | Phase                               | Work                                                                                    | Status      |
| ---------- | ----------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| `pipeline` | Phase 6: Firewalls & Gates          | Context firewalls, role restrictions, tool interceptor, 6 quality gates, gate sequencer | Not started |
| `pipeline` | Phase 7: Lessons & Entropy          | Lessons feedback loop, pattern detection, cleanup agent, entropy budget                 | Not started |
| `pipeline` | Phase 8: Completion & Observability | `isIncomplete()` enforcer, clarification limits, ToolResult observability               | Not started |
| `pipeline` | Phase 9: Plan Generation            | Multi-plan generation, critic agent, plan selection                                     | Not started |

**Parallel strategy**:

- Phases 6, 7, 8 can largely run in parallel (all depend on Phase 5 but not on each other)
- Phase 9 is independent of 6–8

**Completion gate**: Pipeline has full quality gate sequence, context firewalls prevent hallucination reinforcement, lessons accumulate from failures, cleanup agent manages entropy, completion enforcer prevents premature exits. `npx nx affected -t build,test,lint` passes.

**Unblocks**: Wave 6 (plugin/CLI wraps the complete pipeline)

---

## Wave 5: LLM Integration

**Goal**: Add LLM-powered capabilities — judge evaluators and (future) LLM provider abstraction.

**Why now**: Deterministic evaluators are working (Wave 2). LLM judges add the subjective quality dimension.

| Package       | Phase               | Work                                                                                                   | Status      |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| `evaluations` | Phase 6: LLM Judges | Judge provider abstraction, answer-quality evaluator, reasoning-quality evaluator, composite evaluator | Not started |

**Dependencies**: This wave benefits from a shared LLM provider package (#11) but can proceed with a temporary direct integration if #11 is not yet available.

**Completion gate**: LLM judge evaluators produce meaningful scores with rubric-based reasoning. Composite evaluator combines multiple results. `npx nx affected -t build,test,lint` passes.

**Unblocks**: Full evaluation suite (deterministic + LLM judges working together)

---

## Wave 6: Distribution & CLI

**Goal**: Package everything for distribution — plugin interface, CLI commands, documentation.

**Why now**: All core functionality is implemented. This wave wraps it for consumption.

| Package       | Phase                             | Work                                                                               | Status      |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------- | ----------- |
| `pipeline`    | Phase 10: Plugin & CLI            | Plugin entry point, config handler, CLI commands (init, plan, run, status, resume) | Not started |
| `pipeline`    | Phase 11: Commands & Distribution | OpenCode command definitions, npm packaging, integration tests                     | Not started |
| `pipeline`    | Phase 12: Documentation           | Examples, troubleshooting guide, configuration docs                                | Not started |
| `evaluations` | Phase 7: CLI & Docs               | Eval CLI, README, examples                                                         | Not started |
| `telemetry`   | Phase 5: Documentation            | README, examples, performance benchmarks                                           | Not started |

**Parallel strategy**:

- All package documentation/CLI work is independent

**Completion gate**: All packages are distributable via npm. Pipeline has CLI and OpenCode commands. Evaluations has eval CLI. Documentation is complete. `npx nx run-many -t build,test,lint` passes.

---

## Wave 7: System Integration (Future)

**Goal**: Close the autonomous feedback loop — the work tracked in issues #10–#14.

**Why future**: Requires all packages to be functional. This is the capstone work.

| Issue                     | Work                                  | Depends on                                  |
| ------------------------- | ------------------------------------- | ------------------------------------------- |
| #10 — Agent interface     | Shared agent contract across packages | Pipeline + Evaluations types                |
| #11 — LLM provider        | Shared model invocation layer         | Pipeline + Evaluations usage patterns       |
| #13 — Feedback loop       | Evaluation → pipeline closed loop     | Evaluations reports + Pipeline orchestrator |
| #14 — Orchestration brain | Higher-level coordination             | Everything                                  |

**Not sequenced in detail yet** — these will get their own ROADMAPs once the foundation waves (1–6) are further along and usage patterns are clearer.

---

## Cross-Package Dependency Graph

```
Wave 1: Telemetry Implementation
    │
    ├──→ Wave 2: Pipeline Orchestrator ─────────────┐
    │            + Evaluations Core (parallel)       │
    │                                                │
    ├──→ Wave 3: Integration Layer ──────────────────┤
    │    (pipeline ↔ telemetry, evals ↔ telemetry)   │
    │                                                │
    ├──→ Wave 4: Pipeline Quality & Safety ──────────┤
    │                                                │
    ├──→ Wave 5: LLM Integration ────────────────────┤
    │                                                │
    └──→ Wave 6: Distribution & CLI ─────────────────┘
                                                     │
                                              Wave 7: System Integration (Future)
```

---

## Current State Summary

| Package       | Completed                                     | Next Up                                                             |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `mcp`         | Phases 0–9 (functional)                       | Phase 10 extensions (optional, unblocked)                           |
| `pipeline`    | Phases 0–3 (types, roadmap, handoff, helpers) | Phase 4 (orchestrator) — **blocked on Wave 1** for telemetry wiring |
| `telemetry`   | Phase 0–2 (types, storage, telemetry core)    | Phase 3 (constraint evaluator) — **ready to start**                 |
| `evaluations` | Phase 0 (types only)                          | Phase 1 (datasets) — **ready to start**                             |

**Immediate priority**: Telemetry Phases 3–4 (remainder of Wave 1). This is the critical path — everything else is blocked on or benefits from working telemetry. Phase 3 (constraint evaluator) is the next task to start.

**Maximum parallelism opportunity**: After Wave 1 completes, Wave 2 offers the most parallelism — pipeline Phase 4 and evaluations Phases 1–4 can all run simultaneously.
