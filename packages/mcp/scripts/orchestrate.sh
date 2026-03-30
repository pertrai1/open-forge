#!/usr/bin/env bash

set -euo pipefail

# ---------------------------------------------------------------------------
# orchestrate.sh
#
# External orchestrator that drives the opsx-loop phase by phase without
# requiring manual re-invocation. Each phase runs in a fresh OpenCode session,
# which reads HANDOFF.md to restore context and exits after completing one phase.
#
# This solves context exhaustion: rather than one session trying to process all
# phases until it hits the context limit, each phase gets a full context budget.
#
# Usage:
#   bash scripts/orchestrate.sh              # Run until ROADMAP_COMPLETE
#   bash scripts/orchestrate.sh --phase 3    # Run from phase 3 onward
#   bash scripts/orchestrate.sh --dry-run    # Show what would run, no execution
#
# Requirements:
#   - opencode CLI on PATH
#   - scripts/roadmap-helper.sh present and executable
#   - HANDOFF.md (created automatically if missing)
# ---------------------------------------------------------------------------

readonly HELPER="scripts/roadmap-helper.sh"
readonly LOG_FILE="PIPELINE-ORCHESTRATOR.log"
readonly MAX_ATTEMPTS_PER_PHASE=3

DRY_RUN=false
START_PHASE=""

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

log() {
  local msg="[orchestrate] $*"
  printf '%s\n' "$msg"
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$msg" >> "$LOG_FILE"
}

log_section() {
  local line="═══════════════════════════════════════════════════════"
  log "$line"
  log "  $*"
  log "$line"
}

warn() { log "WARN: $*"; }

