#!/usr/bin/env bash

set -euo pipefail

# ---------------------------------------------------------------------------
# forge-helper.sh
#
# Thin bookkeeping utility for LLM agents to drive ROADMAP execution in the
# open-forge monorepo. Adapted from packages/mcp/scripts/roadmap-helper.sh
# for multi-package awareness.
#
# Designed to be called from within an agent-driven loop. The agent does the
# thinking — this script handles structured data extraction and bookkeeping.
#
# Key difference from the single-package version:
#   --package <name>   Targets a per-package ROADMAP (packages/<name>/ROADMAP.md)
#   (no --package)     Targets the root ROADMAP.md
#
# Subcommands (phase-level):
#   next-phase [--package <name>] [--start N]
#   phase-tasks --phase N [--package <name>]
#   phase-change-name <phase> [--package <name>]
#   phase-commit <phase> [--package <name>] [description...]
#   phase-update-docs <phase> <count> [--package <name>] [description...]
#
# Subcommands (task-level):
#   next-task [--phase N] [--package <name>]
#   mark-done <task-id> [--package <name>]
#
# Subcommands (quality gates):
#   check [--package <name>]
#
# Subcommands (session handoff):
#   init-handoff
#   update-handoff <phase> <title> [--package <name>] [done] [total]
#   show-handoff
#
# Subcommands (drift detection):
#   write-drift-sentinel <phase> [--package <name>] <reason>
#   clear-drift-sentinel <phase> [--package <name>]
#   check-drift-sentinel <phase> [--package <name>]
#
# Subcommands (general):
#   status [--phase N] [--package <name>]
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

