# @open-forge/evaluations — Implementation Roadmap

## Overview

This roadmap breaks down the [evaluations REQUIREMENTS](../../docs/open-forge-evaluations-REQUIREMENTS.md) into atomic, self-contained tasks.

**Tech Stack**: TypeScript / Node.js 20+
**Distribution**: npm package (`@open-forge/evaluations`)
**Architecture**: Datasets, evaluators, runners, statistics, reports
**Prerequisite**: `@open-forge/telemetry` implementations must be available before Phase 5 (telemetry/constraint integration)

---

## Phase 0: Foundation (COMPLETE)

**Goal**: Package scaffolding and type definitions.

### Tasks

- [x] 0.1 Initialize package with `package.json`, `tsconfig.json`, vitest, eslint [deps: None]
- [x] 0.2 Define all core types in `src/types.ts` [deps: None]
- [x] 0.3 Export types from `src/index.ts` [deps: 0.2]
- [x] 0.4 Write type validation tests [deps: 0.3]

---

## Phase 1: Dataset Management

**Goal**: Load, validate, and introspect evaluation datasets.

### Tasks

- [ ] 1.1 Implement dataset loader [deps: 0.2] [deliverable: `src/datasets/loader.ts` — load from JSON/YAML files]
- [ ] 1.2 Implement dataset schema validation [deps: 0.2] [deliverable: `src/datasets/validation.ts` — validate inputs, expected outputs, required fields]
- [ ] 1.3 Implement dataset introspection [deps: 1.1] [deliverable: `src/datasets/introspection.ts` — scenario count, tag distribution, difficulty breakdown]
- [ ] 1.4 Implement dataset splitting [deps: 1.1] [deliverable: `src/datasets/splitter.ts` — train/test/hold split with stratification]
- [ ] 1.5 Write dataset tests [deps: 1.1, 1.2, 1.3, 1.4] [deliverable: `tests/datasets.test.ts`]

**Parallel Groups**:

- Group A: 1.1, 1.2 (independent)
- Group B: 1.3, 1.4 (both require 1.1, independent of each other)
- Group C: 1.5 (requires all)

**Requirements covered**: E-001, E-003, E-004, E-006

---

## Phase 2: Evaluator Framework

**Goal**: Implement the evaluator interface, registry, and deterministic evaluators.

### Tasks

- [ ] 2.1 Implement evaluator interface and registry [deps: 0.2] [deliverable: `src/evaluators/interface.ts`, `src/evaluators/registry.ts` — register, get, list evaluators]
- [ ] 2.2 Implement tool-selection evaluator [deps: 2.1] [deliverable: `src/evaluators/deterministic/tool-selection.ts`]
- [ ] 2.3 Implement task-completion evaluator [deps: 2.1] [deliverable: `src/evaluators/deterministic/task-completion.ts`]
- [ ] 2.4 Implement safety evaluator [deps: 2.1] [deliverable: `src/evaluators/deterministic/safety.ts`]
- [ ] 2.5 Implement cost-efficiency evaluator [deps: 2.1] [deliverable: `src/evaluators/deterministic/cost-efficiency.ts`]
- [ ] 2.6 Implement custom evaluator adapter [deps: 2.1] [deliverable: `src/evaluators/custom.ts` — wraps CustomEvaluatorFunction into Evaluator]
- [ ] 2.7 Write evaluator tests [deps: 2.2, 2.3, 2.4, 2.5, 2.6] [deliverable: `tests/evaluators.test.ts`]

**Parallel Groups**:

- Group A: 2.1 (independent)
- Group B: 2.2, 2.3, 2.4, 2.5, 2.6 (all require 2.1, all independent of each other)
- Group C: 2.7 (requires Group B)

**Requirements covered**: E-010, E-012, E-014 (partial — deterministic only), E-015 (partial)

---

## Phase 3: Evaluation Runner & Statistics

**Goal**: Implement the evaluation execution engine and statistical analysis.

### Tasks

- [ ] 3.1 Implement synchronous evaluation runner [deps: 1.1, 2.1] [deliverable: `src/runner/evaluation-runner.ts` — run dataset through evaluators, collect results]
- [ ] 3.2 Implement batch execution with concurrency [deps: 3.1] [deliverable: `src/runner/evaluation-runner.ts` — parallel execution with configurable maxConcurrency]
- [ ] 3.3 Implement streaming runner [deps: 3.1] [deliverable: `src/runner/streaming-runner.ts` — emit results as they complete]
- [ ] 3.4 Implement confidence interval calculation [deps: 0.2] [deliverable: `src/statistics/confidence-intervals.ts`]
- [ ] 3.5 Implement significance testing [deps: 0.2] [deliverable: `src/statistics/significance-testing.ts` — baseline vs candidate p-value]
- [ ] 3.6 Implement regression detection [deps: 3.4] [deliverable: `src/statistics/regression-detection.ts` — configurable thresholds, severity classification]
- [ ] 3.7 Implement per-metric statistics [deps: 0.2] [deliverable: `src/statistics/metrics.ts` — mean, median, stdDev, percentiles]
- [ ] 3.8 Write runner and statistics tests [deps: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7] [deliverable: `tests/runner.test.ts`, `tests/statistics.test.ts`]

**Parallel Groups**:

- Group A: 3.1 (requires 1.1, 2.1)
- Group B: 3.2, 3.3 (require 3.1)
- Group C: 3.4, 3.5, 3.7 (independent of runner — pure math)
- Group D: 3.6 (requires 3.4)
- Group E: 3.8 (requires all)

**Requirements covered**: E-020, E-021, E-022, E-023, E-024, E-025, E-030, E-031, E-032, E-033, E-035

---

## Phase 4: Report Generation & Comparison

