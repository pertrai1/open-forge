## Why

Phase 1 defined the ROADMAP types (`Roadmap`, `RoadmapPhase`, `RoadmapTask`, `ParallelGroup`, `TaskComplexity`). The pipeline cannot operate on ROADMAP.md files until we can parse them into these structures, generate new ones from requirements, classify task complexity for model routing, mark tasks as done during execution, and detect which tasks can run in parallel. This is the first functional layer on top of the type system — every downstream phase (orchestrator, execution engine, CLI) depends on it.

## What Changes

- Add ROADMAP.md parser that converts markdown into the `Roadmap` type hierarchy
- Add ROADMAP.md generator that serializes `Roadmap` objects back to the canonical markdown format
- Add task complexity classifier that evaluates task metadata against the trivial/simple/medium/complex criteria from REQUIREMENTS.md
- Add ROADMAP task marker utility for updating task completion status (`[x]`/`[ ]`) and querying next actionable tasks
- Add parallel group detector that analyzes task dependency graphs to identify concurrently executable groups

## Capabilities

### New Capabilities

- `roadmap-parsing`: Parse ROADMAP.md markdown into typed `Roadmap` structure — handles phases, tasks, dependencies, deliverables, parallel groups, and overview sections
- `roadmap-generation`: Serialize a `Roadmap` object to the canonical ROADMAP.md markdown format matching the template structure
- `task-complexity-classification`: Classify `RoadmapTask` complexity as trivial/simple/medium/complex based on deliverable analysis and dependency count
- `roadmap-task-marking`: Mark tasks complete/incomplete in a ROADMAP.md file and query for the next pending task respecting dependency order
- `parallel-group-detection`: Analyze task dependency graphs within a phase to detect groups of tasks that can execute concurrently

### Modified Capabilities

_None — Phase 1 types are consumed as-is._

## Impact

- **New files**: `src/lib/roadmap/parser.ts`, `src/lib/roadmap/generator.ts`, `src/lib/roadmap/classifier.ts`, `src/lib/roadmap/parallel.ts`, `src/lib/helper/roadmap.ts`
- **Test files**: `tests/roadmap-parser.test.ts`, `tests/roadmap-generator.test.ts`
- **Dependencies**: Uses types from `src/lib/roadmap/types.ts` (Phase 1, no changes)
- **Downstream impact**: Phase 4 (orchestrator executor) and Phase 10 (CLI plan/run commands) depend on these modules
