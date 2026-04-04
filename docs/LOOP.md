# Forge Loop — Autonomous ROADMAP Execution

The ROADMAP is completed by an **LLM agent**, not by a standalone script. The agent drives each **phase** end-to-end — writing types, tests, and implementations — using the `forge-helper.sh` bookkeeping utility and the `openspec` CLI for artifact management.

**One openspec change per phase.** All tasks within a phase are grouped under a single change, so the proposal, specs, design, and tasks artifacts describe the phase as a cohesive unit.

**One session per phase.** Each phase runs in a session that reads `HANDOFF.md` to restore context from the previous session. This prevents context exhaustion on long ROADMAPs.

## How to Run

```bash
# Check current status
bash scripts/forge-helper.sh status --package telemetry

# See what's next
bash scripts/forge-helper.sh next-phase --package telemetry

# Show handoff state
bash scripts/forge-helper.sh show-handoff
```

The agent works autonomously through pending phases. Interrupt at any time; restarting picks up from the first phase with unchecked tasks, reading `HANDOFF.md` to restore context.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  LLM Agent  (Session N)                                   │
│                                                           │
│  1. Read HANDOFF.md (restore context)                     │
│  2. forge-helper.sh next-phase --package <pkg>            │
│  3. forge-helper.sh phase-tasks --phase N --package <pkg> │
│  4. openspec new change "<pkg>-phase-N"                   │
│  5. Write artifacts (proposal → specs → design → tasks)   │
│  6. Write tests (test-first, before implementation)       │
│  7. Implement tasks, mark each done                       │
│  8. forge-helper.sh check --package <pkg>                 │
│  9. forge-helper.sh phase-commit <N> --package <pkg>      │
│ 10. openspec archive "<pkg>-phase-N" -y                   │
│ 11. Update HANDOFF.md                                     │
│                                                           │
│  Loop to next phase                                       │
└──────────────────────────────────────────────────────────┘
                        │
                        │ (context exhausted or user interrupt)
                        ▼
┌──────────────────────────────────────────────────────────┐
│  LLM Agent  (Session N+1)                                 │
│                                                           │
│  Read HANDOFF.md → continues from next pending phase      │
└──────────────────────────────────────────────────────────┘
```

## Monorepo Awareness

The forge loop operates on **per-package ROADMAPs** coordinated by the **root ROADMAP.md**:

- Root `ROADMAP.md` defines **waves** (cross-package sequencing)
- Package `ROADMAP.md` files define **phases** (detailed task breakdowns)
- The `--package <name>` flag targets a specific package

### Sequencing

Follow the root ROADMAP's wave order. Within each wave, follow the per-package ROADMAP's phase order:

```
Root ROADMAP.md → "Wave 1: telemetry phases 1-4"
                    │
                    └─→ packages/telemetry/ROADMAP.md → Phase 1 tasks
```

## Per-Phase Workflow

For each phase in a package ROADMAP that has unchecked tasks:

### 0. Restore context

```bash
cat HANDOFF.md
bash scripts/forge-helper.sh status --package <pkg>
```

### 1. Get next phase and tasks

```bash
bash scripts/forge-helper.sh next-phase --package <pkg>
bash scripts/forge-helper.sh phase-tasks --phase N --package <pkg>
```

### 2. Create openspec change

```bash
CHANGE=$(bash scripts/forge-helper.sh phase-change-name N --package <pkg>)
openspec new change "$CHANGE" --description "Phase N: <title>"
```

If the change already exists from a previous interrupted run, reuse it.

### 3. Write artifacts

Follow the openspec workflow to create proposal → specs → design → tasks covering **all tasks in the phase holistically**.

### 4. Write tests (test-first)

Read the specs. Write real test files under `packages/<pkg>/tests/`. Tests must use vitest, import from deliverable paths, and contain actual assertions — not placeholders.

### 5. Implement tasks

For each pending task in dependency order:

```bash
# Implement the task...

# Mark done
bash scripts/forge-helper.sh mark-done <task-id> --package <pkg>
```

Follow AGENTS.md: TYPES → RED → GREEN → REFACTOR → GATES → COMMIT.

### 6. Quality checks

```bash
bash scripts/forge-helper.sh check --package <pkg>
```

If checks fail:

1. Read errors, fix issues
2. Re-run check
3. Repeat up to 3 times
4. If still failing after 3 cycles:
   ```bash
   bash scripts/forge-helper.sh write-drift-sentinel N --package <pkg> "reason"
   ```
   Document in `PIPELINE-ISSUES.md` and stop.

### 7. Commit

```bash
bash scripts/forge-helper.sh phase-commit N --package <pkg> "<title>"
```

### 8. Archive

```bash
openspec archive "$CHANGE" -y
```

### 9. Update handoff

```bash
bash scripts/forge-helper.sh update-handoff N "<title>" --package <pkg> <done> <total>
```

Append any new key decisions to `HANDOFF.md`.

## Session Handoff

`HANDOFF.md` is the persistent context bridge between sessions.

### What Gets Persisted

| Section                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| **Current State**      | Active wave, package, phase                    |
| **Completed Work**     | Table of completed phases across all packages  |
| **Key Decisions**      | ADR-style entries — do not re-litigate         |
| **Project Patterns**   | Import conventions, error handling, test style |
| **Known Gotchas**      | Issues found and solved                        |
| **Lessons Learned**    | What worked/didn't                             |
| **Next Phase Context** | Goal and critical context for next phase       |

### Commands

```bash
bash scripts/forge-helper.sh init-handoff           # Create HANDOFF.md
bash scripts/forge-helper.sh update-handoff ...      # Update after phase
bash scripts/forge-helper.sh show-handoff            # Quick summary
```

## Guardrails

- **Read HANDOFF.md at session start.** Decisions recorded there are final.
- **Write HANDOFF.md at phase end.** Skipping this defeats session continuity.
- **Use PIPELINE-ISSUES.md for blockers.** After 3 fix attempts, stop and document.
- **Write drift sentinel on unresolvable failures.** Prevents infinite retry loops.
- **One change per phase.** Artifacts describe the phase holistically.
- **Do NOT prompt between phases.** Only pause for critical ambiguity or systemic failures.
- **Do NOT use placeholder content.** Every artifact, test, and implementation must be real.
- **Do NOT skip tests.** Tests before implementation — always.
- **Mark tasks individually.** Mark each `[x]` as soon as done, not all at the end.
- **Follow AGENTS.md.** TYPES → RED → GREEN → REFACTOR → GATES → COMMIT.

## Recovery

The loop is **idempotent and resumable**:

- `next-phase` finds the first phase with unchecked tasks
- `phase-tasks` returns only remaining unchecked tasks
- If the openspec change already exists, it is reused
- Tasks marked `[x]` are skipped during implementation
- Existing test files are not overwritten
- Quality checks re-validate everything
- `HANDOFF.md` restores context from the last completed phase