log()  { printf '[forge-helper] %s\n' "$*"; }
warn() { printf '[forge-helper] WARN: %s\n' "$*" >&2; }
fail() { printf '[forge-helper] ERROR: %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Protected branches — refuse mutating operations on these
# ---------------------------------------------------------------------------

PROTECTED_BRANCHES="main master"

assert_feature_branch() {
  local current_branch
  current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

  for protected in $PROTECTED_BRANCHES; do
    if [[ "$current_branch" == "$protected" ]]; then
      fail "Refusing to run on protected branch '${current_branch}'. Create a feature branch first:
  git checkout -b feat/<package>-wave-<N>"
    fi
  done
}

# ---------------------------------------------------------------------------
# Subcommand: check-branch
#
# Verifies the current branch is not protected. Prints current branch name.
# Exits 0 if on a feature branch, exits 1 if on a protected branch.
# ---------------------------------------------------------------------------

cmd_check_branch() {
  local current_branch
  current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

  for protected in $PROTECTED_BRANCHES; do
    if [[ "$current_branch" == "$protected" ]]; then
      warn "On protected branch '${current_branch}'. Create a feature branch first:"
      warn "  git checkout -b feat/<package>-wave-<N>"
      return 1
    fi
  done

  log "On branch: ${current_branch}"
  return 0
}

# ---------------------------------------------------------------------------
# Helpers: resolve ROADMAP file path
# ---------------------------------------------------------------------------

resolve_roadmap() {
  local package="${1:-}"
  if [[ -n "$package" ]]; then
    echo "packages/${package}/ROADMAP.md"
  else
    echo "ROADMAP.md"
  fi
}

# ---------------------------------------------------------------------------
# Helpers: parse --package from args (mutates PACKAGE and remaining args)
# ---------------------------------------------------------------------------

PACKAGE=""

parse_package_flag() {
  local args=()
  PACKAGE=""
  while (( $# > 0 )); do
    case "$1" in
      --package)
        [[ $# -ge 2 ]] || fail "Missing value for --package"
        PACKAGE="$2"
        shift 2
        ;;
      *)
        args+=("$1")
        shift
        ;;
    esac
  done
  REMAINING_ARGS=("${args[@]+"${args[@]}"}")
}

# ---------------------------------------------------------------------------
# Subcommand: next-phase [--package <name>] [--start N]
#
# Finds the first phase that has at least one unchecked task.
# Output: <phase>|<phase_title>|<pending_count>|<total_count>
# If all done: ROADMAP_COMPLETE
# ---------------------------------------------------------------------------

cmd_next_phase() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local start_phase=0
  while (( $# > 0 )); do
    case "$1" in
      --start) start_phase="$2"; shift 2 ;;
      *) fail "Unknown option for next-phase: $1" ;;
    esac
  done

  local roadmap
  roadmap="$(resolve_roadmap "$PACKAGE")"
  [[ -f "$roadmap" ]] || fail "Roadmap file not found: $roadmap"

  local phase found=false
  for phase in $(seq "$start_phase" 99); do
    local pending total title
    pending=$(grep -cE "^\s*-\s*\[ \]\s*${phase}\.[0-9]" "$roadmap" 2>/dev/null || true)
    total=$(grep -cE "^\s*-\s*\[[ xX]\]\s*${phase}\.[0-9]" "$roadmap" 2>/dev/null || true)

    [[ "$total" -gt 0 ]] || continue
    [[ "$pending" -gt 0 ]] || continue

    title=$(grep -E "^##\s+Phase\s+${phase}\b" "$roadmap" | head -1 | sed -E 's/^##[[:space:]]*//' || echo "Phase ${phase}")
    echo "${phase}|${title}|${pending}|${total}"
    found=true
    break
  done

  [[ "$found" == true ]] || echo "ROADMAP_COMPLETE"
}

# ---------------------------------------------------------------------------
# Subcommand: phase-tasks --phase N [--package <name>]
#
# Prints ALL pending (unchecked) tasks for the given phase.
# Output: one line per task: <task_id>|<description>
# If none remain: PHASE_COMPLETE
# ---------------------------------------------------------------------------

cmd_phase_tasks() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase=""
  while (( $# > 0 )); do
    case "$1" in
      --phase) phase="$2"; shift 2 ;;
      *) fail "Unknown option for phase-tasks: $1" ;;
    esac
  done

  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh phase-tasks --phase <N> [--package <name>]"

  local roadmap
  roadmap="$(resolve_roadmap "$PACKAGE")"
  [[ -f "$roadmap" ]] || fail "Roadmap file not found: $roadmap"

  local lines
  lines=$(grep -E "^\s*-\s*\[ \]\s*${phase}\.[0-9]" "$roadmap" 2>/dev/null || true)

  if [[ -z "$lines" ]]; then
    echo "PHASE_COMPLETE"
    return 0
  fi

  echo "$lines" | while IFS= read -r line; do
    local task_id desc
    # Extract task ID (e.g., "1.1") — everything up to the first space after the ID
    task_id=$(echo "$line" | sed -E 's/^[[:space:]]*-[[:space:]]*\[[[:space:]]\][[:space:]]*([0-9]+\.[0-9]+).*/\1/')
    # Extract description — everything after the task ID
    desc=$(echo "$line" | sed -E 's/^[[:space:]]*-[[:space:]]*\[[[:space:]]\][[:space:]]*[0-9]+\.[0-9]+[[:space:]]*//')
    echo "${task_id}|${desc}"
  done
}

# ---------------------------------------------------------------------------
# Subcommand: phase-change-name <phase> [--package <name>]
#
# Generates a consistent openspec change name for a phase.
# With package: "telemetry-phase-1"
# Without:     "forge-phase-1"
# ---------------------------------------------------------------------------

cmd_phase_change_name() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh phase-change-name <phase> [--package <name>]"

  if [[ -n "$PACKAGE" ]]; then
    echo "${PACKAGE}-phase-${phase}"
  else
    echo "forge-phase-${phase}"
  fi
}

# ---------------------------------------------------------------------------
# Subcommand: mark-done <task-id> [--package <name>]
#
# Toggles a checklist item from [ ] to [x] in the ROADMAP.
# Prints: updated | already_done | missing
# ---------------------------------------------------------------------------

cmd_mark_done() {
  assert_feature_branch
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local task_id="${1:-}"
  [[ -n "$task_id" ]] || fail "Usage: forge-helper.sh mark-done <task-id> [--package <name>]"

  local roadmap
  roadmap="$(resolve_roadmap "$PACKAGE")"
  [[ -f "$roadmap" ]] || fail "Roadmap file not found: $roadmap"

  # Check if already done
  if grep -qE "^\s*-\s*\[[xX]\]\s*${task_id}\b" "$roadmap" 2>/dev/null; then
    echo "already_done"
    return 0
  fi

  # Check if exists as pending
  if ! grep -qE "^\s*-\s*\[ \]\s*${task_id}\b" "$roadmap" 2>/dev/null; then
    echo "missing"
    return 2
  fi

  # Toggle [ ] to [x]
  sed -i '' -E "s/^(\s*-\s*)\[ \](\s*${task_id}\b)/\1[x]\2/" "$roadmap"
  echo "updated"
}

