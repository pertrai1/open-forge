> **DEPRECATED** — This file is specific to the MCP package's original loop setup. The canonical forge loop documentation lives at [`/docs/LOOP.md`](../../docs/LOOP.md) and the command at [`/.claude/commands/forge-loop.md`](../../.claude/commands/forge-loop.md).

# Automation Loop

The ROADMAP is completed by an **LLM agent** running inside OpenCode, not by a
standalone shell script. The agent drives each **phase** end-to-end — writing
real specs, tests, and source code — using the `opsx-*` workflow commands and a
thin helper script for bookkeeping.

**One openspec change per phase.** All tasks within a phase are grouped under a
single change, so the proposal, specs, design, and tasks artifacts describe the
phase as a cohesive unit rather than isolated tasks.

**One session per phase.** Each phase runs in a fresh session that reads
`HANDOFF.md` to restore context from the previous session. This prevents
context exhaustion on long ROADMAPs.

## How to Run

```bash
# Inside an OpenCode session, invoke the loop command:
/opsx-loop          # process all phases 0-9
/opsx-loop 2        # process only phase 2
/opsx-loop 3-5      # process phases 3 through 5
```

The agent will work autonomously through every pending phase without prompting
between iterations. Interrupt at any time to pause; restarting `/opsx-loop`
picks up from the first phase that still has unchecked tasks, reading
`HANDOFF.md` to restore context from the previous session.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  LLM Agent  (OpenCode — Session N)                       │
│                                                          │
│  /opsx-loop                                              │
│    │                                                     │
│    ├─ read HANDOFF.md ──────────────────────────────┐   │
│    │    (restores: decisions, patterns, progress)   │   │
│    │                                                │   │
│    ├─ for each phase with pending tasks:            │   │
│    │    │                                           │   │
│    │    ├── get phase info ──► roadmap-helper.sh    │   │
│    │    │     next-phase / phase-tasks              │   │
│    │    │                                           │   │
│    │    ├── create ONE change ──► openspec CLI      │   │
│    │    │     openspec new change "roadmap-phase-N" │   │
│    │    │                                           │   │
│    │    ├── write artifacts covering ALL tasks      │   │
│    │    │     proposal → specs → design → tasks     │   │
│    │    │                                           │   │
│    │    ├── write real tests (test-first)           │   │
│    │    │                                           │   │
│    │    ├── implement tasks (inner loop)            │   │
│    │    │                                           │   │
│    │    ├── quality checks ──► roadmap-helper.sh    │   │
│    │    ├── update docs ─────► roadmap-helper.sh    │   │
│    │    ├── commit ──────────► roadmap-helper.sh    │   │
│    │    ├── archive ─────────► openspec CLI         │   │
│    │    │                                           │   │
│    │    └── write HANDOFF.md ◄───────────────────┘  │   │
│    │         (phase decisions, progress, context)    │   │
│    │                                                 │   │
│    └─ loop to next phase                             │   │
└──────────────────────────────────────────────────────────┘
                         │
                         │ (context exhausted or user interrupt)
                         ▼
┌──────────────────────────────────────────────────────────┐
│  LLM Agent  (OpenCode — Session N+1)                     │
│                                                          │
│  /opsx-loop                                              │
│    │                                                     │
│    └─ read HANDOFF.md ── restores full context ──────►  │
│         continues from next pending phase                │
└──────────────────────────────────────────────────────────┘
```

**The agent is the brain.** It reads requirements, designs solutions, writes
code, and fixes failing checks. The helper script and openspec CLI are tools it
calls — they handle structured data extraction and bookkeeping, not thinking.

## Session Handoff

`HANDOFF.md` is the persistent context bridge between sessions. It solves the
core problem of context exhaustion on long ROADMAPs.

### What Gets Persisted

| Section                | Content                                        | Purpose                                |
| ---------------------- | ---------------------------------------------- | -------------------------------------- |
| **Current State**      | Phase, progress %, ROADMAP status              | Resume point for next session          |
| **Completed Phases**   | Table of phases + key artifacts                | What's been built                      |
| **Key Decisions**      | ADR-style entries per major decision           | Prevents re-litigating settled choices |
| **Project Patterns**   | Import conventions, error handling, test style | Ensures consistency                    |
| **Known Gotchas**      | Issues found and solved                        | Avoids repeating mistakes              |
| **Lessons Learned**    | What worked/didn't across sessions             | Improves future runs                   |
| **Next Phase Context** | Goal, critical context, gotchas for next phase | Warm start for next session            |
| **Changelog**          | Date/phase/session log                         | Audit trail                            |

### Handoff Commands

```bash
bash scripts/roadmap-helper.sh init-handoff              # Create HANDOFF.md (run once)
bash scripts/roadmap-helper.sh update-handoff <phase> <title> <done> <total>  # After each phase
bash scripts/roadmap-helper.sh show-handoff              # Quick summary view
```

### Session Lifecycle

```
Session Start:
  1. cat HANDOFF.md              → restore context
  2. bash roadmap-helper.sh status → confirm ROADMAP state
  3. /opsx-loop                  → begin from next pending phase

