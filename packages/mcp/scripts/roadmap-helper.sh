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