# ---------------------------------------------------------------------------
# Subcommand: next-task [--phase N] [--package <name>]
#
# Prints the next unchecked task.
# Output: <phase>|<task_id>|<description>
# If none remain: ROADMAP_COMPLETE
# ---------------------------------------------------------------------------

cmd_next_task() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase_filter=""
  while (( $# > 0 )); do
    case "$1" in
      --phase) phase_filter="$2"; shift 2 ;;
      *) fail "Unknown option for next-task: $1" ;;
    esac
  done

  local roadmap
  roadmap="$(resolve_roadmap "$PACKAGE")"
  [[ -f "$roadmap" ]] || fail "Roadmap file not found: $roadmap"

  local pattern
  if [[ -n "$phase_filter" ]]; then
    pattern="^\s*-\s*\[ \]\s*${phase_filter}\.[0-9]"
  else
    pattern="^\s*-\s*\[ \]\s*[0-9]+\.[0-9]"
  fi

  local line
  line=$(grep -E "$pattern" "$roadmap" | head -1 || true)

  if [[ -z "$line" ]]; then
    echo "ROADMAP_COMPLETE"
    return 0
  fi

  local task_id desc phase
  task_id=$(echo "$line" | sed -E 's/^\s*-\s*\[ \]\s*([0-9]+\.[0-9]+).*/\1/')
  desc=$(echo "$line" | sed -E 's/^\s*-\s*\[ \]\s*[0-9]+\.[0-9]+\s*//')
  phase=$(echo "$task_id" | cut -d. -f1)
  echo "${phase}|${task_id}|${desc}"
}

# ---------------------------------------------------------------------------
# Subcommand: check [--package <name>]
#
# Runs quality gates via Nx.
# With --package: runs build, test, lint for that project
# Without:        runs affected targets
# ---------------------------------------------------------------------------

cmd_check() {
  parse_package_flag "$@"

  log "Running quality checks"

  local exit_code=0
  if [[ -n "$PACKAGE" ]]; then
    log "  Checking package: ${PACKAGE}"
    if npx nx run-many -t build,test,lint -p "$PACKAGE" 2>&1; then
      log "  ✓ All checks passed for ${PACKAGE}"
    else
      warn "  ✗ Checks failed for ${PACKAGE}"
      exit_code=1
    fi
  else
    log "  Checking affected projects"
    if npx nx affected -t build,test,lint 2>&1; then
      log "  ✓ All affected checks passed"
    else
      warn "  ✗ Affected checks failed"
      exit_code=1
    fi
  fi

  return $exit_code
}

# ---------------------------------------------------------------------------
# Subcommand: status [--phase N] [--package <name>]
#
# Shows per-phase progress summary.
# ---------------------------------------------------------------------------

cmd_status() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase_filter=""
  while (( $# > 0 )); do
    case "$1" in
      --phase) phase_filter="$2"; shift 2 ;;
      *) fail "Unknown option for status: $1" ;;
    esac
  done

  local roadmap
  roadmap="$(resolve_roadmap "$PACKAGE")"
  [[ -f "$roadmap" ]] || fail "Roadmap file not found: $roadmap"

  local label="ROADMAP"
  [[ -z "$PACKAGE" ]] || label="${PACKAGE} ROADMAP"

  local total_done=0 total_count=0

  printf '\n%s\n' "  ${label} Progress"
  printf '%-8s %5s %6s %10s  %s\n' "Phase" "Done" "Total" "Remaining" "Status"
  printf '%s\n' "----------------------------------------------------"

  for phase in $(seq 0 99); do
    # If filtering, skip non-matching phases
    if [[ -n "$phase_filter" && "$phase" != "$phase_filter" ]]; then
      continue
    fi

    local done count
    done=$(grep -cE "^\s*-\s*\[[xX]\]\s*${phase}\.[0-9]" "$roadmap" 2>/dev/null || true)
    count=$(grep -cE "^\s*-\s*\[[ xX]\]\s*${phase}\.[0-9]" "$roadmap" 2>/dev/null || true)

    [[ "$count" -gt 0 ]] || continue

    local remaining=$((count - done))
    total_done=$((total_done + done))
    total_count=$((total_count + count))

    local status
    if [[ "$done" -eq "$count" ]]; then
      status="✓ complete"
    elif [[ "$done" -eq 0 ]]; then
      status="○ pending"
    else
      status="◐ in progress"
    fi

    printf '  %-6s %5d %6d %10d  %s\n' "$phase" "$done" "$count" "$remaining" "$status"
  done

  printf '%s\n' "----------------------------------------------------"
  local remaining_total=$((total_count - total_done))
  local pct=0
  [[ "$total_count" -eq 0 ]] || pct=$((total_done * 100 / total_count))
  printf '  %-6s %5d %6d %10d  %d%% complete\n' "Total" "$total_done" "$total_count" "$remaining_total" "$pct"

  if [[ "$total_done" -eq "$total_count" && "$total_count" -gt 0 ]]; then
    printf '\n  🎉 %s is fully complete!\n' "$label"
  fi
  echo
}