**Goal**: Generate structured reports and compare baselines to candidates.

### Tasks

- [ ] 4.1 Implement JSON report generator [deps: 3.1, 3.4] [deliverable: `src/reports/generator.ts` — compile results + statistics into EvaluationReport]
- [ ] 4.2 Implement report comparator [deps: 4.1, 3.5, 3.6] [deliverable: `src/reports/comparator.ts` — baseline vs candidate, adopt/reject/investigate recommendation]
- [ ] 4.3 Implement report persistence [deps: 4.1] [deliverable: `src/reports/persistence.ts` — save/load from file]
- [ ] 4.4 Implement markdown formatter [deps: 4.1] [deliverable: `src/reports/formatters/markdown.ts` — human-readable summary]
- [ ] 4.5 Write report tests [deps: 4.1, 4.2, 4.3, 4.4] [deliverable: `tests/reports.test.ts`]

**Parallel Groups**:

- Group A: 4.1 (requires 3.1, 3.4)
- Group B: 4.2, 4.3, 4.4 (all require 4.1, independent of each other)
- Group C: 4.5 (requires Group B)

**Requirements covered**: E-040, E-041, E-042, E-043, E-044, E-045

---

## Phase 5: Telemetry & Constraint Integration

**Goal**: Connect evaluations to the telemetry event stream and constraint system.

**BLOCKED**: Requires `@open-forge/telemetry` Phase 4 (Integration API) to be complete.

### Tasks

- [ ] 5.1 Implement telemetry event consumer [deps: 4.1] [deliverable: `src/telemetry/integration.ts` — consume PipelineEvents as evaluation inputs]
- [ ] 5.2 Implement trace extraction [deps: 5.1] [deliverable: `src/telemetry/trace-extraction.ts` — extract eval-relevant metrics from telemetry traces]
- [ ] 5.3 Implement constraint-driven evaluation [deps: 5.1] [deliverable: `src/constraints/integration.ts` — skip evaluation on constraint violations, include violations in reports]
- [ ] 5.4 Write integration tests [deps: 5.1, 5.2, 5.3] [deliverable: `tests/telemetry-integration.test.ts`]

**Parallel Groups**:

- Group A: 5.1 (independent)
- Group B: 5.2, 5.3 (both require 5.1)
- Group C: 5.4 (requires Group B)

**Requirements covered**: E-050, E-051, E-053, E-060, E-061

---

## Phase 6: LLM Judge Evaluators

**Goal**: Implement LLM-based evaluators for answer and reasoning quality.

**BLOCKED**: Requires LLM provider abstraction (issue #11) or a temporary direct integration.

### Tasks

- [ ] 6.1 Implement judge provider abstraction [deps: 2.1] [deliverable: `src/evaluators/llm-judge/judge-provider.ts` — interface for calling judge LLM]
- [ ] 6.2 Implement answer-quality evaluator [deps: 6.1] [deliverable: `src/evaluators/llm-judge/answer-quality.ts` + rubric]
- [ ] 6.3 Implement reasoning-quality evaluator [deps: 6.1] [deliverable: `src/evaluators/llm-judge/reasoning-quality.ts` + rubric]
- [ ] 6.4 Implement composite evaluator [deps: 2.1] [deliverable: `src/evaluators/composite.ts` — combine multiple evaluator results]
- [ ] 6.5 Write LLM judge tests [deps: 6.2, 6.3, 6.4] [deliverable: `tests/llm-judges.test.ts`]

**Parallel Groups**:

- Group A: 6.1, 6.4 (independent)
- Group B: 6.2, 6.3 (both require 6.1)
- Group C: 6.5 (requires Group B)

**Requirements covered**: E-011, E-013, E-014 (remaining — LLM-based)

---

## Phase 7: CLI & Documentation

**Goal**: Command-line interface and documentation.

### Tasks

- [ ] 7.1 Implement eval CLI [deps: 3.1, 4.1] [deliverable: `cli/eval-cli.ts` — run evaluations from command line]
- [ ] 7.2 Update `src/index.ts` with all implementation exports [deps: All previous] [deliverable: `src/index.ts`]
- [ ] 7.3 Write README with usage examples [deps: 7.2] [deliverable: `README.md`]
- [ ] 7.4 Write EXAMPLES.md [deps: 7.2] [deliverable: `EXAMPLES.md`]

**Parallel Groups**:

- Group A: 7.1, 7.2 (independent)
- Group B: 7.3, 7.4 (require 7.2)

**Requirements covered**: NE-032, NE-033

---

## Dependency Graph

```
Phase 0 (Foundation) ✅
    │
    ├──→ Phase 1 (Datasets) ──────────────┐
    │                                      │
    ├──→ Phase 2 (Evaluators) ─────────────┤
    │                                      │
    │                              Phase 3 (Runner + Stats)
    │                                      │
    │                              Phase 4 (Reports)
    │                                      │
    │                         ┌────────────┤
    │                         │            │
    │                  Phase 5 (Telemetry)  Phase 6 (LLM Judges)
    │                         │            │
    │                         └────────────┤
    │                                      │
    │                              Phase 7 (CLI + Docs)
    └──────────────────────────────────────┘
```

---

## Deferred to Future Phases

| Requirement                                         | Reason                               |
| --------------------------------------------------- | ------------------------------------ |
| E-002 (dataset versioning)                          | P1 — add after core loader is stable |
| E-005 (synthetic dataset generation)                | P2 — research needed                 |
| E-034 (power analysis)                              | P2 — statistical niche               |
| E-046 (CI export formats)                           | P2 — add after core reports work     |
| E-052 (correlate failures with telemetry anomalies) | P2 — requires ML-adjacent analysis   |
| E-062 (halt on critical constraint violations)      | P2 — needs production usage patterns |
