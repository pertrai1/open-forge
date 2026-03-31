# OpenForge Pipeline — Requirements

## Overview

**open-forge-pipeline** is an OpenCode plugin distributed as an npm package. It transforms natural language requirements into a fully implemented application through an autonomous agent pipeline.

**Tech Stack**: TypeScript / Node.js
**Distribution**: npm package (`open-forge-pipeline`)
**Interface**: CLI + OpenCode commands

The plugin orchestrates the entire software development lifecycle:

1. **Requirements Intake** — Accept natural language requirements from the user
2. **Intent Analysis** — An orchestrator agent analyzes requirements and determines the optimal approach
3. **ROADMAP Generation** — Build a structured, phase-based execution plan
4. **Autonomous Execution** — Pipeline agents execute the ROADMAP phase by phase, writing thorough specs, implementing code, creating tests, and generating documentation

## Problem Statement

Building software from requirements is typically:

- **Manual** — Humans must translate requirements into tasks, then execute them
- **Fragmented** — Context is lost between sessions, decisions are re-litigated
- **Error-prone** — Inconsistent patterns, missing tests, incomplete implementations

Developers need a system that:

- Accepts raw requirements and produces working code
- Maintains context across long-running projects
- Enforces quality gates automatically
- Requires minimal human intervention

## Solution

A **pipeline router** that:

1. Classifies incoming requirements by intent (new project, feature addition, bug fix, refactor)
2. Routes to the appropriate orchestrator workflow
3. Generates a phased ROADMAP with atomic, testable tasks
4. Executes the ROADMAP using autonomous agents that:
   - Write tests before implementation (test-first)
   - Follow established project patterns
   - Persist decisions across sessions via handoff files
   - Stop only when quality gates pass

## Core Components

### 1. Requirements Intake

**Input Formats:**

- Natural language requirements (plain text)
- Structured requirements (REQUIREMENTS.md format)
- Verbal requirements (transcribed to text)

**Processing:**

- Parse requirements into discrete capabilities
- Identify dependencies between capabilities
- Detect ambiguity and request clarification when needed

### 2. Intent Router

Classifies requirements into execution strategies:

| Intent        | Strategy       | Description                                    |
| ------------- | -------------- | ---------------------------------------------- |
| `new-project` | Full Pipeline  | Complete application from scratch              |
| `feature-add` | Incremental    | Add capability to existing codebase            |
| `bug-fix`     | Targeted       | Fix specific issue with minimal scope          |
| `refactor`    | Transformation | Improve code structure without behavior change |
| `migration`   | Port           | Move from one stack to another                 |

The orchestrator agent analyzes requirements and selects the appropriate strategy.

### 3. ROADMAP Generator

Transforms requirements into an executable plan.

**ROADMAP Structure:**

```markdown
# Project Name - Implementation Roadmap

## Overview

[Project context, tech stack, key decisions]

## Phase 0: [Phase Name]

**Goal**: [What this phase accomplishes]

### Tasks

- [ ] 0.1 Task description [deps: None] [deliverable: path/to/file]
- [ ] 0.2 Task description [deps: 0.1] [deliverable: path/to/file]

**Parallel Groups**:

- Group A: 0.1, 0.2 (independent)
- Group B: 0.3 (requires 0.1)

## Phase 1: [Phase Name]

...
```

**Generation Rules:**

- Each task is atomic (single deliverable)
- Dependencies are explicit via `[deps: X.Y]` tags
- Parallel groups identify tasks that can run concurrently
- Each phase has a clear goal and completion criteria

**Task Complexity Classification:**

Before execution, each task is classified by complexity to determine routing and verification depth:

| Complexity | Criteria | Handling |
|------------|----------|----------|
| **Trivial** | <50 lines, single file, no deps | Single agent, direct implementation |
| **Simple** | <100 lines, 1-2 files, clear deps | Single agent with verification |
| **Medium** | 100-300 lines, 3-5 files, cross-cutting | Separated agents (test-author → implementer) |
| **Complex** | >300 lines, >5 files, architectural impact | Full gate sequence + architect review |

Classification happens during ROADMAP generation and is recorded in each task's metadata.