# ---------------------------------------------------------------------------
# Subcommand: phase-commit <phase> [--package <name>] [description...]
# ---------------------------------------------------------------------------

cmd_phase_commit() {
  assert_feature_branch
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh phase-commit <phase> [--package <name>] [description...]"
  shift
  local desc="$*"
  [[ -n "$desc" ]] || desc="complete all tasks"

  if git diff --quiet 2>/dev/null \
     && git diff --cached --quiet 2>/dev/null \
     && [[ -z "$(git ls-files --others --exclude-standard 2>/dev/null)" ]]; then
    log "No changes to commit for phase ${phase}"
    return 0
  fi

  local scope=""
  [[ -z "$PACKAGE" ]] || scope="(${PACKAGE})"

  git add -A
  git commit -m "feat${scope}: complete roadmap phase ${phase} — ${desc}"
  log "Committed phase ${phase}: ${desc}"
}

# ---------------------------------------------------------------------------
# Subcommand: phase-update-docs <phase> <count> [--package <name>] [desc...]
# ---------------------------------------------------------------------------

cmd_phase_update_docs() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  local completed="${2:-}"
  shift 2 2>/dev/null || true
  local desc="$*"

  [[ -n "$phase" && -n "$completed" ]] || \
    fail "Usage: forge-helper.sh phase-update-docs <phase> <count> [--package <name>] [desc...]"

  local changelog="CHANGELOG.md"
  if [[ ! -f "$changelog" ]]; then
    printf '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n' > "$changelog"
    log "Created ${changelog}"
  fi

  local date_stamp scope_label
  date_stamp="$(date +%Y-%m-%d)"
  scope_label="${PACKAGE:-forge}"

  local title="[${scope_label}] Phase ${phase}"
  [[ -z "$desc" ]] || title="${title}: ${desc}"

  local entry
  entry=$(printf '\n## [%s] %s\n\n- Completed %s task(s) in %s phase %s\n' \
    "$date_stamp" "$title" "$completed" "$scope_label" "$phase")

  # Insert after header
  local tmp
  tmp=$(mktemp)
  awk -v entry="$entry" '
    /^# Changelog/ { print; found=1; next }
    found && /^$/ { print; print entry; found=0; next }
    { print }
  ' "$changelog" > "$tmp"
  mv "$tmp" "$changelog"

  log "Updated ${changelog} with ${scope_label} phase ${phase}"
}

# ---------------------------------------------------------------------------
# Session handoff
# ---------------------------------------------------------------------------

cmd_init_handoff() {
  assert_feature_branch
  local handoff_file="HANDOFF.md"

  if [[ -f "$handoff_file" ]]; then
    log "HANDOFF.md already exists"
    return 0
  fi

  local date_stamp
  date_stamp="$(date +%Y-%m-%d)"

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local template="${script_dir}/templates/HANDOFF.template.md"

  if [[ ! -f "$template" ]]; then
    fail "Handoff template not found: ${template}"
  fi

  sed "s/__DATE__/${date_stamp}/g" "$template" > "$handoff_file"
  echo "| ${date_stamp} | -- | -- | -- | Created HANDOFF.md |" >> "$handoff_file"

  log "Created ${handoff_file}"
}

