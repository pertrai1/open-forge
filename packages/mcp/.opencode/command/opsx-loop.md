---
description: Automatically loop through all ROADMAP phases, completing each phase using a single openspec change
---

Drive the full ROADMAP automation loop — iterate through every phase, creating **one openspec change per phase** that covers all tasks in that phase. The agent specs, tests, implements, and archives each phase as a cohesive unit.

**Input**: Optional arguments after `/opsx-loop`:

- A phase number (e.g., `/opsx-loop 2`) to process only that phase
- A phase range (e.g., `/opsx-loop 3-5`) to process phases 3 through 5
- No argument to process all phases 0–9

**Prerequisites**

Before starting, verify the environment is ready:

```bash
# Confirm helper script exists and is executable
ls -la scripts/roadmap-helper.sh

# Confirm openspec CLI is available
openspec --version

# Show current roadmap progress
bash scripts/roadmap-helper.sh status
```

If any prerequisite fails, inform the user and stop.

---

**Steps**

## 1. Show current progress and confirm

Run:

```bash
bash scripts/roadmap-helper.sh status
```

Display the progress table. Then announce:

> "Starting ROADMAP automation loop for phase(s) X–Y. Each phase gets a single openspec change covering all its tasks. I won't prompt between phases — interrupt me anytime to pause."

## 2. Enter the phase loop

This is the outer loop. Repeat until the helper reports `ROADMAP_COMPLETE`:

---

### 2a. Get the next phase with pending tasks

```bash
bash scripts/roadmap-helper.sh next-phase
```

Or, if a specific starting phase was provided:

```bash
bash scripts/roadmap-helper.sh next-phase --start <N>
```

The output format is: `<phase>|<phase_title>|<pending_count>|<total_count>`

If the output is `ROADMAP_COMPLETE`, go to **step 3**.

If a phase range was given (e.g., `/opsx-loop 3-5`) and the returned phase exceeds the end of the range, go to **step 3**.

Parse the fields. Generate the change name:

```bash
bash scripts/roadmap-helper.sh phase-change-name <phase>
```

This returns a name like `roadmap-phase-2`.

---

### 2b. Get ALL pending tasks for this phase

```bash
bash scripts/roadmap-helper.sh phase-tasks --phase <phase>
```

Output is one line per task: `<task_id>|<description>`

Collect these into a list. You will need them for writing artifacts and implementing.

Also read the phase section in `ROADMAP.md` directly — note the **Goal**, the **Parallel Groups**, and each task's `[deps: ...]` and `[deliverable: ...]` metadata. This context shapes the entire change.

Announce:

```
═══════════════════════════════════════════════════════
  Phase <phase>: <phase_title>
  <pending_count> task(s) to complete
═══════════════════════════════════════════════════════
```

---

### 2c. Create a single openspec change for the phase

```bash
openspec new change "<change_name>" --description "Phase <phase>: <phase_title> — <pending_count> tasks"
```

If the change already exists (e.g., from a previous interrupted run), reuse it — do NOT create a duplicate.

Show: `"✓ Created change: <change_name>"`

---

### 2d. Fast-forward through all artifacts for the phase

Follow the `/opsx-ff` workflow **inline** (do NOT literally invoke `/opsx-ff` — execute its logic directly).

The artifacts (proposal, specs, design, tasks) must cover **all tasks in the phase as a whole**, not just one task.

**i. Get the artifact build order:**

```bash
openspec status --change "<change_name>" --json
```

**ii. Loop through artifacts in dependency order.** For each artifact with `status: "ready"`:

Get instructions:

```bash
openspec instructions <artifact-id> --change "<change_name>" --json
```

Read any completed dependency artifact files for context.

**Write the artifact with real, thoughtful content that covers the ENTIRE phase:**

- **proposal**: Explain the phase goal (from `ROADMAP.md`), list ALL tasks that will be completed, describe what capabilities are affected, and reference REQUIREMENTS.md. This is the plan for the whole phase, not a single task.

- **specs**: Write requirements and scenarios covering ALL tasks in the phase. Group by capability. Each task's deliverable should map to at least one requirement. Write concrete WHEN/THEN scenarios that are testable. Reference `[deliverable: ...]` tags from the ROADMAP to know what files/modules are expected.

- **design**: Document the technical approach for the entire phase — file structure, module responsibilities, key decisions, how the deliverables relate to each other. Reference existing code patterns in `src/`. Acknowledge the dependency order and parallel groups from the ROADMAP.

- **tasks**: Create a checklist that mirrors the ROADMAP tasks for this phase, but broken into implementation-level subtasks. Each ROADMAP task (e.g., 2.1, 2.2) should have one or more subtasks. Group them logically.

Write to the `outputPath` from instructions. Show: `"✓ Created <artifact-id>"`

