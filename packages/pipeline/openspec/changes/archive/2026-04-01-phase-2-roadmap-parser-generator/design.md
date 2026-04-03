## Context

Phase 1 established readonly type interfaces (`Roadmap`, `RoadmapPhase`, `RoadmapTask`, `ParallelGroup`, `TaskComplexity`) that define the shape of parsed ROADMAP data. Phase 2 builds the functional layer: parsing ROADMAP.md markdown into these structures, generating markdown from structures, classifying task complexity, marking tasks done, and detecting parallel groups.

The ROADMAP.md format is well-defined and constrained — a title header, overview section, then repeating phase blocks each containing a goal, task list, and parallel groups. The actual project ROADMAP.md and the template in `templates/ROADMAP.template.md` are the canonical references for the format.

All five modules in this phase are pure functions operating on strings and typed structures. No external dependencies are required. No I/O beyond what callers provide (the parser takes a string, not a file path).

## Goals / Non-Goals

**Goals:**

- Parse any valid ROADMAP.md (matching the template format) into a fully typed `Roadmap` object
- Generate ROADMAP.md markdown from a `Roadmap` object that matches the canonical template format
- Classify task complexity using deliverable metadata and dependency count as heuristic proxies
- Mark individual tasks done/undone in raw ROADMAP.md text and query next actionable tasks
- Detect parallel groups from task dependency graphs within a phase

**Non-Goals:**

- LLM-based complexity classification (this is a heuristic code module, not an agent call)
- Parsing arbitrary markdown (only the ROADMAP.md format is supported)
- Round-trip fidelity guarantees (generate produces canonical format, not necessarily identical to arbitrary input formatting)
- File I/O — all functions operate on strings; callers handle reading/writing files

## Decisions

### 1. Parser: regex-based line-by-line, no markdown library

Parse ROADMAP.md using regex patterns against individual lines. The format is constrained enough that a general-purpose markdown AST library adds complexity without benefit.

**Key patterns:**

- Phase header: `/^## Phase (\d+): (.+)$/`
- Goal line: `/^\*\*Goal\*\*: (.+)$/`
- Task line: `/^- \[([ x])\] (\d+\.\d+) (.+)$/` with nested extraction of `[deps: ...]` and `[deliverable: ...]`
- Parallel group: `/^- (Group [A-Z]): (.+)$/`

**Alternative considered:** Using a markdown parser (e.g., `marked`, `remark`). Rejected because it adds a dependency, requires AST traversal for a flat format, and the ROADMAP format won't change in ways that break regex patterns.

### 2. Task marker: raw text manipulation, not parse→modify→serialize

`markTaskDone()` and related helpers operate directly on the ROADMAP.md string using targeted regex replacements (e.g., `- [ ]` → `- [x]` for a specific task ID). This preserves all original formatting, comments, and sections that the parser might normalize away.

**Alternative considered:** Parse → modify `completed` field → regenerate full markdown. Rejected because it would normalize formatting and potentially lose content not captured by the parser (dependency graph diagrams, notes sections, etc.).

### 3. Classifier: heuristic proxy signals, not source analysis

The REQUIREMENTS.md defines complexity by line count and file count, but at classification time the source files don't exist yet (classification happens during ROADMAP generation). Use these proxy signals instead:

| Signal                 | Trivial            | Simple             | Medium                       | Complex                              |
| ---------------------- | ------------------ | ------------------ | ---------------------------- | ------------------------------------ |
| Dependencies           | 0                  | 1-2                | 3-4                          | 5+                                   |
| Deliverable file count | 1                  | 1-2                | 3-5                          | 6+                                   |
| Description keywords   | "config", "rename" | "implement", "add" | "integrate", "cross-cutting" | "architect", "redesign", "migration" |

The classifier returns `TaskComplexity` and is deterministic — same input always produces same output. Callers can override the classification if needed.

### 4. Parallel group detector: topological dependency analysis

`detectParallelGroups()` analyzes task dependencies within a single phase to produce `ParallelGroup[]`. Algorithm:

1. Build adjacency list from task dependencies (only intra-phase deps)
2. Tasks with no unmet dependencies form the first group
3. Remove satisfied tasks, find next group with no unmet deps
4. Repeat until all tasks are assigned

This produces the same groupings as the manually-written parallel groups in the ROADMAP template but computed from the dependency graph. It's used when generating a new ROADMAP (the parser reads existing groups from markdown).

### 5. Module boundaries and function signatures

All modules are stateless, pure-function based:

- **parser.ts**: `parseRoadmap(markdown: string): Roadmap`, `parsePhase(lines: string[], phaseNumber: number): RoadmapPhase`, `parseTask(line: string): RoadmapTask`
- **generator.ts**: `generateRoadmap(roadmap: Roadmap): string`
- **classifier.ts**: `classifyTask(description: string, dependencies: readonly string[], deliverable: string): TaskComplexity`
- **parallel.ts**: `detectParallelGroups(tasks: readonly RoadmapTask[]): ParallelGroup[]`
- **helper/roadmap.ts**: `markTaskDone(markdown: string, taskId: string): string`, `markTaskUndone(markdown: string, taskId: string): string`, `getNextTask(roadmap: Roadmap): RoadmapTask | null`

Error cases (malformed markdown, unknown task ID) throw typed errors, not bare `Error`.

### 6. Error types

Define a `RoadmapParseError` for parser failures (includes line number and context) and a `RoadmapTaskNotFoundError` for task marker operations on nonexistent task IDs. Both extend `Error` with a `name` property set to the class name.

## Risks / Trade-offs

**[Regex fragility]** → Mitigated by testing against the real ROADMAP.md and the template. The format is project-controlled and unlikely to drift. If it does, tests will catch it immediately.

**[Heuristic classifier accuracy]** → Proxy signals may misclassify edge cases. Mitigated by keeping the classifier simple and allowing callers to override. The orchestrator can reclassify based on actual implementation outcomes.

**[Raw text manipulation for task marking]** → Relies on task ID uniqueness within the document. Mitigated by matching the full task line pattern `- [( |x)] {taskId} ` to avoid false positives on IDs that appear in description text.

**[No round-trip guarantee]** → A parsed-then-generated ROADMAP may differ from the original in whitespace or ordering of non-essential sections. This is acceptable because the generator is used for creating new ROADMAPs, while the task marker (which preserves formatting) is used for modifying existing ones.