cmd_update_handoff() {
  assert_feature_branch
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  local phase_title="${2:-}"
  local completed="${3:-0}"
  local total="${4:-0}"

  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh update-handoff <phase> <title> [--package <name>] [done] [total]"

  local handoff_file="HANDOFF.md"
  [[ -f "$handoff_file" ]] || cmd_init_handoff

  local date_stamp
  date_stamp="$(date +%Y-%m-%d)"
  local pkg_label="${PACKAGE:-root}"

  # Update Current State table in-place (sed -i '' for macOS compat, # delimiter)
  sed -i '' "s#Last Completed Phase.*#Last Completed Phase** | ${pkg_label} phase ${phase} |#" "$handoff_file"
  sed -i '' "s#Last Session.*#Last Session** | ${date_stamp} |#" "$handoff_file"
  sed -i '' "s#Active Package.*#Active Package** | ${pkg_label} |#" "$handoff_file"

  # Update ROADMAP Status based on whether there are remaining tasks
  if [[ "$completed" == "$total" && "$total" -gt 0 ]]; then
    sed -i '' "s#ROADMAP Status.*#ROADMAP Status** | Phase ${phase} complete |#" "$handoff_file"
  else
    sed -i '' "s#ROADMAP Status.*#ROADMAP Status** | In progress |#" "$handoff_file"
  fi

  # Append changelog entry
  local entry="| ${date_stamp} | -- | ${pkg_label} | ${phase} | ${phase_title} -- ${completed}/${total} tasks |"
  echo "$entry" >> "$handoff_file"

  log "Updated HANDOFF.md with ${pkg_label} phase ${phase} completion"
}

cmd_show_handoff() {
  local handoff_file="HANDOFF.md"

  if [[ ! -f "$handoff_file" ]]; then
    log "No HANDOFF.md found. Run init-handoff to create one."
    return 1
  fi

  echo "======================================================="
  echo "  SESSION HANDOFF STATE"
  echo "======================================================="

  awk '/^## Current State/,/^---$/' "$handoff_file" | grep '^|' | tail -n +3

  echo ""
  echo "-------------------------------------------------------"
  echo "  NEXT PHASE"
  echo "-------------------------------------------------------"

  awk '/^## Next Phase Context/,/^---$/' "$handoff_file" | grep -v '^---$' | grep -v '^## ' | head -10

  echo ""
  echo "-------------------------------------------------------"
  echo "  Full handoff: cat ${handoff_file}"
  echo "======================================================="
}

# ---------------------------------------------------------------------------
# Drift detection
# ---------------------------------------------------------------------------

cmd_write_drift_sentinel() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  shift
  local reason="$*"
  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh write-drift-sentinel <phase> [--package <name>] <reason>"

  local sentinel_file=".pipeline-drift-sentinel"
  local date_stamp
  date_stamp="$(date '+%Y-%m-%d %H:%M:%S')"

  printf 'phase=%s\npackage=%s\nreason=%s\ntimestamp=%s\n' \
    "$phase" "${PACKAGE:-root}" "$reason" "$date_stamp" > "$sentinel_file"

  log "Drift sentinel written for ${PACKAGE:-root} phase ${phase}: ${reason}"
}

cmd_clear_drift_sentinel() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh clear-drift-sentinel <phase> [--package <name>]"

  local sentinel_file=".pipeline-drift-sentinel"

  if [[ ! -f "$sentinel_file" ]]; then
    log "No drift sentinel present -- nothing to clear"
    return 0
  fi

  local sentinel_phase sentinel_pkg
  sentinel_phase="$(grep '^phase=' "$sentinel_file" | cut -d= -f2)"
  sentinel_pkg="$(grep '^package=' "$sentinel_file" | cut -d= -f2)"
  local expected_pkg="${PACKAGE:-root}"

  if [[ "$sentinel_phase" == "$phase" && "$sentinel_pkg" == "$expected_pkg" ]]; then
    rm "$sentinel_file"
    log "Drift sentinel cleared for ${expected_pkg} phase ${phase}"
  else
    log "Drift sentinel is for ${sentinel_pkg} phase ${sentinel_phase}, not ${expected_pkg} phase ${phase} -- leaving unchanged"
  fi
}

