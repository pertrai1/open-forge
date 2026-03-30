#!/usr/bin/env bash

set -euo pipefail

# ---------------------------------------------------------------------------
# roadmap-loop.sh
#
# Lightweight wrapper around the LLM-agent-driven ROADMAP automation loop.
#
# The actual work (writing specs, tests, and source code) is performed by an
# LLM agent inside OpenCode using the /opsx-loop command.  Each phase gets a
# single openspec change covering all its tasks.  This script exists for
# convenience — it can show progress, preview pending phases/tasks, and point
# you to the agent command.
#
# See LOOP.md for full architecture documentation.
# ---------------------------------------------------------------------------

readonly HELPER="scripts/roadmap-helper.sh"
readonly AGENT_CMD="/opsx-loop"

log()  { printf '[roadmap-loop] %s\n' "$*"; }
fail() { printf '[roadmap-loop] ERROR: %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Ensure helper script exists
# ---------------------------------------------------------------------------

require_helper() {
  if [[ ! -x "$HELPER" ]]; then
    if [[ -f "$HELPER" ]]; then
      chmod +x "$HELPER"
    else
      fail "Helper script not found: ${HELPER}"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
Usage: scripts/roadmap-loop.sh [command] [options]

Convenience wrapper for the LLM-agent-driven ROADMAP loop.
Each ROADMAP phase gets a single openspec change covering all its tasks.

Commands:
  status [--phase N]      Show per-phase progress summary
  preview [--phase N]     List all pending tasks without executing anything
  next                    Print the next phase that has pending tasks
  help                    Show this help text

The actual implementation loop is driven by an LLM agent inside OpenCode.
One openspec change is created per phase (not per task). To run:

    1. Open an OpenCode session
    2. Type:  ${AGENT_CMD}            (all phases 0-9)
       or:    ${AGENT_CMD} 2          (single phase)
       or:    ${AGENT_CMD} 3-5        (phase range)

The agent will autonomously iterate through every pending phase — writing
real specs, tests, and source code for all tasks in the phase — using the
opsx workflow and the helper script at ${HELPER}.

See LOOP.md for the full architecture.
EOF
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

cmd_status() {
  require_helper
  bash "$HELPER" status "$@"
}

cmd_next() {
  require_helper
  local result
  result="$(bash "$HELPER" next-phase "$@")"

  if [[ "$result" == "ROADMAP_COMPLETE" ]]; then
    log "🎉 All ROADMAP phases are complete!"
    return 0
  fi

  local phase title pending total
  IFS='|' read -r phase title pending total <<< "$result"

  log "Next phase with pending tasks:"
  log ""
  log "  Phase:     ${phase}"
  log "  Title:     ${title}"
  log "  Pending:   ${pending} of ${total} task(s)"
  log "  Change:    roadmap-phase-${phase}"
  log ""

  # Show the pending tasks within this phase
  log "  Pending tasks:"
  while IFS='|' read -r task_id task_desc; do
    [[ "$task_id" == "PHASE_COMPLETE" ]] && break
    log "    - [ ] ${task_id} ${task_desc}"
  done < <(bash "$HELPER" phase-tasks --phase "$phase")

  log ""
  log "To process this phase (and all subsequent), run ${AGENT_CMD} in OpenCode."
}

cmd_preview() {
  require_helper

  local phase_args=()
  local phase_flag=""
  while (( $# > 0 )); do
    case "$1" in
      --phase)
        [[ $# -ge 2 ]] || fail "Missing value for --phase"
        phase_flag="$2"
        phase_args=(--phase "$2")
        shift 2
        ;;
      *) fail "Unknown option: $1" ;;
    esac
  done

  local phases_to_scan
  if [[ -n "$phase_flag" ]]; then
    phases_to_scan="$phase_flag"
    log "Pending tasks for phase ${phase_flag}:"
  else
    phases_to_scan="0 1 2 3 4 5 6 7 8 9"
    log "Pending tasks across all phases:"
  fi

  log ""

  local total=0
  for p in $phases_to_scan; do
    local tasks_in_phase=()
    while IFS= read -r line; do
      [[ -n "$line" && "$line" != "ROADMAP_COMPLETE" ]] && tasks_in_phase+=("$line")
    done < <(bash "$HELPER" next-task --phase "$p" 2>/dev/null; while true; do
      local r
      r="$(bash "$HELPER" next-task --phase "$p" 2>/dev/null)"
      [[ "$r" != "ROADMAP_COMPLETE" ]] || break
      echo "$r"
    done)

    # next-task returns one at a time (the first pending), so read all via python
    local phase_tasks
    phase_tasks="$(ROADMAP_FILE="${ROADMAP_FILE:-ROADMAP.md}" python3 - "$p" <<'PY'
import re, os, sys

roadmap_path = os.environ.get("ROADMAP_FILE", "ROADMAP.md")
phase = int(sys.argv[1])

with open(roadmap_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

phase_header = re.compile(rf'^##\s+Phase\s+{phase}\b')
next_header  = re.compile(r'^##\s+Phase\s+\d+\b')
task_re = re.compile(
    r'^\s*-\s*\[(?P<st>[ ])\]\s*(?P<id>' + str(phase) + r'\.\d+)\s*(?P<desc>.*)$'
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
    print(f"  - [ ] {m.group('id')} {m.group('desc').strip()}")
PY
    )"

    if [[ -n "$phase_tasks" ]]; then
      local count
      count="$(echo "$phase_tasks" | wc -l | tr -d ' ')"
      total=$((total + count))
      log "Phase ${p}  (${count} pending):"
      echo "$phase_tasks"
      log ""
    fi
  done

  if (( total == 0 )); then
    log "🎉 No pending tasks — ROADMAP is complete!"
  else
    log "${total} task(s) remaining."
    log ""
    log "To process them, run ${AGENT_CMD} in OpenCode."
  fi
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

main() {
  local subcmd="${1:-help}"
  shift 2>/dev/null || true

  case "$subcmd" in
    status)       cmd_status "$@" ;;
    preview)      cmd_preview "$@" ;;
    next)         cmd_next "$@" ;;
    help|--help|-h)  usage ;;
    *)
      # Handle old-style flags gracefully
      case "$subcmd" in
        --dry-run)  cmd_preview "$@" ;;
        --phase)    cmd_preview --phase "$@" ;;
        *)
          log "Unknown command: ${subcmd}"
          log ""
          usage
          exit 1
          ;;
      esac
      ;;
  esac
}

main "$@"
