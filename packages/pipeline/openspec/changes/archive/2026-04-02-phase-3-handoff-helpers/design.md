## Context

Phases 0–2 established the project foundation, type system, and ROADMAP parser/generator. The codebase follows a functional style: pure functions, typed error classes, Zod at boundaries, no stateful classes. All existing modules (`roadmap/parser.ts`, `roadmap/generator.ts`, `helper/roadmap.ts`) operate on data passed as arguments and return new values.

Phase 3 introduces seven modules across three layers:

1. **Core managers** (`handoff/manager.ts`, `metrics/logger.ts`) — domain logic for reading/writing structured markdown files
2. **Helper utilities** (`helper/handoff.ts`, `helper/metrics.ts`, `helper/drift.ts`, `helper/checkpoint.ts`, `helper/scanner.ts`) — thin convenience wrappers and standalone utilities
3. **Tests** (`tests/handoff-manager.test.ts`, `tests/helper.test.ts`)

All modules consume existing types from Phase 1 (`HandoffState`, `WakeContext`, `InvocationMetrics`, `CostManifest`, `DriftSentinel`, etc.) and follow the established functional pattern.

## Goals / Non-Goals

**Goals:**

- Implement all seven source modules with full type safety against Phase 1 types
- Keep all functions pure where possible (filesystem I/O isolated to explicit read/write boundaries)
- Follow the established pattern: typed error classes, Zod validation at boundaries, `.js` extensions in imports
- Enable Phase 4 (Orchestrator) and Phase 5 (Execution Engine) to build directly on these utilities
- Shadow git checkpoints must be completely isolated from user's git history

**Non-Goals:**

- No markdown parsing of HANDOFF.md from raw text (unlike ROADMAP parser, HANDOFF manager works with typed `HandoffState` objects serialized as JSON, not freeform markdown — the template is for human readability, not machine parsing)
- No network I/O or external service calls
- No CLI commands — these are library modules only
- No integration with the orchestrator loop — that's Phase 4
- No cleanup or entropy management — that's Phase 7

## Decisions

### 1. HANDOFF persistence format: JSON, not markdown parsing

**Decision**: `HANDOFF.md` will contain a JSON code block that machines read/write, with markdown sections generated around it for human readability. The manager operates on `HandoffState` objects, serializes to JSON, and wraps in markdown.

**Why**: The ROADMAP module already demonstrated that markdown parsing is complex and fragile (`parser.ts` is 180+ lines of regex). HANDOFF has richer nested structure (task logs, conventions, ADRs) that would make a markdown parser even more brittle. JSON serialization is lossless and trivial.

**Alternatives considered**:

- Pure markdown parsing (like ROADMAP) — rejected: too fragile for nested structures, would require 300+ lines of regex
- YAML frontmatter — rejected: adds a dependency, no clear advantage over JSON
- Separate `.json` sidecar file — rejected: violates the single-file `HANDOFF.md` contract from REQUIREMENTS.md

**Format**: The file will have a human-readable markdown header followed by a fenced JSON block:

````markdown
# HANDOFF

<!-- Machine-managed file. Edit the JSON block below. -->

​`json
{ ... HandoffState ... }
​`
````

### 2. Checkpoint manager: `execFile` over `exec` for git operations

**Decision**: Use `node:child_process/execFile` (not `exec`) for all git commands in the checkpoint manager.

**Why**: `execFile` doesn't spawn a shell, which avoids shell injection risks from checkpoint labels or file paths. Since we control all arguments programmatically, there's no need for shell features.

**Alternatives considered**:

- `exec` with shell — rejected: unnecessary attack surface
- `simple-git` npm package — rejected: adds external dependency for ~5 git commands
- `isomorphic-git` — rejected: heavy dependency, overkill for shadow repo operations

### 3. Injection scanner: pattern-based, not ML-based

**Decision**: The scanner uses regex pattern matching against known injection patterns (instruction overrides, invisible Unicode, base64/URL exfiltration).

**Why**: The scanner runs synchronously on every write to persistent files. It must be fast, deterministic, and have zero external dependencies. Pattern matching catches the documented threat model from REQUIREMENTS.md without introducing ML inference latency.

**Alternatives considered**:

- LLM-based content review — rejected: too slow, too expensive for every write operation
- AST-based analysis — rejected: content is natural language, not code

### 4. Metrics logger: append-only file with JSON lines

**Decision**: `PIPELINE-METRICS.md` stores metrics as a JSON-lines block (one JSON object per line). The logger appends new entries. Cost manifest aggregation reads all entries and computes totals.

**Why**: Append-only is safe for concurrent writes (multiple agents in parallel phases). JSON-lines is trivially parseable (`split('\n').map(JSON.parse)`) without needing a streaming JSON parser.

**Alternatives considered**:

- Single JSON array — rejected: requires read-modify-write (race condition risk)
- SQLite — rejected: adds dependency, overkill for append-only metrics
- CSV — rejected: escaping issues with string fields

### 5. Drift sentinel: plain key=value format

**Decision**: The `.pipeline-drift-sentinel` file uses a simple `key=value` format as specified in REQUIREMENTS.md, with `attempts_log` as JSON array on one line.

**Why**: Must be readable by both the orchestrator (programmatic) and humans (debugging). The format matches what REQUIREMENTS.md specifies.

### 6. Helper modules are pure projections

**Decision**: `helper/handoff.ts` and `helper/metrics.ts` contain only pure functions that project data from core types. No filesystem I/O — they receive typed objects and return typed objects.

**Why**: Keeps the helpers testable without mocking filesystem. The callers (orchestrator, execution engine) handle I/O and pass data to helpers.

## Risks / Trade-offs

**Shadow git isolation** — If the user's project is already inside a git repo, we must ensure `GIT_DIR` and `GIT_WORK_TREE` environment variables are set correctly per-invocation to prevent contamination. → Mitigation: Every `execFile` call explicitly sets both env vars; never rely on ambient git state.

**HANDOFF.md growth** — Despite bounding rules (15-line current state, 5 task log entries, 10 compressed history bullets), a malformed or rapidly-updating agent could grow the file. → Mitigation: The `writeHandoff()` function enforces bounds before serialization, truncating task log and compressed history arrays.

**Checkpoint disk usage** — Shadow git repos consume disk space proportional to project size times number of active checkpoints. → Mitigation: Checkpoints are deleted on phase success (per REQUIREMENTS.md lifecycle). The budget check (>50K files) skips checkpointing gracefully.

**Scanner false positives** — Legitimate content might trigger injection patterns (e.g., a lesson entry that says "the agent must now validate inputs"). → Mitigation: The scanner returns findings with matched patterns, allowing callers to review. In non-strict mode, flagged content is logged but not rejected.