cmd_check_drift_sentinel() {
  parse_package_flag "$@"
  set -- "${REMAINING_ARGS[@]+"${REMAINING_ARGS[@]}"}"

  local phase="${1:-}"
  [[ -n "$phase" ]] || fail "Usage: forge-helper.sh check-drift-sentinel <phase> [--package <name>]"

  local sentinel_file=".pipeline-drift-sentinel"

  if [[ ! -f "$sentinel_file" ]]; then
    log "No drift sentinel -- clear"
    return 1
  fi

  local sentinel_phase sentinel_pkg sentinel_reason sentinel_ts
  sentinel_phase="$(grep '^phase=' "$sentinel_file" | cut -d= -f2)"
  sentinel_pkg="$(grep '^package=' "$sentinel_file" | cut -d= -f2)"
  sentinel_reason="$(grep '^reason=' "$sentinel_file" | cut -d= -f2-)"
  sentinel_ts="$(grep '^timestamp=' "$sentinel_file" | cut -d= -f2-)"
  local expected_pkg="${PACKAGE:-root}"

  if [[ "$sentinel_phase" == "$phase" && "$sentinel_pkg" == "$expected_pkg" ]]; then
    log "DRIFT DETECTED -- ${expected_pkg} phase ${phase} is stuck"
    log "  Reason:    ${sentinel_reason}"
    log "  Timestamp: ${sentinel_ts}"
    return 0
  else
    log "Drift sentinel is for ${sentinel_pkg} phase ${sentinel_phase} -- ${expected_pkg} phase ${phase} is clear"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

show_usage() {
  echo "Usage: scripts/forge-helper.sh <subcommand> [args...]"
  echo ""
  echo "All subcommands accept --package <name> to target a per-package ROADMAP."
  echo "Without --package, targets the root ROADMAP.md."
  echo ""
  echo "Phase-level:"
  echo "  next-phase [--start N]                    Print next phase with pending tasks"
  echo "  phase-tasks --phase N                     Print ALL pending tasks for a phase"
  echo "  phase-change-name <phase>                 Generate openspec change name"
  echo "  phase-commit <phase> [description...]     Stage and commit for a completed phase"
  echo "  phase-update-docs <phase> <count> [desc]  Update CHANGELOG for a phase"
  echo ""
  echo "Task-level:"
  echo "  next-task [--phase N]                     Print next pending task (phase|id|desc)"
  echo "  mark-done <task-id>                       Mark task complete in ROADMAP.md"
  echo ""
  echo "Quality gates:"
  echo "  check                                     Run quality checks via Nx"
  echo ""
  echo "Session handoff:"
  echo "  init-handoff                              Create HANDOFF.md"
  echo "  update-handoff <phase> <title> [done] [total]  Update HANDOFF.md after phase"
  echo "  show-handoff                              Display current handoff summary"
  echo ""
  echo "Drift detection:"
  echo "  write-drift-sentinel <phase> <reason>     Signal agent is stuck on phase"
  echo "  clear-drift-sentinel <phase>              Clear sentinel when phase advances"
  echo "  check-drift-sentinel <phase>              Check sentinel; exits 0=stuck, 1=clear"
  echo ""
  echo "General:"
  echo "  status [--phase N]                        Show per-phase progress summary"
  echo ""
  echo "Examples:"
  echo "  scripts/forge-helper.sh status --package telemetry"
  echo "  scripts/forge-helper.sh next-phase --package evaluations"
  echo "  scripts/forge-helper.sh mark-done 1.2 --package telemetry"
  echo "  scripts/forge-helper.sh check --package pipeline"
  echo "  scripts/forge-helper.sh check                              # affected only"
}

main() {
  local subcmd="${1:-}"
  [[ -n "$subcmd" ]] || { show_usage; exit 1; }
  shift

  case "$subcmd" in
    next-phase)            cmd_next_phase "$@" ;;
    phase-tasks)           cmd_phase_tasks "$@" ;;
    phase-change-name)     cmd_phase_change_name "$@" ;;
    phase-commit)          cmd_phase_commit "$@" ;;
    phase-update-docs)     cmd_phase_update_docs "$@" ;;
    next-task)             cmd_next_task "$@" ;;
    mark-done)             cmd_mark_done "$@" ;;
    init-handoff)          cmd_init_handoff "$@" ;;
    update-handoff)        cmd_update_handoff "$@" ;;
    show-handoff)          cmd_show_handoff "$@" ;;
    write-drift-sentinel)  cmd_write_drift_sentinel "$@" ;;
    clear-drift-sentinel)  cmd_clear_drift_sentinel "$@" ;;
    check-drift-sentinel)  cmd_check_drift_sentinel "$@" ;;
    check)                 cmd_check "$@" ;;
    check-branch)          cmd_check_branch "$@" ;;
    status)                cmd_status "$@" ;;
    --help|-h)             show_usage ;;
    *)                     fail "Unknown subcommand: $subcmd. Run with --help for usage." ;;
  esac
}

main "$@"