### 4. Pipeline Orchestrator

Manages execution across multiple OpenCode sessions.

**Session Management:**

- Each phase runs in a fresh session (prevents context exhaustion)
- `HANDOFF.md` bridges context between sessions
- Orchestrator monitors progress and handles failures

**Execution Modes:**

- `single-phase` — Process one phase, then exit (for external orchestration)
- `continuous` — Process all phases until complete
- `range` — Process specific phases (e.g., phases 2-5)

**Failure Handling:**

- Max 3 retry attempts per phase
- Drift detection (agent stuck in loop)
- Quality gates must pass before phase completion
- Blockers documented in structured format for human intervention

**Drift Detection:**

When an agent cannot proceed after 3 fix attempts:

1. Write drift sentinel: `.pipeline-drift-sentinel`
   ```
   phase=N
   reason=quality checks failed after 3 cycles
   timestamp=ISO8601
   ```
2. Document blocker in `PIPELINE-ISSUES.md` with:
   - Exact error message
   - Context (files, commands, expected outcome)
   - Attempted solutions
   - Specific need from human
3. Orchestrator detects sentinel and halts (prevents infinite retry loops)
4. Sentinel cleared when phase advances successfully

This pattern prevents wasted tokens on unresolvable issues and signals humans exactly when intervention is needed.

### 5. Plan Generation & Selection

Before implementation begins, the orchestrator should generate multiple approaches and select the best one via a critic agent.

**Why This Matters:**

Agents naturally favor short-term, "cheap labor" fixes. Without intervention, they will:

1. Select the easiest plan (not the best plan)
2. Cut corners on implementation
3. Produce code that's harder to maintain long-term

**Process:**

1. **Generate N=3-5 implementation approaches** for each phase (not just one)
2. **Invoke a critic agent** (separate context) to evaluate against:
   - Long-term maintainability
   - Pattern consistency with existing codebase
   - Complexity proportionality
   - Dependency direction correctness
3. **Select the plan** that follows "clean-code" principles, not the easiest path

This prevents "Plan A-prime" drift where agents naturally favor short-term, cheap-labor fixes.

### 6. Execution Engine

The agent-side logic that implements each phase.

**Per-Phase Workflow:**

1. **Read HANDOFF.md** — Restore session context (decisions, patterns, progress)
2. **Clear drift sentinel** — If retrying a previously stuck phase
3. **Get next phase and tasks** — Query ROADMAP for pending work
4. **Create phase artifacts** — Write specs → design → tasks (holistically for entire phase)
5. **Create unit tests** — Write tests **before** implementation (test-first)
6. **Implement tasks** — Execute in dependency order, mark each done individually
7. **Run quality checks** — Lint, typecheck, test, build (up to 3 retry cycles)
8. **Handle failures** — If checks fail after 3 tries → write drift sentinel → document in PIPELINE-ISSUES
9. **Update documentation** — CHANGELOG.md, README.md
10. **Commit atomically** — Single commit per phase
11. **Archive change** — If using OpenSpec integration
12. **Update HANDOFF.md** — Persist context + append new ADRs

**Quality Gates:**

- All tests pass
- No type errors
- No lint errors
- Build succeeds
- Documentation updated

### 7. Context Firewalls

Context firewalls prevent **confirmation bias** by limiting what agents can see based on their role.

**The Problem:**

When a single agent writes both tests and implementation:

1. **Confirmation bias** — Tests unconsciously validate the planned solution rather than challenging it
2. **Hallucination reinforcement** — If the agent hallucinates a behavior during test writing, it will hallucinate the same behavior during implementation. The test passes, but the code is wrong.

**The Solution:**

Separate test author from implementer with information barriers:

| Role | Allowed Access | Blocked Access |
|------|----------------|----------------|
| **Test Author** | proposal.md, specs/*.md, design.md (behavioral sections), public API signatures | Implementation code, design.md (strategy sections), tasks.md, progress.md |
| **Implementer** | All spec artifacts, test files (READ-ONLY), existing codebase | Cannot modify test files |
| **Gate Agents** | Diff, specs, review reports | progress.md (to avoid bias) |

**Enforcement**: Via skill file instructions, not programmatic access control.

**Disagreement Protocol:**

When the implementer believes a test is wrong:

1. **STOP** work on that specific behavior
2. **Document** the disagreement with evidence:
   - What the test asserts
   - What the spec says
   - Why the implementation finds a conflict
3. **Route to orchestrator** for decision:
   - Re-invoke test author to fix the test
   - Ask user to arbitrate
   - Tell implementer to proceed as-is
4. **Implementer continues** with other tests while waiting

This is NOT an escape hatch for difficult implementations. A test that is hard to pass is doing its job. The disagreement protocol is for genuine conflicts between test and spec.

### 8. Post-Implementation Gates

After all tasks are implemented, six sequential gates run autonomously. Each gate must pass before the next runs.

**Gate Sequence** (ordered by feedback cost — cheapest fixes first):

| Order | Gate | Question | Failure Action | Focus |
|-------|------|----------|---------------|-------|
| 1 | **Verify** | Did you build what you specified? | Self-correction loop | Spec compliance: all requirements from specs implemented? |
| 2 | **QA Testing** | What can break? | Self-correction loop | Edge cases, error paths, failure modes, developer missed |
| 3 | **Security Audit** | Is it secure? | Self-correction loop | OWASP, secrets, injection vectors, dependency risks |
| 4 | **Architect Review** | Does it fit the architecture? Any drift? | Self-correction loop + Intent Verification | Structural fitness, dependency direction, API bloat |
| 5 | **Code Review** | Is the code quality good? | Self-correction loop | 11 dimensions: error handling, type safety, test quality, patterns, readability, performance |
| 6 | **Integration Testing** | Does it work with the rest of the system? | Self-correction loop | Cross-package seams, import contracts, event flows |

**Self-Correction Loop** (per gate, max 3 attempts):

1. **Failure Detection**: Gate fails → orchestrator reads MUST FIX findings
2. **Targeted Fix**: Assigns fix task to implementer with specific findings and remediation instructions
3. **Re-run from failed gate forward**: After fix committed, re-runs **failed gate and all subsequent gates** (earlier gates only re-run if fix modified their files)
4. **Hard Stop**: After 3 failures on same gate → document in `PIPELINE-ISSUES.md` → notify human

This loop ensures most gate failures are resolved autonomously. Humans only see PRs that have already passed all review gates — or explicit escalations.

**Intent Verification** (when `intent.md` exists):

- Compares agent's stated reasoning against actual code
- Checks: Did it actually reuse utilities as claimed?
- Checks: Did you check downstream components it listed?
- Produces pass/fail per claim with evidence
- 2+ failed claims → request-changes verdict

### 9. Lessons Feedback Loop

Captures recurring mistake patterns from gate failures and feeds them back to future agent invocations.

**Workflow:**

```
Gate failure found (QA, Security, Code Review, Architect Review)
       │
       ▼
Orchestrator fixes the issue
       │
       ▼
Pattern recurring? ──No──► Skip
       │
      Yes
       │
       ▼
Already in LESSONS.md? ──Yes──► Skip
       │
       No
       │
       ▼
Append lesson to LESSONS.md
       │
       ▼
Future test-authors and implementers read lessons before starting work
```

**LESSONS.md Categories:**

| Category | Content |
|----------|---------|
| **Testing** | Test patterns that catch common bugs |
| **Implementation** | Code patterns that avoid common mistakes |
| **Error Handling** | Error patterns that prevent cascading failures |
| **Security** | Security patterns that prevent vulnerabilities |

**What Goes Where:**

| Content | Location |
|---------|----------|
| Recurring mistake patterns | `LESSONS.md` |
| Architecture decisions | `HANDOFF.md` (ADRs) |
| Coding standards | `AGENTS.md` or `CODING.md` |

### 10. Entropy Management

After implementation and gate passes, allocate specific tokens for cleanup to prevent "unmaintainable repositories" where entropy accumulates over time.

**The Problem:**

Agents rarely update documentation or clean up dead code. Over multiple phases, this leads to:

- Outdated comments and documentation
- Unused imports and dependencies
- Dead code / commented-out code
- Duplicate logic across files
- Merge conflicts or contradictions

**Solution: Cleanup Agent**

After gates pass, before phase completion, a **cleanup agent** with fresh context performs:

| Task | Examples |
|------|----------|
| **Remove dead code** | Commented-out blocks, unused functions, orphaned files |
| **Update documentation** | README, CHANGELOG, inline JSDoc, AGENTS.md |
| **Remove unused imports** | `import` statements never referenced |
| **Consolidate duplicates** | Same logic in multiple files → extract to shared utility |
| **Resolve contradictions** | Conflicting comments, outdated TODO markers |

**Entropy Budget:**

Allocate ~5-10% of phase tokens specifically for cleanup. This prevents agents from skipping cleanup due to token anxiety.

**When to Skip:**

- Trivial tasks (<50 lines, single file)
- Documentation-only changes
- Emergency fixes

### 11. Session Handoff System

Persistent context that survives session boundaries. **Based on the "progress.md" pattern from cg-agent-flow.**

**HANDOFF.md Structure (Bounded):**

```
┌─────────────────────────────────────────────────┐
│  Current State (REWRITTEN on every update)       │
│  Tasks completed, packages touched, branch       │
│                                                  │
│  Goal Context (WHY — traced from requirements)   │
│  Problem: <from REQUIREMENTS.md>                 │
│  User Story: <relevant capability>               │
│  Spec Requirement: <requirement being built>     │
│  Current Task: <what this delivers>              │
│                                                  │
│  Active Conventions (MANDATORY to follow)        │
│  - Error handling pattern                        │
│  - Naming conventions                            │
│  - Import style                                  │
│                                                  │
│  Open Issues                                     │
│  - Blockers or gotchas                           │
├─────────────────────────────────────────────────┤
│  Task Log (APPEND-ONLY, last 5 verbatim)         │
│  Task N.M — What, key decision, files, commit    │
├─────────────────────────────────────────────────┤
│  Compressed History (oldest entries condensed)   │
│  - Tasks 1.1–1.4: Types and schemas. Files: ...  │
│  - Max ~10 bullets; oldest dropped when full     │
└─────────────────────────────────────────────────┘
```

**Bounding Rules** (prevents unbounded growth):

- **Current State**: Always rewritten (~15 lines max)
- **Task Log**: Last 5 entries verbatim; older compressed
- **Compressed History**: Max ~10 bullets; oldest dropped
- **Practical ceiling**: ~150 lines / ~600 tokens per file

**Who Reads What:**

| Role | HANDOFF.md Access | Rationale |
|------|-------------------|-----------|
| **Orchestrator** | Full | Needs complete context to manage the loop |
| **Implementer** | Active Conventions only | Must follow patterns, Task Log may bias away from test-driven approach |
| **Test Author** | None | Contains implementation decisions that would violate the context firewall |
| **Gate Agents** | None | Gates have their own context (diff, specs, review reports) |

**Structured Wake Context:**

When the orchestrator hands off to a new thread, it includes a **structured wake context** block directly in the handoff message. This gives the next thread immediate orientation without requiring it to parse `HANDOFF.md` first:

```
Wake Context:
- Change: <name>
- Branch: change/<name>
- Next Task: <task-id> — <description>
- Progress: N/M tasks complete
- Goal Context: <problem> → <user story> → <spec requirement>
- Packages Touched: <list>
- Active Conventions: <key conventions>
- Open Issues: <blockers or gotchas>
- Last Commit: <hash> — <message>
```

This is a **summary of** `HANDOFF.md`, not a replacement. `HANDOFF.md` remains the source of truth for full task log, compressed history, and detailed conventions.

### 12. Todo-Driven Completion

Prevents premature phase exits by enforcing hard completion constraints.

**The Problem:**

Agents may declare work "done" before all tasks are complete or quality gates passed. Without hard constraints, they exit early.

**Solution:**

Before a phase can be marked complete, the system checks `isIncomplete()`:

```typescript
function isIncomplete(state: PhaseState): string | null {
  if (state.mode === 'plan') return null;
  if (state.pendingTasks.length > 0) {
    return `You have pending tasks: ${state.pendingTasks}. Mark all tasks complete before ending.`;
  }
  if (!state.qualityGatesPassed) {
    return `Quality gates not passed. Run all gates before ending.`;
  }
  return null;
}
```

If `isIncomplete()` returns a message, the agent cannot terminate until all constraints are satisfied.

This prevents premature exits — the agent cannot declare work "done" until all constraints are satisfied.

### 13. Clarification Limits

When requirements are ambiguous, the orchestrator may ask clarifying questions:

- **Maximum 2 clarification rounds** before proceeding with best judgment
- Document assumptions in `HANDOFF.md` when proceeding without full clarity
- This prevents infinite clarification loops while ensuring reasonable understanding

**Example:**

Ask things like:

- "How detailed should the final report be?"
- "What specific angles should be explored?"
- "Are there any constraints I should know about?"

After 2 rounds, the agent proceeds with its best understanding, documenting any assumptions made.

### 14. Observability Pattern

Every tool execution returns structured data for metrics without polluting the agent's context.

**Tool Result Structure:**

```typescript
interface ToolResult {
  modelResponse: string;      // What the LLM sees
  metadata: {                 // For logging/metrics
    exitCode?: number;
    duration?: number;
    filesChanged?: string[];
    tokensUsed?: number;
  };
}
```

**Usage:**

- **modelResponse**: Displayed to the agent
- **metadata**: Written to `PIPELINE-METRICS.md` for observability

This separation enables rich telemetry without polluting the agent's context window.

### 15. Plugin Architecture

**Plugin Interface Pattern:**

The plugin exports a function implementing the OpenCode `Plugin` interface:

```typescript
export default function OpenForgePipelinePlugin(): PluginInterface {
  return {
    tool: tools,                    // Tool registrations
    "chat.message": messageHandler, // Message interception
    config: configHandler,          // Dynamic configuration
    event: eventHandler,            // Lifecycle events
    "tool.execute.before": beforeHandler,
    "tool.execute.after": afterHandler,
  }
}
```

**Layered Configuration:**

Configuration is merged in priority order (later overrides earlier):

1. **Plugin defaults** — Built-in defaults
2. **Global config** — `~/.config/opencode/forge.config.json`
3. **Project config** — `./.opencode/forge.config.json`

**Schema Validation:**

All configuration is validated via Zod schema:

```typescript
const ForgeConfigSchema = z.object({
  language: z.enum(['typescript', 'python', 'go']).optional(),
  framework: z.string().optional(),
  testFramework: z.string().optional(),
  buildCommand: z.string().optional(),
  testCommand: z.string().optional(),
  lintCommand: z.string().optional(),
  // ... additional fields
});
```

**JSONC Support:**

Config files support comments and trailing commas for developer experience.

## User Interface

### CLI Commands

```bash
# Initialize a new project from requirements
npx open-forge-pipeline init --requirements ./REQUIREMENTS.md

# Generate ROADMAP only (no execution)
npx open-forge-pipeline plan --requirements ./REQUIREMENTS.md

# Execute existing ROADMAP
npx open-forge-pipeline run

# Execute single phase
npx open-forge-pipeline run --phase 2

# Check status
npx open-forge-pipeline status

# Resume from interruption
npx open-forge-pipeline resume
```

### OpenCode Commands

```markdown
/forge-init — Initialize project from requirements
/forge-plan — Generate or update ROADMAP
/forge-run — Execute ROADMAP autonomously
/forge-status — Show current progress
/forge-resume — Resume from last checkpoint
```

## Package Structure

```
open-forge-pipeline/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Exports for programmatic use
│   ├── cli.ts                # CLI entry point
│   ├── commands/
│   │   ├── init.ts           # forge init
│   │   ├── plan.ts           # forge plan
│   │   ├── run.ts            # forge run
│   │   ├── status.ts         # forge status
│   │   ├── resume.ts         # forge resume
│   │   └── index.ts          # Command registry
│   ├── lib/
│   │   ├── roadmap/
│   │   │   ├── parser.ts     # ROADMAP.md parsing
│   │   │   ├── generator.ts  # ROADMAP generation from requirements
│   │   │   └── types.ts      # ROADMAP types
│   │   ├── handoff/
│   │   │   ├── manager.ts    # HANDOFF.md operations
│   │   │   └── types.ts      # Handoff types
│   │   ├── helper/           # Thin utilities for agent bookkeeping
│   │   │   ├── roadmap.ts    # ROADMAP.md task marking (parse/update)
│   │   │   ├── handoff.ts    # HANDOFF.md read/write operations
│   │   │   ├── metrics.ts    # PIPELINE-METRICS.md token tracking
│   │   │   ├── drift.ts      # Sentinel file management (.pipeline-drift-sentinel)
│   │   │   └── quality.ts    # Quality gate runner (wraps npm scripts)
│   │   ├── orchestrator/
│   │   │   ├── session.ts    # Session management
│   │   │   ├── router.ts     # Intent classification
│   │   │   └── executor.ts   # Phase execution logic
│   │   ├── quality/
│   │   │   ├── checker.ts    # Quality gate runner
│   │   │   └── types.ts      # Check result types
│   │   └── metrics/
│   │       ├── logger.ts     # PIPELINE-METRICS.md operations
│   │       └── types.ts      # Metrics types
│   └── types.ts              # Shared types
├── commands/                  # OpenCode command definitions
│   ├── forge-init.md
│   ├── forge-plan.md
│   ├── forge-run.md
│   ├── forge-status.md
│   └── forge-resume.md
├── templates/                # File templates
│   ├── ROADMAP.template.md
│   ├── HANDOFF.template.md
│   └── forge.config.template.json
├── tests/                    # Unit tests
│   ├── roadmap-parser.test.ts
│   ├── handoff-manager.test.ts
│   ├── orchestrator.test.ts
│   └── ...
└── README.md
```

## Distribution

**npm Package:** `open-forge-pipeline`

```bash
# Install globally
npm install -g open-forge-pipeline

# Or use with npx (no global install needed)
npx open-forge-pipeline init --requirements ./REQUIREMENTS.md
```

**OpenCode Plugin Registration:**

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["open-forge-pipeline"]
}
```

Or add to project's `.opencode/opencode.json`:

```json
{
  "plugin": ["open-forge-pipeline"]
}
```

## Integration Points

### OpenCode Platform

- Plugin architecture (installs via npm)
- Commands registered as `commands/*.md` (loaded by OpenCode)
- Uses OpenCode's LLM agent capabilities
- Leverages OpenCode's tool ecosystem (LSP, AST-grep, etc.)

### Optional: OpenSpec Integration

If OpenSpec CLI is available:

- Specs can be managed via OpenSpec change workflow
- Artifacts (proposal, specs, design, tasks) generated per phase
- Delta specs synced to main specs on completion
- Changes archived for audit trail

### Cost Manifest

Enhanced metrics for per-invocation token tracking for skill effectiveness metrics.

**Per-Invocation Cost Manifest:**

| Invocation | Role | Input | Output | Cache | Cost | Outcome | Skill Refs |
|------------|------|-------|--------|-------|------|---------|------------|
| 1 | test-author | 12K | 3K | 8K | $0.15 | pass | 2 |
| 2 | implementer | 18K | 5K | 12K | $0.22 | pass | 3 |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Metrics Revealed:**

- **Agent efficiency**: Cost per successful gate pass, first-pass rate per role
- **Skill effectiveness**: Whether loaded skills correlate with higher first-pass rates
- **Pipeline waste**: What % of total spend is retries, which roles are bottlenecks
- **Trend analysis**: Compare early phases vs later phases to see if lessons are being learned

This enables data-driven optimization of the pipeline configuration and skill selection.

### Tech Stack Detection

The plugin should detect or be configured for:

- Language (TypeScript, Python, Go, etc.)
- Framework (React, Express, FastAPI, etc.)
- Test framework (Vitest, Jest, pytest, etc.)
- Build system (npm, cargo, pip, etc.)

Configuration via `forge.config.json`:

```json
{
  "language": "typescript",
  "framework": "express",
  "testFramework": "vitest",
  "buildCommand": "npm run build",
  "testCommand": "npm run test",
  "lintCommand": "npm run lint"
}
```

## File Structure (Generated)

```
project/
├── ROADMAP.md           # Execution plan (generated from requirements)
├── HANDOFF.md           # Session context bridge
├── intent.md            # Implementation decisions (optional, for intent verification)
├── LESSONS.md           # Recurring mistake patterns from gate failures
├── forge.config.json    # Plugin configuration
├── PIPELINE-LOG.md      # Human-readable execution log
├── PIPELINE-METRICS.md  # Machine-captured metrics + per-invocation cost manifest
├── PIPELINE-ISSUES.md   # Blocker documentation
├── src/                 # Generated source code
├── tests/               # Generated tests
└── ...
```

## Non-Goals

- **Not a code generator** — Agents write real code, not templates
- **Not a replacement for human oversight** — Blockers require human intervention
- **Not tied to a specific stack** — Must work with any tech stack
- **Not a CI/CD system** — Execution happens locally in OpenCode sessions

## Success Criteria

1. **Requirements to ROADMAP** — Natural language requirements produce a complete, logical ROADMAP
2. **Autonomous Execution** — Pipeline runs without human intervention until complete or blocked
3. **Context Persistence** — Sessions can be interrupted and resumed without loss
4. **Quality Enforcement** — No phase completes without passing quality gates
5. **Reusability** — Plugin works across different project types and stacks

## Open Questions

### Resolved (Based on opsx-loop Patterns)

1. **Tech Stack Specification** → **Hybrid Approach**
   - Config in `forge.config.json` for explicit settings
   - Auto-detect from `package.json`, language files, framework configs
   - User can override detection with explicit config

2. **Multiple ROADMAPs** → **Single ROADMAP with Phases**
   - opsx-loop pattern: One ROADMAP.md with sequential phases
   - Complex projects can use phase grouping (e.g., "Phase 2A: Frontend", "Phase 2B: Backend")
   - Simplicity wins — multiple ROADMAPs add coordination complexity

3. **Human-in-the-Loop** → **PIPELINE-ISSUES.md for Blockers**
   - No automatic pauses between phases (run until complete or blocked)
   - Agent documents blockers in `PIPELINE-ISSUES.md` with structured format
   - Human reviews issues and provides resolution

4. **Incremental Requirements** → **ROADMAP Regeneration**
   - When new requirements arrive, regenerate ROADMAP with new phases
   - Completed phases remain marked `[x]`
   - New phases appended with appropriate dependencies

5. **Template Libraries** → **Not in Scope**
   - Agents write real code, not templates
   - Project scaffolding (e.g., "new React app") is a Phase 0 task
   - Focus on transformation, not boilerplate generation

6. **Phase Granularity** → **5-6 tasks per phase**
   - Enough work to be meaningful
   - Small enough to complete in one session
   - Matches opsx-loop proven pattern

7. **Parallel Phase Execution** → **Supported for independent phases**
   - Phases with no dependencies can run in parallel sessions
   - Orchestrator coordinates via ROADMAP task status
   - Useful for large projects with independent workstreams

8. **ROADMAP Versioning** → **Version alongside code**
   - Commit ROADMAP.md after each phase
   - Enables progress tracking over time
   - Allows rollback to known-good state
   - Shows what was built and when

9. **Multi-Project Support** → **Via working directory**
   - One plugin instance installed globally
   - Each project has its own ROADMAP.md, HANDOFF.md, etc.
   - Plugin operates on current working directory
   - No cross-project state sharing

## Tech Stack

**Language**: TypeScript
**Runtime**: Node.js 18+
**Distribution**: npm package (`open-forge-pipeline`)
**Interface**: CLI + OpenCode Plugin

### Why TypeScript

- **Single dependency** — No Python or other runtimes required
- **Distributable** — Ships as a single npm package with compiled binaries
- **Testable** — Full unit test coverage with Vitest
- **Type-safe** — Catch errors at compile time, not runtime
- **Native integration** — Same language as OpenCode ecosystem

## Dependencies

### Required (User's Machine)

- OpenCode CLI
- Node.js 18+
- Git

### Optional

- OpenSpec CLI (for spec-driven workflow if using OpenSpec for specs)