fail() {
  log "ERROR: $*"
  exit 1
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

require_deps() {
  [[ -f "$HELPER" ]] || fail "Helper script not found: $HELPER"
  [[ -x "$HELPER" ]] || chmod +x "$HELPER"

  if ! command -v opencode &>/dev/null; then
    fail "'opencode' not found on PATH. Install it before running the orchestrator."
  fi
}

get_next_phase() {
  local start_arg=""
  [[ -n "$START_PHASE" ]] && start_arg="--start ${START_PHASE}"
  bash "$HELPER" next-phase $start_arg 2>/dev/null || echo "ROADMAP_COMPLETE"
}

extract_phase_number() {
  local phase_info="$1"
  IFS='|' read -r phase _ _ _ <<< "$phase_info"
  echo "$phase"
}

# ---------------------------------------------------------------------------
# Verify a phase made progress after an opencode invocation.
# Returns 0 if the phase advanced (or ROADMAP is complete), 1 if stuck.
# ---------------------------------------------------------------------------

phase_advanced() {
  local before_phase="$1"
  local after_info
  after_info="$(get_next_phase)"

  if [[ "$after_info" == "ROADMAP_COMPLETE" ]]; then
    return 0
  fi

  local after_phase
  after_phase="$(extract_phase_number "$after_info")"

  [[ "$after_phase" != "$before_phase" ]]
}

# ---------------------------------------------------------------------------
# Check whether the agent wrote a drift sentinel for the current phase.
# Returns 0 if stuck (sentinel present), 1 if clear.
# ---------------------------------------------------------------------------

phase_drift_detected() {
  local phase="$1"
  bash "$HELPER" check-drift-sentinel "$phase" &>/dev/null
}

# ---------------------------------------------------------------------------
# Run one phase via OpenCode non-interactively.
# Returns opencode's exit code.
# ---------------------------------------------------------------------------

run_one_phase() {
  if [[ "$DRY_RUN" == true ]]; then
    log "[dry-run] Would run: opencode -p \"/opsx-loop single-phase\" -q"
    return 0
  fi

  opencode -p "/opsx-loop single-phase" -q
}

# ---------------------------------------------------------------------------
# Write a structured entry to the orchestrator log at session start/end.
# ---------------------------------------------------------------------------

log_session_start() {
  {
    printf '\n'
    printf '## Orchestrator Session — %s\n\n' "$(date '+%Y-%m-%d %H:%M:%S')"
    printf '| Field | Value |\n|-------|-------|\n'
    printf '| Started | %s |\n' "$(date '+%Y-%m-%d %H:%M:%S')"
    printf '| Dry Run | %s |\n' "$DRY_RUN"
    printf '| Start Phase | %s |\n' "${START_PHASE:-auto}"
  } >> "$LOG_FILE"
}

log_phase_result() {
  local phase="$1" attempt="$2" result="$3"
  printf '| Phase %s attempt %s | %s |\n' "$phase" "$attempt" "$result" >> "$LOG_FILE"
}

log_session_end() {
  local outcome="$1"
  printf '| Completed | %s |\n' "$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
  printf '| Outcome | %s |\n\n' "$outcome" >> "$LOG_FILE"
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

parse_args() {
  while (( $# > 0 )); do
    case "$1" in
      --phase)
        [[ $# -ge 2 ]] || fail "Missing value for --phase"
        START_PHASE="$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --help|-h)
        cat <<'EOF'
Usage: npm run loop [-- options]
       bash scripts/orchestrate.sh [options]

Options:
  --phase N     Start from phase N (default: next pending phase)
  --dry-run     Show what would run without executing OpenCode
  --help        Show this help

Drives opsx-loop phase by phase using OpenCode non-interactive mode.
Each phase runs in a fresh session; HANDOFF.md bridges context between sessions.
Stops automatically when ROADMAP_COMPLETE, after 3 failed attempts on a phase,
or immediately when the agent writes a drift sentinel (quality check stuck).
EOF
        exit 0
        ;;
      *)
        fail "Unknown option: $1. Run with --help for usage."
        ;;
    esac
  done
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

main() {
  parse_args "$@"
  require_deps

  log_section "ROADMAP Orchestrator Starting"
  log_session_start

  bash "$HELPER" init-handoff

  log "Checking ROADMAP status..."
  bash "$HELPER" status

  local attempts=0
  local last_phase=""

  while true; do
    local phase_info
    phase_info="$(get_next_phase)"

    if [[ "$phase_info" == "ROADMAP_COMPLETE" ]]; then
      log_section "ROADMAP Complete"
      bash "$HELPER" status
      bash "$HELPER" show-handoff
      log_session_end "ROADMAP_COMPLETE"
      exit 0
    fi

    local phase
    phase="$(extract_phase_number "$phase_info")"

    local phase_title pending total
    IFS='|' read -r _ phase_title pending total <<< "$phase_info"

    if [[ "$phase" == "$last_phase" ]]; then
      attempts=$((attempts + 1))
    else
      attempts=1
      last_phase="$phase"
    fi

    if (( attempts > MAX_ATTEMPTS_PER_PHASE )); then
      log "Phase ${phase} failed after ${MAX_ATTEMPTS_PER_PHASE} attempts."
      log "Document the blocker in PIPELINE-ISSUES.md before retrying."
      log_phase_result "$phase" "$attempts" "HALTED — exceeded max attempts"
      log_session_end "HALTED at phase ${phase}"
      fail "Stopping. Max attempts (${MAX_ATTEMPTS_PER_PHASE}) exceeded for phase ${phase}."
    fi

    log_section "Phase ${phase}: ${phase_title} (${pending}/${total} tasks pending, attempt ${attempts}/${MAX_ATTEMPTS_PER_PHASE})"

    local exit_code=0
    run_one_phase || exit_code=$?

    if (( exit_code != 0 )); then
      warn "OpenCode exited with code ${exit_code} on phase ${phase}"
      log_phase_result "$phase" "$attempts" "opencode exit code ${exit_code}"
    fi

    if [[ "$DRY_RUN" == true ]]; then
      log "[dry-run] Stopping after first iteration."
      log_session_end "DRY_RUN"
      exit 0
    fi

    if phase_drift_detected "$phase"; then
      log "DRIFT DETECTED — agent signalled it is stuck on phase ${phase}."
      log "Check PIPELINE-ISSUES.md for the blocker details, then resolve and re-run."
      log_phase_result "$phase" "$attempts" "HALTED — drift sentinel set by agent"
      log_session_end "HALTED at phase ${phase} (drift)"
      fail "Stopping. Agent is stuck on phase ${phase}. See PIPELINE-ISSUES.md."
    fi

    if phase_advanced "$phase"; then
      log "✓ Phase ${phase} complete — advancing"
      log_phase_result "$phase" "$attempts" "complete"
    else
      warn "Phase ${phase} did not advance (attempt ${attempts}/${MAX_ATTEMPTS_PER_PHASE})"
      log_phase_result "$phase" "$attempts" "no progress"
    fi
  done
}

main "$@"
