---
description: Autonomously execute ROADMAP phases — auto-detects next work from the unified ROADMAP
---

Drive the ROADMAP automation loop for the open-forge monorepo. Auto-detects which package and phase to work on next based on the unified ROADMAP wave sequencing. Creates one openspec change per phase covering all tasks as a cohesive unit.

**Input**: `$ARGUMENTS` — all optional:

- _(no args)_ — auto-detect next work from root ROADMAP.md
- `--package telemetry` — target a specific package (auto-detect phase)
- `--package telemetry --phase 2` — fully explicit
- `single-phase` — process exactly one phase and exit

Examples:

- `/forge-loop` — auto-detect, run all pending phases in wave order
- `/forge-loop single-phase` — auto-detect, run one phase and stop
- `/forge-loop --package telemetry` — all pending telemetry phases
- `/forge-loop --package telemetry --phase 1` — only telemetry phase 1

---

## 0. Determine what to work on

If `--package` was NOT provided, auto-detect from the root ROADMAP:

```bash
bash scripts/forge-helper.sh next-work
```

Output: `<package>|<phase>|<phase_title>|<wave>|<wave_title>`

If `ALL_COMPLETE`, announce completion and stop.

Parse the output to set `<pkg>` and the starting phase. Announce:

```
Auto-detected: Wave <wave> (<wave_title>) → <pkg> Phase <phase>: <phase_title>
```

If `--package` was provided but not `--phase`, use `next-phase` to find it:

```bash
bash scripts/forge-helper.sh next-phase --package <pkg>
```

---

## 1. Set up environment

Ensure we are on a feature branch (creates one if on main/master):

```bash
bash scripts/forge-helper.sh ensure-branch --package <pkg> --phase <phase>
```

Verify tools:

```bash
ls -la scripts/forge-helper.sh
openspec --version
```

Restore session context:

```bash
cat HANDOFF.md 2>/dev/null || bash scripts/forge-helper.sh init-handoff
```

If `HANDOFF.md` exists, read it fully. Decisions there are final — do not re-litigate.

Also read `AGENTS.md` for mandatory workflow (TYPES → RED → GREEN → REFACTOR → GATES → COMMIT) and forbidden patterns.

Show progress:

```bash
bash scripts/forge-helper.sh status --package <pkg>
```

---

## 2. Phase loop

Repeat until `ROADMAP_COMPLETE`:

### 2a. Get next phase

```bash
bash scripts/forge-helper.sh next-phase --package <pkg>
```

Output: `<phase>|<title>|<pending>|<total>`. If `ROADMAP_COMPLETE`, go to step 3.

Generate change name:

```bash
bash scripts/forge-helper.sh phase-change-name <phase> --package <pkg>
```

### 2b. Get all pending tasks

```bash
bash scripts/forge-helper.sh phase-tasks --phase <N> --package <pkg>
```

Also read the phase section in `packages/<pkg>/ROADMAP.md` for Goal, Parallel Groups, deps, and deliverables.

Announce:

```
═══════════════════════════════════════════════════════
  [<pkg>] Phase <N>: <title>
  <pending> task(s) to complete
═══════════════════════════════════════════════════════
```

### 2c. Create openspec change

```bash
openspec new change "<change_name>" --description "<pkg> Phase <N>: <title>"
```

If already exists, reuse it.

### 2d. Fast-forward artifacts

Get the artifact build order and write each artifact inline (do NOT invoke `/opsx-ff`):

```bash
openspec status --change "<change_name>" --json
openspec instructions <artifact-id> --change "<change_name>" --json
```

Write real content covering the ENTIRE phase:

- **proposal**: Phase goal, all tasks, capabilities affected, reference requirements
- **specs**: Requirements and WHEN/THEN scenarios covering all tasks
- **design**: Technical approach, file structure, how deliverables relate
- **tasks**: Implementation-level subtasks mirroring ROADMAP tasks

### 2e. Write tests (test-first)

Read specs at `openspec/changes/<change_name>/specs/*/spec.md`. For each scenario:

- Write real vitest tests under `packages/<pkg>/tests/`
- Import from deliverable paths in ROADMAP `[deliverable: ...]` tags
- Real assertions, not placeholders
- Tests may fail until implementation — that is correct

### 2f. Implement tasks

Clear any prior drift sentinel:

```bash
bash scripts/forge-helper.sh clear-drift-sentinel <phase> --package <pkg>
```

For each pending task in dependency order:

1. Read existing source for patterns
2. Define types first (AGENTS.md: TYPES phase)
3. Implement minimum code to pass tests (GREEN phase)
4. Mark done:
   ```bash
   bash scripts/forge-helper.sh mark-done <task_id> --package <pkg>
   ```

After ALL tasks implemented, run quality checks:

```bash
bash scripts/forge-helper.sh check --package <pkg>
```

If checks fail: fix, re-run, up to 3 cycles. If still failing:

```bash
bash scripts/forge-helper.sh write-drift-sentinel <phase> --package <pkg> "quality checks failed after 3 fix cycles"
```

Document in `PIPELINE-ISSUES.md` and continue to next step.

### 2g. Commit

```bash
bash scripts/forge-helper.sh phase-commit <phase> --package <pkg> "<title>"
```

### 2h. Archive

```bash
openspec archive "<change_name>" -y
```

Warn but continue if archive fails.

### 2i. Update handoff

```bash
bash scripts/forge-helper.sh update-handoff <phase> "<title>" --package <pkg> <done> <total>
```

Append new key decisions to `HANDOFF.md`:

```markdown
### N. Decision Title

- **Decision**: What was decided
- **Rationale**: Why
- **Impact**: How it affects future phases
```

### 2j. Show summary and loop

```bash
bash scripts/forge-helper.sh status --package <pkg>
```

```
✓ [<pkg>] Phase <N> complete — <done> task(s)
  Overall: X/Y tasks (Z%)
```

If `single-phase`: stop. Otherwise loop to 2a.

---

## 3. Loop complete

```bash
bash scripts/forge-helper.sh status --package <pkg>
```

```
═══════════════════════════════════════════════════════
  Forge Loop Complete — <pkg>
═══════════════════════════════════════════════════════
Phases processed: X-Y
Tasks completed: N
Overall: M/T tasks (Z%)
```

Update `HANDOFF.md` Next Phase Context for future work.

---

## Guardrails

- **Read HANDOFF.md at session start.** Decisions are final.
- **Write HANDOFF.md at phase end.** Every phase.
- **Follow AGENTS.md workflow.** TYPES → RED → GREEN → REFACTOR → GATES → COMMIT.
- **One change per phase.** Artifacts describe the phase holistically.
- **Do NOT prompt between phases.** Autonomous execution. Only pause for critical ambiguity, systemic failures, or broken tools.
- **Do NOT use placeholders.** Real code, real tests, real artifacts.
- **Do NOT skip tests.** Test-first always.
- **Mark tasks individually.** Mark `[x]` as each is done, not all at end.
- **Use PIPELINE-ISSUES.md for blockers.** After 3 fix attempts, stop and document.
- **Write drift sentinel on unresolvable failures.** Then document and continue.
- **Read existing source code** before implementing. Match patterns.

## Recovery

The loop is idempotent and resumable:

- `next-work` / `next-phase` finds the next pending work
- `phase-tasks` returns only remaining tasks
- Existing openspec changes are reused
- Tasks marked `[x]` are skipped
- Existing tests are not overwritten
- Quality checks re-validate everything
- `HANDOFF.md` restores context
