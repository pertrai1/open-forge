#!/usr/bin/env bash

set -euo pipefail

# ---------------------------------------------------------------------------
# roadmap-helper.sh
#
# Thin utility for LLM agents to query and update ROADMAP.md state.
# Designed to be called from within an agent-driven loop (opsx-loop).
#
# The loop operates at **phase** granularity — one openspec change per phase,
# with all tasks in that phase handled under a single change lifecycle.
#
# Subcommands (phase-level):
#   next-phase         Print the next phase that has pending tasks
#   phase-tasks        Print ALL pending tasks for a given phase
#   phase-change-name  Generate a consistent openspec change name for a phase
#   phase-commit       Stage and commit all changes for a completed phase
#   phase-update-docs  Update CHANGELOG.md and README.md for a completed phase
#
# Subcommands (task-level, used within a phase):
#   next-task          Print the next pending task (optionally for a specific phase)
#   mark-done          Mark a single task as complete in the ROADMAP
#
# Subcommands (general):
#   check              Run quality checks (lint, typecheck, test, build)
#   commit             Stage all changes and create an atomic commit
#   update-docs        Update CHANGELOG.md and README.md for a completed task
#   status             Show per-phase and overall progress summary
#   change-name        Generate an openspec change name for a single task (legacy)
#
# Subcommands (session handoff):
#   init-handoff       Create HANDOFF.md if it doesn't exist
#   update-handoff     Update HANDOFF.md after phase completion
#   show-handoff       Display current handoff summary
#
# Subcommands (drift detection):
#   write-drift-sentinel <phase> <reason>  Signal that agent is stuck on a phase
#   clear-drift-sentinel <phase>           Clear the sentinel when a phase advances
#   check-drift-sentinel <phase>           Check if a sentinel exists; exits 0=stuck, 1=clear
# ---------------------------------------------------------------------------

readonly ROADMAP_FILE="${ROADMAP_FILE:-ROADMAP.md}"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