**iii. After each artifact, re-check status:**

```bash
openspec status --change "<change_name>" --json
```

Continue until all `applyRequires` artifacts have `status: "done"`.

---

### 2e. Create unit tests for the phase

Read the specs you just created at `openspec/changes/<change_name>/specs/*/spec.md`.

For each scenario found (lines matching `#### Scenario: ...`):

- Create **real test files** under `tests/` in the appropriate subdirectory
- Import from the deliverable paths listed in the ROADMAP tasks (`[deliverable: ...]` tags)
- Write actual test assertions that validate the scenario — not `expect(true).toBe(true)` placeholders
- Use `vitest` (`describe`, `it`, `expect`) as the test framework
- Group tests by capability / deliverable module

If deliverable modules don't exist yet, that's fine — tests will fail until implementation. That's the point: **test-first**.

Show: `"✓ Created N test(s) across M file(s) for phase <phase>"`

---

### 2f. Implement all tasks in the phase (inner task loop)

Follow the `/opsx-apply` workflow **inline** (do NOT literally invoke `/opsx-apply`).

**i. Get apply instructions:**

```bash
openspec instructions apply --change "<change_name>" --json
```

**ii. Read all context files** listed in `contextFiles` from the output.

**iii. Iterate through ROADMAP tasks in order.** For each pending task (from the list gathered in step 2b):

Announce: `"── Task <task_id>: <description> ──"`

- Read existing source code for patterns before writing new code
- Implement the code changes for this task
- Keep changes focused on the task's deliverable
- Follow existing project patterns (naming, structure, exports)
- After implementing the task, mark corresponding subtasks complete in the openspec tasks file: `- [ ]` → `- [x]`

Show: `"✓ Task <task_id> implemented"`

**iv. After implementing the task, mark it done in the ROADMAP:**

```bash
bash scripts/roadmap-helper.sh mark-done <task_id>
```

Verify the output is `updated`. If `missing`, warn but continue.

**v. After ALL tasks in the phase are implemented, run quality checks:**

```bash
bash scripts/roadmap-helper.sh check
```

**vi. If quality checks fail:**

- Read the error output carefully
- Fix the issues (lint errors, type errors, failing tests, build errors)
- Re-run `bash scripts/roadmap-helper.sh check`
- Repeat up to 3 fix-and-recheck cycles
- If still failing after 3 cycles:
  1. **STOP and document in `PIPELINE-ISSUES.md`** — fill out the Active Issues template with exact errors, context, and what you tried
  2. Report the remaining errors to the user
  3. **Continue to the next step anyway** — don't get stuck

**vii. If quality checks pass:** Show `"✓ Quality checks passed for phase <phase>"`

---

### 2g. Update documentation for the phase

```bash
bash scripts/roadmap-helper.sh phase-update-docs <phase> <completed_count> <phase_title>
```

This updates CHANGELOG.md with a phase-level entry and ensures README.md references the ROADMAP.

---

### 2h. Commit all changes for the phase

```bash
bash scripts/roadmap-helper.sh phase-commit <phase> <phase_title>
```

This creates a single atomic commit for the entire phase.

---

### 2i. Sync specs and archive the change

**i. Check for delta specs** at `openspec/changes/<change_name>/specs/`. If they exist, sync them to main specs by reading each delta spec and applying changes (adds/modifications/removals) to the corresponding main spec at `openspec/specs/<capability>/spec.md`.

**ii. Archive:**

```bash
openspec archive "<change_name>" -y
```

If archive fails, warn but continue — don't let archive issues block the loop.

Show: `"✓ Archived <change_name>"`

---

### 2j. Document phase execution

Fill out the phase section in `PIPELINE-LOG.md`:
- Timestamps (started/completed)
- Duration
- Check off completed tasks
- What went well (successful patterns, smooth execution)
- Challenges encountered (friction points, confusion, failures)
- Fix attempts count (how many times quality checks were re-run)

This data is critical for improving the autonomous pipeline.

---

### 2k. Show phase summary and loop back

```bash
bash scripts/roadmap-helper.sh status
```

Show a brief summary:

```
✓ Phase <phase> complete — <completed_count> task(s) done
  Overall: N/M total tasks (X%)
```

**Go back to step 2a** to process the next phase.

---

## 3. Loop complete

When `next-phase` returns `ROADMAP_COMPLETE` (or all phases in the filtered range are done):

```bash
bash scripts/roadmap-helper.sh status
```

Display the final progress table and announce:

```
═══════════════════════════════════════════════════════
  ROADMAP Loop Complete
═══════════════════════════════════════════════════════

Phases processed: X–Y
Tasks completed this session: N
Overall progress: M/T tasks (Z%)

All pending phases have been processed.
```

