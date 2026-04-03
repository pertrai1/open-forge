## Why

Phase 2 delivered ROADMAP parsing and generation, but the pipeline has no way to persist session context across agent boundaries (HANDOFF.md), track execution costs (PIPELINE-METRICS.md), detect drift, create rollback checkpoints, or defend against prompt injection in persistent memory files. These are the foundational bookkeeping utilities that Phase 4 (Orchestrator) and Phase 5 (Execution Engine) depend on — they cannot be built without them.

## What Changes

- Add HANDOFF.md manager: read, write, and append task log entries to structured HANDOFF state
- Add HANDOFF helper: convenience functions for extracting active conventions and building structured wake context for session handoff
- Add metrics logger: record per-invocation metrics to PIPELINE-METRICS.md and produce cost manifests
- Add metrics helper: thin wrappers for recording tool results and calculating aggregated totals
- Add drift sentinel manager: write, read, and clear `.pipeline-drift-sentinel` files to halt runaway retry loops
- Add checkpoint manager: shadow git checkpoint operations (create, rollback, delete, list, diff) for safe retry cycles
- Add memory injection scanner: detect and sanitize prompt injection attempts in persistent files (HANDOFF.md, LESSONS.md)

## Capabilities

### New Capabilities
- `handoff-manager`: HANDOFF.md read/write/append operations with bounded growth rules (rewrite current state, append-only task log with compression of old entries)
- `handoff-helper`: Convenience functions for extracting active conventions and building structured wake context from HandoffState
- `metrics-logger`: Per-invocation metrics recording to PIPELINE-METRICS.md and cost manifest aggregation
- `metrics-helper`: Thin wrappers for recording tool execution results and calculating aggregated totals across invocations
- `drift-sentinel`: Write, read, clear, and check `.pipeline-drift-sentinel` files with structured content (phase, reason, timestamp, rollback target, attempt hashes)
- `checkpoint-manager`: Shadow git checkpoint operations using isolated GIT_DIR/GIT_WORK_TREE — create, rollback, delete, list, and diff checkpoints without touching user's git history
- `injection-scanner`: Detect instruction overrides, invisible Unicode characters, and exfiltration attempts in text content destined for persistent memory files

### Modified Capabilities

_None — all Phase 3 work introduces new modules._

## Impact

- **New files**: `src/lib/handoff/manager.ts`, `src/lib/helper/handoff.ts`, `src/lib/metrics/logger.ts`, `src/lib/helper/metrics.ts`, `src/lib/helper/drift.ts`, `src/lib/helper/checkpoint.ts`, `src/lib/helper/scanner.ts`
- **New test files**: `tests/handoff-manager.test.ts`, `tests/helper.test.ts`
- **Dependencies on existing types**: `HandoffState`, `WakeContext`, `Convention` (from `src/lib/handoff/types.ts`), `InvocationMetrics`, `CostManifest` (from `src/lib/metrics/types.ts`), `DriftSentinel` (from `src/types.ts`), `AgentRole` (from `src/types.ts`)
- **External dependencies**: `node:fs/promises`, `node:path`, `node:child_process` (for shadow git operations) — all Node.js built-ins, no new npm packages
- **Downstream consumers**: Phase 4 (Orchestrator) uses handoff manager + drift sentinel + checkpoints; Phase 5 (Execution Engine) uses all helpers; Phase 6 (Firewalls) uses injection scanner for violation logging