log()  { printf '[roadmap-helper] %s\n' "$*"; }
warn() { printf '[roadmap-helper] WARN: %s\n' "$*" >&2; }
fail() { printf '[roadmap-helper] ERROR: %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Subcommand: next-phase [--start N]
#
# Finds the first phase (scanning from --start, default 0, up to 9) that
# has at least one unchecked task.
#
# Output (pipe-delimited):
#   <phase>|<phase_title>|<pending_count>|<total_count>
#
# If no phases have pending tasks, prints: ROADMAP_COMPLETE
# ---------------------------------------------------------------------------

cmd_next_phase() {
  local start_phase=0

  while (( $# > 0 )); do
    case "$1" in
      --start)
        [[ $# -ge 2 ]] || fail "Missing value for --start"
        start_phase="$2"
        shift 2
        ;;
      *) fail "Unknown option for next-phase: $1" ;;
    esac
  done

  [[ -f "$ROADMAP_FILE" ]] || fail "Roadmap file not found: $ROADMAP_FILE"

  ROADMAP="$ROADMAP_FILE" START="$start_phase" python3 <<'PY'
import re, os, sys

roadmap_path = os.environ["ROADMAP"]
start = int(os.environ.get("START", "0"))

with open(roadmap_path, "r", encoding="utf-8") as f:
    text = f.read()
    lines = text.splitlines()

for phase in range(start, 10):
    # Count pending and total tasks for this phase
    pending = len(re.findall(
        rf'^\s*-\s*\[ \]\s*{phase}\.\d+',
        text, re.MULTILINE
    ))
    total = len(re.findall(
        rf'^\s*-\s*\[[ xX]\]\s*{phase}\.\d+',
        text, re.MULTILINE
    ))

    if pending == 0:
        continue

    # Extract the phase title from the header line
    title = f"Phase {phase}"
    header_re = re.compile(rf'^##\s+Phase\s+{phase}\b[:\s]*(.*)')
    for line in lines:
        m = header_re.match(line)
        if m:
            title = m.group(0).lstrip('#').strip()
            break

    print(f"{phase}|{title}|{pending}|{total}")
    sys.exit(0)

print("ROADMAP_COMPLETE")
PY
}

# ---------------------------------------------------------------------------
# Subcommand: phase-tasks --phase N
#
# Prints ALL pending (unchecked) tasks for the given phase.
# Output: one line per task, pipe-delimited:
#   <task_id>|<description>
#
# If no pending tasks remain for the phase, prints: PHASE_COMPLETE
# ---------------------------------------------------------------------------

cmd_phase_tasks() {
  local phase=""

  while (( $# > 0 )); do
    case "$1" in
      --phase)
        [[ $# -ge 2 ]] || fail "Missing value for --phase"
        phase="$2"
        shift 2
        ;;
      *) fail "Unknown option for phase-tasks: $1" ;;
    esac
  done

  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh phase-tasks --phase <N>"
  [[ -f "$ROADMAP_FILE" ]] || fail "Roadmap file not found: $ROADMAP_FILE"

  ROADMAP="$ROADMAP_FILE" PHASE="$phase" python3 <<'PY'
import re, os, sys

roadmap_path = os.environ["ROADMAP"]
phase = int(os.environ["PHASE"])

with open(roadmap_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

phase_header = re.compile(rf'^##\s+Phase\s+{phase}\b')
next_header  = re.compile(r'^##\s+Phase\s+\d+\b')
task_re      = re.compile(
    r'^\s*-\s*\[(?P<st>[ xX])\]\s*(?P<id>'
    + str(phase)
    + r'\.\d+)\s*(?P<desc>.*)$'
)

found_any = False
in_phase = False

for raw in lines:
    line = raw.rstrip('\n')

    if phase_header.match(line):
        in_phase = True
        continue

    if in_phase and next_header.match(line) and not phase_header.match(line):
        break

    if not in_phase:
        continue

    m = task_re.match(line)
    if not m:
        continue

    # Skip already-completed tasks
    if m.group('st').lower() == 'x':
        continue

    found_any = True
    task_id = m.group('id')
    desc = m.group('desc').strip()
    print(f"{task_id}|{desc}")

if not found_any:
    print("PHASE_COMPLETE")
PY
}

# ---------------------------------------------------------------------------
# Subcommand: phase-change-name <phase>
#
# Generates a consistent kebab-case openspec change name for a phase.
# Example: phase 2 → "roadmap-phase-2"
# ---------------------------------------------------------------------------

cmd_phase_change_name() {
  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh phase-change-name <phase>"
  echo "roadmap-phase-${phase}"
}

# ---------------------------------------------------------------------------
# Subcommand: phase-commit <phase> [description...]
#
# Stages all changes (including untracked) and creates a commit scoped to an
# entire phase.  If there are no changes, prints a message and exits 0.
# ---------------------------------------------------------------------------

cmd_phase_commit() {
  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh phase-commit <phase> [description...]"
  shift
  local desc="$*"
  [[ -n "$desc" ]] || desc="complete all tasks"

  if git diff --quiet 2>/dev/null \
     && git diff --cached --quiet 2>/dev/null \
     && [[ -z "$(git ls-files --others --exclude-standard 2>/dev/null)" ]]; then
    log "No changes to commit for phase ${phase}"
    return 0
  fi

  git add -A
  git commit -m "complete roadmap phase ${phase}: ${desc}"
  log "Committed phase ${phase}: ${desc}"
}

# ---------------------------------------------------------------------------
# Subcommand: phase-update-docs <phase> <completed_count> [description...]
#
# Appends a phase-level entry to CHANGELOG.md and ensures README.md
# references the ROADMAP.
# ---------------------------------------------------------------------------

cmd_phase_update_docs() {
  local phase="${1:-}"
  local completed="${2:-}"
  shift 2 2>/dev/null || true
  local desc="$*"

  [[ -n "$phase" && -n "$completed" ]] || \
    fail "Usage: roadmap-helper.sh phase-update-docs <phase> <completed_count> [description...]"

  local changelog="CHANGELOG.md"
  if [[ ! -f "$changelog" ]]; then
    printf '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n' > "$changelog"
    log "Created ${changelog}"
  fi

  local date_stamp
  date_stamp="$(date +%Y-%m-%d)"

  CLOG="$changelog" DATE="$date_stamp" PHASE="$phase" COUNT="$completed" DESC="$desc" \
    python3 <<'PY'
import os

clog  = os.environ["CLOG"]
date  = os.environ["DATE"]
phase = os.environ["PHASE"]
count = os.environ["COUNT"]
desc  = os.environ.get("DESC", "").strip()

with open(clog, "r", encoding="utf-8") as f:
    content = f.read()

title = f"Phase {phase}"
if desc:
    title += f": {desc}"

entry = f"\n## [{date}] {title}\n\n- Completed {count} task(s) in phase {phase}\n"

# Insert after the first blank line following the title
parts = content.split("\n\n", 1)
if len(parts) == 2:
    new_content = parts[0] + "\n" + entry + "\n" + parts[1]
else:
    new_content = content + entry

with open(clog, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"[roadmap-helper] Updated {clog} with phase {phase}")
PY

  # Ensure README.md references the ROADMAP for progress tracking
  if [[ -f "README.md" ]]; then
    if ! grep -q 'ROADMAP.md' README.md 2>/dev/null; then
      printf '\n## Progress\n\nSee [ROADMAP.md](ROADMAP.md) for implementation status.\n' >> README.md
      log "Added ROADMAP reference to README.md"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Subcommand: next-task [--phase N]
#
# Prints the next unchecked task.  Output format (pipe-delimited):
#   <phase>|<task_id>|<description>
#
# If --phase is given, restricts to that phase.  Otherwise scans 0-9.
# Exits 0 with output if a task is found, exits 0 with "ROADMAP_COMPLETE"
# if no pending tasks remain.
# ---------------------------------------------------------------------------

cmd_next_task() {
  local phase_filter=""

  while (( $# > 0 )); do
    case "$1" in
      --phase)
        [[ $# -ge 2 ]] || fail "Missing value for --phase"
        phase_filter="$2"
        shift 2
        ;;
      *) fail "Unknown option for next-task: $1" ;;
    esac
  done

  [[ -f "$ROADMAP_FILE" ]] || fail "Roadmap file not found: $ROADMAP_FILE"

  ROADMAP="$ROADMAP_FILE" PHASE_FILTER="$phase_filter" python3 <<'PY'
import re, os, sys

roadmap_path = os.environ["ROADMAP"]
phase_filter = os.environ.get("PHASE_FILTER", "").strip()

with open(roadmap_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

phases_to_scan = range(0, 10)
if phase_filter:
    try:
        p = int(phase_filter)
        phases_to_scan = [p]
    except ValueError:
        print(f"Invalid phase: {phase_filter}", file=sys.stderr)
        sys.exit(1)

for phase in phases_to_scan:
    phase_header = re.compile(rf'^##\s+Phase\s+{phase}\b')
    next_header  = re.compile(r'^##\s+Phase\s+\d+\b')
    task_re      = re.compile(
        r'^\s*-\s*\[(?P<st>[ xX])\]\s*(?P<id>'
        + str(phase)
        + r'\.\d+)\s*(?P<desc>.*)$'
    )

    in_phase = False
    for raw in lines:
        line = raw.rstrip('\n')
        if phase_header.match(line):
            in_phase = True
            continue
        if in_phase and next_header.match(line) and not phase_header.match(line):
            break
        if not in_phase:
            continue
        m = task_re.match(line)
        if not m:
            continue
        if m.group('st').lower() == 'x':
            continue
        # Found a pending task
        print(f"{phase}|{m.group('id')}|{m.group('desc').strip()}")
        sys.exit(0)

print("ROADMAP_COMPLETE")
PY
}

# ---------------------------------------------------------------------------
# Subcommand: mark-done <task-id>
#
# Toggles a checklist item from [ ] to [x] in the ROADMAP.
# Prints: updated | already_done | missing
# ---------------------------------------------------------------------------

cmd_mark_done() {
  local task_id="${1:-}"
  [[ -n "$task_id" ]] || fail "Usage: roadmap-helper.sh mark-done <task-id>"
  [[ -f "$ROADMAP_FILE" ]] || fail "Roadmap file not found: $ROADMAP_FILE"

  ROADMAP="$ROADMAP_FILE" TASK_ID="$task_id" python3 <<'PY'
import re, os, sys

roadmap_path = os.environ["ROADMAP"]
task_id      = os.environ["TASK_ID"]

with open(roadmap_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

pattern = re.compile(
    r'^(\s*-\s*\[)(?P<status>[ xX])(\]\s*'
    + re.escape(task_id)
    + r'(?:\b|\.|\s).*)'
    + r'$'
)

updated = False
for idx, raw in enumerate(lines):
    line = raw.rstrip('\n')
    m = pattern.match(line)
    if not m:
        continue
    if m.group('status').lower() == 'x':
        print('already_done')
        sys.exit(0)
    lines[idx] = f"{m.group(1)}x{m.group(3)}\n"
    updated = True
    break

if not updated:
    print('missing')
    sys.exit(2)

with open(roadmap_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print('updated')
PY
}

# ---------------------------------------------------------------------------
# Subcommand: check
#
# Runs quality checks: lint, typecheck, test, build.
# Skips any npm script not defined in package.json.
# Exits 0 if all pass, 1 if any fail.
# ---------------------------------------------------------------------------

cmd_check() {
  [[ -f "package.json" ]] || { log "No package.json found; skipping quality checks"; return 0; }

  log "Running quality checks"
  local any_failed=0

  for script_name in lint typecheck test build; do
    if ! node -e "
      const p = require('./package.json');
      if (!p.scripts || !p.scripts['${script_name}']) process.exit(1);
    " 2>/dev/null; then
      log "  ⊘ npm run ${script_name} — not defined, skipping"
      continue
    fi

    if npm run "$script_name" --silent 2>&1; then
      log "  ✓ ${script_name} passed"
    else
      warn "  ✗ ${script_name} failed"
      any_failed=1
    fi
  done

  return $any_failed
}

# ---------------------------------------------------------------------------
# Subcommand: commit <task-id> <description...>
#
# Stages all changes (including untracked) and creates an atomic commit.
# If there are no changes, prints a message and exits 0.
# ---------------------------------------------------------------------------

cmd_commit() {
  local task_id="${1:-}"
  [[ -n "$task_id" ]] || fail "Usage: roadmap-helper.sh commit <task-id> <description...>"
  shift
  local desc="$*"
  [[ -n "$desc" ]] || desc="complete task ${task_id}"

  if git diff --quiet 2>/dev/null \
     && git diff --cached --quiet 2>/dev/null \
     && [[ -z "$(git ls-files --others --exclude-standard 2>/dev/null)" ]]; then
    log "No changes to commit for ${task_id}"
    return 0
  fi

  git add -A
  git commit -m "complete roadmap task ${task_id}: ${desc}"
  log "Committed: ${task_id} — ${desc}"
}

# ---------------------------------------------------------------------------
# Subcommand: update-docs <task-id> <phase> <description...>
#
# Appends an entry to CHANGELOG.md (creates it if missing) and ensures
# README.md references the ROADMAP for progress tracking.
# ---------------------------------------------------------------------------

cmd_update_docs() {
  local task_id="${1:-}"
  local phase="${2:-}"
  shift 2 2>/dev/null || true
  local desc="$*"

  [[ -n "$task_id" && -n "$phase" ]] || fail "Usage: roadmap-helper.sh update-docs <task-id> <phase> <description...>"

  local changelog="CHANGELOG.md"
  if [[ ! -f "$changelog" ]]; then
    printf '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n' > "$changelog"
    log "Created ${changelog}"
  fi

  local date_stamp
  date_stamp="$(date +%Y-%m-%d)"

  CLOG="$changelog" DATE="$date_stamp" TID="$task_id" TDESC="$desc" PHASE="$phase" \
    python3 <<'PY'
import os

clog  = os.environ["CLOG"]
date  = os.environ["DATE"]
tid   = os.environ["TID"]
tdesc = os.environ["TDESC"]
phase = os.environ["PHASE"]

with open(clog, "r", encoding="utf-8") as f:
    content = f.read()

entry = f"\n## [{date}] Phase {phase} — Task {tid}\n\n- {tdesc}\n"

parts = content.split("\n\n", 1)
if len(parts) == 2:
    new_content = parts[0] + "\n" + entry + "\n" + parts[1]
else:
    new_content = content + entry

with open(clog, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"[roadmap-helper] Updated {clog} with task {tid}")
PY

  if [[ -f "README.md" ]]; then
    if ! grep -q 'ROADMAP.md' README.md 2>/dev/null; then
      printf '\n## Progress\n\nSee [ROADMAP.md](ROADMAP.md) for implementation status.\n' >> README.md
      log "Added ROADMAP reference to README.md"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Subcommand: status [--phase N]
#
# Shows per-phase progress.  If --phase is given, shows only that phase.
# Output: one line per phase with counts, plus a summary total.
# ---------------------------------------------------------------------------

cmd_status() {
  local phase_filter=""

  while (( $# > 0 )); do
    case "$1" in
      --phase)
        [[ $# -ge 2 ]] || fail "Missing value for --phase"
        phase_filter="$2"
        shift 2
        ;;
      *) fail "Unknown option for status: $1" ;;
    esac
  done

  [[ -f "$ROADMAP_FILE" ]] || fail "Roadmap file not found: $ROADMAP_FILE"

  ROADMAP="$ROADMAP_FILE" PHASE_FILTER="$phase_filter" python3 <<'PY'
import re, os, sys

roadmap_path = os.environ["ROADMAP"]
phase_filter = os.environ.get("PHASE_FILTER", "").strip()

with open(roadmap_path, "r", encoding="utf-8") as f:
    text = f.read()

phases_to_scan = range(0, 10)
if phase_filter:
    try:
        phases_to_scan = [int(phase_filter)]
    except ValueError:
        print(f"Invalid phase: {phase_filter}", file=sys.stderr)
        sys.exit(1)

total_done  = 0
total_count = 0

print(f"{'Phase':<8} {'Done':>5} {'Total':>6} {'Remaining':>10}  Status")
print("-" * 52)

for phase in phases_to_scan:
    done  = len(re.findall(
        rf'^\s*-\s*\[[xX]\]\s*{phase}\.\d+',
        text, re.MULTILINE
    ))
    count = len(re.findall(
        rf'^\s*-\s*\[[ xX]\]\s*{phase}\.\d+',
        text, re.MULTILINE
    ))
    remaining = count - done
    total_done  += done
    total_count += count

    if count == 0:
        status = "—"
    elif done == count:
        status = "✓ complete"
    elif done == 0:
        status = "○ pending"
    else:
        status = "◐ in progress"

    print(f"  {phase:<6} {done:>5} {count:>6} {remaining:>10}  {status}")

print("-" * 52)
remaining_total = total_count - total_done
pct = (total_done / total_count * 100) if total_count else 0
print(f"  {'Total':<6} {total_done:>5} {total_count:>6} {remaining_total:>10}  {pct:.0f}% complete")

if total_done == total_count and total_count > 0:
    print("\n🎉 ROADMAP is fully complete!")
PY
}

# ---------------------------------------------------------------------------
# Subcommand: change-name <phase> <task-id>
#
# Legacy: generates a per-task change name.
# Prefer phase-change-name for the per-phase workflow.
# ---------------------------------------------------------------------------

cmd_change_name() {
  local phase="${1:-}"
  local task_id="${2:-}"
  [[ -n "$phase" && -n "$task_id" ]] || fail "Usage: roadmap-helper.sh change-name <phase> <task-id>"

  local safe_id="${task_id//./-}"
  echo "roadmap-phase-${phase}-task-${safe_id}"
}

# ---------------------------------------------------------------------------
# Subcommand: init-handoff
#
# Creates HANDOFF.md if it doesn't exist, with the current project state.
# ---------------------------------------------------------------------------

cmd_init_handoff() {
  local handoff_file="HANDOFF.md"

  if [[ -f "$handoff_file" ]]; then
    log "HANDOFF.md already exists"
    return 0
  fi

  local date_stamp
  date_stamp="$(date +%Y-%m-%d)"

  cat > "$handoff_file" <<'EOF'
# Session Handoff

This file enables session continuity for the autonomous `opsx-loop`. Each session reads this file at startup and updates it after completing a phase.

---

## Current State

| Field | Value |
|-------|-------|
| **Last Completed Phase** | (none) |
| **Last Session** | INITIALIZING |
| **Overall Progress** | 0/? tasks |
| **ROADMAP Status** | ○ Starting |

---

## Completed Phases

| Phase | Title | Key Artifacts |
|-------|-------|---------------|
| (none yet) | | |

---

## Key Decisions (ADR Summary)

_Decisions will be documented here as phases are completed._

---

## Project Patterns

_To be documented as patterns emerge during implementation._

---

## Known Issues & Gotchas

_To be documented as issues are encountered._

---

## Lessons Learned

_To be documented as the project progresses._

---

## Next Phase Context

### Target Phase
Phase 0: Project Foundation

### Phase Goal
Establish the development environment, project structure, and testing infrastructure.

---

## Session Resumption Instructions

When starting a new session to continue the ROADMAP:

1. Read this file: `cat HANDOFF.md`
2. Check status: `bash scripts/roadmap-helper.sh status`
3. Invoke loop: `/opsx-loop`
4. After completion: This file updates automatically

---

## Changelog

| Date | Phase | Session | Notes |
|------|-------|---------|-------|
EOF

  echo "| ${date_stamp} | — | Initialization | Created HANDOFF.md |" >> "$handoff_file"

  log "Created ${handoff_file}"
}

# ---------------------------------------------------------------------------
# Subcommand: update-handoff <phase> <phase_title> [completed_count] [total_count]
#
# Updates HANDOFF.md with the latest phase completion info.
# Extracts key information from the phase artifacts.
# ---------------------------------------------------------------------------

cmd_update_handoff() {
  local phase="${1:-}"
  local phase_title="${2:-}"
  local completed="${3:-0}"
  local total="${4:-0}"

  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh update-handoff <phase> <phase_title> [completed] [total]"

  local handoff_file="HANDOFF.md"
  [[ -f "$handoff_file" ]] || cmd_init_handoff

  local date_stamp
  date_stamp="$(date +%Y-%m-%d)"

  local change_name="roadmap-phase-${phase}"
  local change_dir="openspec/changes/${change_name}"

  local status_icon="◐ in progress"
  if [[ "$completed" == "$total" && "$total" -gt 0 ]]; then
    status_icon="✓ complete"
  fi

  HANDOFF="$handoff_file" PHASE="$phase" TITLE="$phase_title" COMPLETED="$completed" \
  TOTAL="$total" DATE="$date_stamp" CHANGE_DIR="$change_dir" STATUS="$status_icon" \
    python3 <<'PY'
import os, re
from datetime import datetime

handoff_path = os.environ["HANDOFF"]
phase = os.environ["PHASE"]
title = os.environ.get("TITLE", f"Phase {phase}")
completed = int(os.environ.get("COMPLETED", "0"))
total = int(os.environ.get("TOTAL", "0"))
date_stamp = os.environ["DATE"]
change_dir = os.environ.get("CHANGE_DIR", "")
status = os.environ.get("STATUS", "in progress")

with open(handoff_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update Current State section
state_pattern = r'(## Current State\s*\n\s*\| Field \| Value \|\s*\n\s*\|-+\|-+\|\s*\n)(.*?)(\n\s*---)'
state_match = re.search(state_pattern, content, re.DOTALL)

if state_match:
    total_done_pattern = r'Overall Progress.*?(\d+)/(\d+)'
    all_tasks = re.findall(total_done_pattern, content)
    if all_tasks:
        done_sum = sum(int(t[0]) for t in all_tasks)
        total_sum = sum(int(t[1]) for t in all_tasks)
        done_sum += completed
        total_sum = max(total_sum, total)
    else:
        done_sum = completed
        total_sum = total

    pct = (done_sum / total_sum * 100) if total_sum > 0 else 0
    road_status = "✅ COMPLETE" if done_sum >= total_sum and total_sum > 0 else status

    new_state = f"""| Field | Value |
|-------|-------|
| **Last Completed Phase** | {phase} |
| **Last Session** | {date_stamp} |
| **Overall Progress** | {done_sum}/{total_sum} tasks ({int(pct)}%) |
| **ROADMAP Status** | {road_status} |"""

    content = content[:state_match.start(2)] + new_state + content[state_match.end(2):]

# Update Completed Phases table
phases_pattern = r'(## Completed Phases\s*\n\s*\| Phase \| Title \| Key Artifacts \|\s*\n\s*\|-+\|-+\|-+\|\s*\n)((?:\|.*\|\s*\n)*)(\s*---)'
phases_match = re.search(phases_pattern, content, re.DOTALL)

if phases_match:
    existing_phases = phases_match.group(2)
    phase_entry_pattern = rf'\| {phase} \|'
    if not re.search(phase_entry_pattern, existing_phases):
        new_entry = f"| {phase} | {title} | `openspec/changes/{change_dir}/` |\n"
        existing_phases = existing_phases.rstrip() + "\n" + new_entry
        content = content[:phases_match.start(2)] + existing_phases + content[phases_match.end(2):]

# Add changelog entry
changelog_pattern = r'(## Changelog\s*\n\s*\| Date \| Phase \| Session \| Notes \|\s*\n\s*\|-+\|-+\|-+\|-+\|\s*\n)((?:\|.*\|\s*\n)*)(\s*$)'
changelog_match = re.search(changelog_pattern, content, re.DOTALL)

if changelog_match:
    existing_entries = changelog_match.group(2)
    entry_pattern = rf'\| {date_stamp} \| {phase} \|'
    if not re.search(entry_pattern, existing_entries):
        new_entry = f"| {date_stamp} | {phase} | Continuation | Completed {completed} task(s) |\n"
        content = content[:changelog_match.start(2)] + existing_entries + new_entry + content[changelog_match.end(2):]

with open(handoff_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"[roadmap-helper] Updated HANDOFF.md with phase {phase} completion")
PY
}

# ---------------------------------------------------------------------------
# Subcommand: write-drift-sentinel <phase> <reason>
#
# Writes a sentinel file signalling the agent is stuck on <phase>.
# The orchestrator reads this to distinguish stuck agents from slow progress.
#
# File written: .pipeline-drift-sentinel
# ---------------------------------------------------------------------------

cmd_write_drift_sentinel() {
  local phase="${1:-}"
  shift
  local reason="$*"
  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh write-drift-sentinel <phase> <reason>"

  local sentinel_file=".pipeline-drift-sentinel"
  local date_stamp
  date_stamp="$(date '+%Y-%m-%d %H:%M:%S')"

  cat > "$sentinel_file" <<EOF
phase=${phase}
reason=${reason}
timestamp=${date_stamp}
EOF

  log "Drift sentinel written for phase ${phase}: ${reason}"
}

# ---------------------------------------------------------------------------
# Subcommand: clear-drift-sentinel <phase>
#
# Removes the drift sentinel if it matches <phase>, signalling the agent
# has made progress and the stuck condition is resolved.
# ---------------------------------------------------------------------------

cmd_clear_drift_sentinel() {
  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh clear-drift-sentinel <phase>"

  local sentinel_file=".pipeline-drift-sentinel"

  if [[ ! -f "$sentinel_file" ]]; then
    log "No drift sentinel present — nothing to clear"
    return 0
  fi

  local sentinel_phase
  sentinel_phase="$(grep '^phase=' "$sentinel_file" | cut -d= -f2)"

  if [[ "$sentinel_phase" == "$phase" ]]; then
    rm "$sentinel_file"
    log "Drift sentinel cleared for phase ${phase}"
  else
    log "Drift sentinel is for phase ${sentinel_phase}, not ${phase} — leaving unchanged"
  fi
}

# ---------------------------------------------------------------------------
# Subcommand: check-drift-sentinel <phase>
#
# Checks whether a drift sentinel exists for <phase>.
# Exits 0 if stuck (sentinel present for this phase), 1 if clear.
# Prints a human-readable summary either way.
# ---------------------------------------------------------------------------

cmd_check_drift_sentinel() {
  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: roadmap-helper.sh check-drift-sentinel <phase>"

  local sentinel_file=".pipeline-drift-sentinel"

  if [[ ! -f "$sentinel_file" ]]; then
    log "No drift sentinel — phase ${phase} is clear"
    return 1
  fi

  local sentinel_phase sentinel_reason sentinel_ts
  sentinel_phase="$(grep '^phase=' "$sentinel_file" | cut -d= -f2)"
  sentinel_reason="$(grep '^reason=' "$sentinel_file" | cut -d= -f2-)"
  sentinel_ts="$(grep '^timestamp=' "$sentinel_file" | cut -d= -f2-)"

  if [[ "$sentinel_phase" == "$phase" ]]; then
    log "DRIFT DETECTED — phase ${phase} is stuck"
    log "  Reason:    ${sentinel_reason}"
    log "  Timestamp: ${sentinel_ts}"
    return 0
  else
    log "Drift sentinel is for phase ${sentinel_phase}, not ${phase} — phase ${phase} is clear"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Subcommand: show-handoff
#
# Displays a summary of the current handoff state.
# ---------------------------------------------------------------------------

cmd_show_handoff() {
  local handoff_file="HANDOFF.md"

  if [[ ! -f "$handoff_file" ]]; then
    log "No HANDOFF.md found. Run 'init-handoff' to create one."
    return 1
  fi

  HANDOFF="$handoff_file" python3 <<'PY'
import os, re

handoff_path = os.environ["HANDOFF"]

with open(handoff_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract Current State
state_match = re.search(r'## Current State(.*?)---', content, re.DOTALL)
if state_match:
    print("═══════════════════════════════════════════════════════")
    print("  SESSION HANDOFF STATE")
    print("═══════════════════════════════════════════════════════")
    print(state_match.group(1).strip())
    print()

# Extract Next Phase Context
next_match = re.search(r'## Next Phase Context(.*?)(?=##|$)', content, re.DOTALL)
if next_match:
    print("───────────────────────────────────────────────────────")
    print("  NEXT PHASE")
    print("───────────────────────────────────────────────────────")
    next_content = next_match.group(1).strip()
    # Just show first few lines
    lines = [l for l in next_content.split('\n') if l.strip() and not l.startswith('|')][:5]
    for line in lines:
        print(line)
    print()

print("───────────────────────────────────────────────────────")
print(f"Full handoff: cat {handoff_path}")
print("═══════════════════════════════════════════════════════")
PY
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

show_usage() {
  cat <<'EOF'
Usage: scripts/roadmap-helper.sh <subcommand> [args...]

Phase-level subcommands (one openspec change per phase):
  next-phase [--start N]                    Print next phase with pending tasks
  phase-tasks --phase N                     Print ALL pending tasks for a phase
  phase-change-name <phase>                 Generate openspec change name for a phase
  phase-commit <phase> [description...]     Stage and commit for a completed phase
  phase-update-docs <phase> <count> [desc]  Update CHANGELOG/README for a phase

Task-level subcommands (used within a phase):
  next-task [--phase N]                     Print next pending task (phase|id|desc)
  mark-done <task-id>                       Mark task complete in ROADMAP.md

Session handoff subcommands:
  init-handoff                              Create HANDOFF.md if it doesn't exist
  update-handoff <phase> <title> [done] [total]  Update HANDOFF.md after phase
  show-handoff                              Display current handoff summary

Drift detection subcommands:
  write-drift-sentinel <phase> <reason>     Signal agent is stuck on phase
  clear-drift-sentinel <phase>              Clear sentinel when phase advances
  check-drift-sentinel <phase>              Check sentinel; exits 0=stuck, 1=clear

General subcommands:
  check                                     Run quality checks (lint, typecheck, test, build)
  commit <task-id> <description...>         Stage and commit for a single task
  update-docs <task-id> <phase> <desc...>   Update CHANGELOG/README for a single task
  status [--phase N]                        Show per-phase progress summary
  change-name <phase> <task-id>             Generate per-task change name (legacy)

Environment:
  ROADMAP_FILE    Path to roadmap file (default: ROADMAP.md)

EOF
}

main() {
  local subcmd="${1:-}"
  [[ -n "$subcmd" ]] || { show_usage; exit 1; }
  shift

  case "$subcmd" in
    next-phase)         cmd_next_phase "$@" ;;
    phase-tasks)        cmd_phase_tasks "$@" ;;
    phase-change-name)  cmd_phase_change_name "$@" ;;
    phase-commit)       cmd_phase_commit "$@" ;;
    phase-update-docs)  cmd_phase_update_docs "$@" ;;
    next-task)          cmd_next_task "$@" ;;
    mark-done)          cmd_mark_done "$@" ;;
    init-handoff)       cmd_init_handoff "$@" ;;
    update-handoff)     cmd_update_handoff "$@" ;;
    show-handoff)       cmd_show_handoff "$@" ;;
    write-drift-sentinel) cmd_write_drift_sentinel "$@" ;;
    clear-drift-sentinel) cmd_clear_drift_sentinel "$@" ;;
    check-drift-sentinel) cmd_check_drift_sentinel "$@" ;;
    check)              cmd_check "$@" ;;
    commit)             cmd_commit "$@" ;;
    update-docs)        cmd_update_docs "$@" ;;
    status)             cmd_status "$@" ;;
    change-name)        cmd_change_name "$@" ;;
    --help|-h)          show_usage ;;
    *)                  fail "Unknown subcommand: $subcmd. Run with --help for usage." ;;
  esac
}

main "$@"