---

## 4. Final documentation

Fill out the **Summary Metrics** and **Pipeline Insights** sections in `PIPELINE-LOG.md`:

**Metrics to capture**:
- Total duration (start to end)
- Phases completed (X/10)
- Tasks completed (X/54)
- Total fix attempts across all phases
- Issues logged in PIPELINE-ISSUES.md
- Human interventions required

**Insights to document**:

1. **What Worked Well** (3-5 bullet points)
   - Patterns that succeeded
   - Approaches that were efficient
   - Surprising successes

2. **What Needs Improvement** (3-5 bullet points)
   - Friction points
   - Ambiguities in requirements
   - Tool failures or gaps
   - Missing context

3. **Suggestions for Next Project** (3-5 actionable items)
   - Concrete improvements to ROADMAP structure
   - AGENTS.md enhancements
   - Tool/script improvements
   - Workflow changes

This documentation is the primary research output — it captures what worked and what didn't for future pipeline improvements.

---

## Guardrails

- **Use `PIPELINE-ISSUES.md` for blockers.** When you encounter issues that block progress for more than 5 minutes or after 3 fix attempts, STOP and fill out the Active Issues template in that file. Be specific about what you need from humans.

- **One change per phase.** Do NOT create separate openspec changes for individual tasks. The proposal, specs, design, and tasks artifacts must describe the phase holistically.

- **Do NOT prompt the user between tasks or phases.** The whole point is autonomous execution. Only pause if:
  - A phase goal is critically ambiguous and you genuinely cannot determine what to implement
  - The same quality check failure persists after 3 fix attempts across 2 consecutive phases (suggests a systemic issue)
  - A fundamental tool is broken (openspec CLI errors, git errors, missing node_modules)
  
  When blocked, **document in `PIPELINE-ISSUES.md`** with exact error, context, attempted solutions, and specific need from human.

- **Do NOT use placeholder content.** Every artifact, test, and implementation must contain real, functional code. Read existing source files to understand project patterns before writing new code.

- **Do NOT skip the test-creation step.** Tests must exist before implementation begins (step 2e before 2f). Tests can initially fail — that's expected and correct (test-first).

- **Keep momentum.** If a minor issue arises (archive fails, a non-critical quality check warns), log it and move on. Don't block the entire loop on edge cases.

- **Respect existing work.** If a change already exists from a previous interrupted run, reuse it. If tests already exist, don't overwrite them. If code already exists for a task, verify it passes checks and mark it done.

- **Reference REQUIREMENTS.md and ROADMAP.md** when writing specs and proposals. These are the source of truth for what the project should do. Pay attention to the phase **Goal** and **Parallel Groups**.

- **Read existing source code** before implementing. Check `src/` for patterns, naming conventions, module structure. New code should be consistent with what's already there.

- **Mark tasks individually.** Even though the change is per-phase, mark each ROADMAP task `[x]` as soon as its implementation is done (step 2f.iv), not all at the end. This enables clean recovery from interruption.

## Recovery From Interruption

If `/opsx-loop` is interrupted mid-phase and restarted:

- `next-phase` finds the first phase with any unchecked tasks — it will return the interrupted phase
- `phase-tasks` returns only the remaining unchecked tasks in that phase
- If the openspec change for that phase already exists, it is reused (step 2c handles this)
- Already-completed tasks are `[x]` in the ROADMAP — they won't be re-implemented
- Existing test files are not overwritten
- Quality checks re-validate everything, catching partial implementations

## Output Style

Keep output concise. Use this pattern per phase:

```
═══════════════════════════════════════════════════════
  Phase 2: AI Vocabulary Detection
  5 task(s) to complete
═══════════════════════════════════════════════════════
  ✓ Created change: roadmap-phase-2
  ✓ Created proposal (5 tasks, 3 capabilities)
  ✓ Created specs/vocabulary/spec.md (8 scenarios)
  ✓ Created design
  ✓ Created tasks (12 subtasks)
  ✓ Created 8 tests across 3 files for phase 2
── Task 2.1: Create AI vocabulary word list ──
  ✓ Task 2.1 implemented
── Task 2.2: Implement vocabulary scanner ──
  ✓ Task 2.2 implemented
── Task 2.3: Implement phrase detector (multi-word) ──
  ✓ Task 2.3 implemented
── Task 2.4: Create vocabulary scoring system ──
  ✓ Task 2.4 implemented
── Task 2.5: Write tests for vocabulary detection ──
  ✓ Task 2.5 implemented
  ✓ Quality checks passed for phase 2
  ✓ Committed: complete roadmap phase 2
  ✓ Archived roadmap-phase-2
✓ Phase 2 complete — 5 task(s) done
  Overall: 16/79 total tasks (20%)
```