Session End (per phase):
  1. roadmap-helper.sh update-handoff <phase> ...  → write progress
  2. Append new decisions to HANDOFF.md            → preserve "why"
  3. Continue to next phase or end session
```

## Per-Phase Workflow

For each phase in @ROADMAP that has unchecked tasks:

```
 0. Read HANDOFF.md             Restore session context (decisions, patterns, progress)
 1. Get next phase              bash scripts/roadmap-helper.sh next-phase
 2. Get all phase tasks         bash scripts/roadmap-helper.sh phase-tasks --phase N
 3. Create ONE change           openspec new change "roadmap-phase-N"
 4. Fast-forward artifacts      Agent writes real proposal → specs → design → tasks
                                covering ALL tasks in the phase holistically
                                Uses openspec status/instructions to walk the graph
 5. Create unit tests           Agent reads spec scenarios, writes real vitest tests
                                with actual assertions (test-first, before implementation)
 6. Implement all tasks         Agent implements each task in order:
                                  - Write source code for the task
                                  - Mark task done: roadmap-helper.sh mark-done <id>
                                Follows existing project patterns in src/
 7. Quality checks              bash scripts/roadmap-helper.sh check
                                Fix and re-run up to 3 times if checks fail
 8. Update documentation        bash scripts/roadmap-helper.sh phase-update-docs <phase> <count> <title>
 9. Commit                      bash scripts/roadmap-helper.sh phase-commit <phase> <title>
10. Sync & archive              openspec archive "roadmap-phase-N" -y
11. Write HANDOFF.md            bash scripts/roadmap-helper.sh update-handoff <phase> <title> <done> <total>
                                Append new Key Decisions to HANDOFF.md
```

## Components

### `/opsx-loop` — Agent Command

The primary command. Defined in `.opencode/command/opsx-loop.md`. Contains the
full instructions the LLM follows to iterate through the ROADMAP by phase,
including when to pause, how to handle failures, and what "real content" means
at each step.

### `HANDOFF.md` — Session Context Bridge

The persistent state file that survives session boundaries. Created by
`init-handoff`, updated by `update-handoff` after every phase, and read at the
start of every session. Contains decisions, patterns, progress, and next-phase
context. This is what enables unlimited ROADMAP length regardless of context
window size.

### `scripts/roadmap-helper.sh` — Bookkeeping Utility

A thin bash script the agent shell-calls for structured operations that don't
require reasoning:

**Phase-level** (one openspec change per phase):

| Subcommand                                 | Purpose                                           |
| ------------------------------------------ | ------------------------------------------------- |
| `next-phase [--start N]`                   | Print next phase with pending tasks               |
| `phase-tasks --phase N`                    | Print ALL pending tasks for a phase               |
| `phase-change-name <phase>`                | Generate openspec change name (`roadmap-phase-N`) |
| `phase-commit <phase> [desc]`              | `git add -A && git commit` for a phase            |
| `phase-update-docs <phase> <count> [desc]` | Maintain CHANGELOG.md and README.md               |

**Session handoff:**

| Subcommand                                      | Purpose                               |
| ----------------------------------------------- | ------------------------------------- |
| `init-handoff`                                  | Create HANDOFF.md if it doesn't exist |
| `update-handoff <phase> <title> [done] [total]` | Update HANDOFF.md after phase         |
| `show-handoff`                                  | Display handoff summary               |

**Task-level** (used within a phase's inner loop):

| Subcommand              | Purpose                                |
| ----------------------- | -------------------------------------- |
| `next-task [--phase N]` | Print the next pending task            |
| `mark-done <id>`        | Toggle `- [ ]` → `- [x]` in ROADMAP.md |

**General:**

| Subcommand           | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `check`              | Run lint, typecheck, test, build (skips missing scripts) |
| `status [--phase N]` | Show per-phase progress table                            |

### `opsx-*` Slash Commands — Workflow Knowledge

The existing `/opsx-ff`, `/opsx-apply`, `/opsx-archive`, etc. commands define
how to interact with openspec artifacts. The `/opsx-loop` command executes
their logic **inline** rather than invoking them as separate commands, so the
agent maintains context across the full phase lifecycle.

## Recovery

The loop is **idempotent and resumable**:

- `next-phase` finds the first phase with any unchecked tasks
- `phase-tasks` returns only remaining unchecked tasks within that phase
- If the openspec change for a phase already exists, it is reused
- Tasks marked `[x]` in the ROADMAP are skipped during implementation
- Existing test files are not overwritten
- Quality checks re-validate everything, catching partial implementations
- `HANDOFF.md` restores context from the last completed phase

## Requirements

- **OpenCode** with an LLM that supports tool use (for running shell commands)
- **openspec** CLI installed and on PATH
- **Node.js** / npm with project scripts: `lint`, `typecheck`, `test`, `build`
- **python3** (used by roadmap-helper.sh for markdown parsing)
- **git** (for atomic commits per phase)
- @ROADMAP tasks in checklist format: `- [ ] 1.1 Task description [deps: ...] [deliverable: ...]`
