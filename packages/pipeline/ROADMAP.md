# OpenForge Pipeline - Implementation Roadmap

## Overview

This roadmap breaks down the REQUIREMENTS.md into atomic, self-contained tasks that can be executed independently or in parallel by multiple subagents.

**Tech Stack**: TypeScript / Node.js 20+
**Interface**: CLI + OpenCode Plugin
**Distribution**: npm package (`open-forge-pipeline`)
**Architecture**: Autonomous agent pipeline with context firewalls, sequential quality gates, and session handoff

---

## Phase 0: Project Foundation

**Goal**: Establish the development environment, project structure, and testing infrastructure.

### Tasks

- [x] 0.1 Initialize Node.js project with `package.json` [deps: None] [deliverable: `package.json` with TypeScript, Vitest, Zod, commander deps]
- [x] 0.2 Configure TypeScript (`tsconfig.json`) [deps: None] [deliverable: `tsconfig.json` with strict mode, Node 18+ target]
- [x] 0.3 Set up testing framework (Vitest) [deps: 0.1] [deliverable: `vitest.config.ts` + sample passing test]
- [x] 0.4 Create project directory structure [deps: None] [deliverable: Full `src/` structure per Package Structure section]
- [x] 0.5 Add linter/formatter (ESLint + Prettier) [deps: None] [deliverable: `.eslintrc.js`, `.prettierrc`]
- [x] 0.6 Create template files [deps: 0.4] [deliverable: `templates/ROADMAP.template.md`, `templates/HANDOFF.template.md`, `templates/forge.config.template.json`]

**Parallel Groups**:

- Group A: 0.1, 0.2, 0.4, 0.5 (all independent)
- Group B: 0.3 (requires 0.1)
- Group C: 0.6 (requires 0.4)

---

## Phase 1: Core Types & Interfaces

**Goal**: Define all TypeScript interfaces, types, and schemas for ROADMAP, HANDOFF, pipeline state, and configuration.

### Tasks

- [x] 1.1 Define ROADMAP types [deps: 0.4] [deliverable: `src/lib/roadmap/types.ts` - Phase, Task, ROADMAP interfaces]
- [x] 1.2 Define HANDOFF types [deps: 0.4] [deliverable: `src/lib/handoff/types.ts` - HandoffState, TaskLog, Convention interfaces]
- [x] 1.3 Define pipeline state types [deps: 0.4] [deliverable: `src/types.ts` - PipelineState, PhaseState, ExecutionMode types]
- [x] 1.4 Define quality gate types [deps: 0.4] [deliverable: `src/lib/quality/types.ts` - GateResult, CheckResult interfaces]
- [x] 1.5 Define metrics types [deps: 0.4] [deliverable: `src/lib/metrics/types.ts` - InvocationMetrics, CostManifest interfaces]
- [x] 1.6 Define orchestrator types [deps: 0.4] [deliverable: `src/lib/orchestrator/types.ts` - Intent, Strategy, SessionState interfaces]
- [x] 1.7 Create Zod schemas for configuration [deps: 0.1] [deliverable: `src/lib/config/schema.ts` - ForgeConfigSchema with all fields]
- [x] 1.8 Write tests for types [deps: 1.1-1.7] [deliverable: `tests/types.test.ts`]

**Parallel Groups**:

- Group A: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 (all independent)
- Group B: 1.7 (requires 0.1)
- Group C: 1.8 (requires all of Group A)

---

## Phase 2: ROADMAP Parser & Generator

**Goal**: Implement ROADMAP.md parsing and generation from requirements.

### Tasks

- [ ] 2.1 Implement ROADMAP parser [deps: 1.1] [deliverable: `src/lib/roadmap/parser.ts` - parseROADMAP(), parsePhase(), parseTask()]
- [ ] 2.2 Implement ROADMAP generator [deps: 1.1] [deliverable: `src/lib/roadmap/generator.ts` - generateROADMAP()]
- [ ] 2.3 Implement task complexity classifier [deps: 1.1] [deliverable: `src/lib/roadmap/classifier.ts` - classifyTask()]
- [ ] 2.4 Implement ROADMAP task marker [deps: 2.1] [deliverable: `src/lib/helper/roadmap.ts` - markTaskDone(), getNextTask()]
- [ ] 2.5 Implement parallel group detector [deps: 2.1] [deliverable: `src/lib/roadmap/parallel.ts` - detectParallelGroups()]
- [ ] 2.6 Write tests for ROADMAP module [deps: 2.1-2.5] [deliverable: `tests/roadmap-parser.test.ts`, `tests/roadmap-generator.test.ts`]

**Parallel Groups**:

- Group A: 2.1, 2.2, 2.3 (all independent, all use types from 1.1)
- Group B: 2.4, 2.5 (requires 2.1)
- Group C: 2.6 (requires all previous)

---

## Phase 3: HANDOFF Manager & Helper Utilities

**Goal**: Implement HANDOFF.md operations and thin utility functions for agent bookkeeping.

### Tasks

- [ ] 3.1 Implement HANDOFF manager [deps: 1.2] [deliverable: `src/lib/handoff/manager.ts` - readHandoff(), writeHandoff(), appendTaskLog()]
- [ ] 3.2 Implement HANDOFF helper [deps: 3.1] [deliverable: `src/lib/helper/handoff.ts` - getActiveConventions(), getWakeContext()]
- [ ] 3.3 Implement metrics logger [deps: 1.5] [deliverable: `src/lib/metrics/logger.ts` - logInvocation(), getCostManifest()]
- [ ] 3.4 Implement metrics helper [deps: 3.3] [deliverable: `src/lib/helper/metrics.ts` - recordToolResult(), calculateTotals()]
- [ ] 3.5 Implement drift sentinel manager [deps: 0.4] [deliverable: `src/lib/helper/drift.ts` - writeDriftSentinel(), clearDriftSentinel(), checkDriftSentinel()]
- [ ] 3.6 Implement checkpoint manager [deps: 0.4] [deliverable: `src/lib/helper/checkpoint.ts` - createCheckpoint(), rollbackToCheckpoint(), deleteCheckpoints(), listCheckpoints(), getCheckpointDiff()]
- [ ] 3.7 Implement memory injection scanner [deps: 0.4] [deliverable: `src/lib/helper/scanner.ts` - scanForInjection(), sanitizeUnicode()]
- [ ] 3.8 Write tests for HANDOFF module [deps: 3.1-3.7] [deliverable: `tests/handoff-manager.test.ts`, `tests/helper.test.ts`]

**Parallel Groups**:

- Group A: 3.1, 3.3, 3.5, 3.6, 3.7 (all independent)
- Group B: 3.2 (requires 3.1), 3.4 (requires 3.3)
- Group C: 3.8 (requires all previous)

---

## Phase 4: Pipeline Orchestrator

**Goal**: Implement session management, intent routing, and phase execution coordination.

### Tasks

- [ ] 4.1 Implement session manager [deps: 1.3] [deliverable: `src/lib/orchestrator/session.ts` - createSession(), endSession(), getSessionState()]
- [ ] 4.2 Implement intent & model router [deps: 1.6] [deliverable: `src/lib/orchestrator/router.ts` - classifyIntent(), selectStrategy(), routeModelByComplexity()]
- [ ] 4.3 Implement phase executor [deps: 2.4, 3.1] [deliverable: `src/lib/orchestrator/executor.ts` - executePhase(), handlePhaseFailure()]
- [ ] 4.4 Implement context compressor [deps: 4.1] [deliverable: `src/lib/orchestrator/compressor.ts` - compressSession(), extractMiddleContext()]
- [ ] 4.5 Implement orchestrator main loop [deps: 4.1, 4.2, 4.3, 4.4] [deliverable: `src/lib/orchestrator/index.ts` - runPipeline(), runContinuous(), runSinglePhase()]
- [ ] 4.6 Implement execution mode handler [deps: 4.5] [deliverable: `src/lib/orchestrator/modes.ts` - single-phase, continuous, range modes]
- [ ] 4.7 Write tests for orchestrator [deps: 4.1-4.6] [deliverable: `tests/orchestrator.test.ts`]

**Parallel Groups**:

- Group A: 4.1, 4.2 (independent)
- Group B: 4.3 (requires 2.4, 3.1), 4.4 (requires 4.1)
- Group C: 4.5 (requires 4.1, 4.2, 4.3, 4.4)
- Group D: 4.6 (requires 4.5)
- Group E: 4.7 (requires all previous)

---

## Phase 5: Execution Engine & Quality Gates

**Goal**: Implement the per-phase workflow and quality gate runner.

### Tasks

- [ ] 5.1 Implement execution engine [deps: 1.3, 2.4, 3.1] [deliverable: `src/lib/execution/engine.ts` - runPerPhaseWorkflow()]
- [ ] 5.2 Implement quality checker [deps: 1.4] [deliverable: `src/lib/quality/checker.ts` - runLint(), runTypeCheck(), runTests(), runBuild()]
- [ ] 5.3 Implement quality gate runner [deps: 5.2] [deliverable: `src/lib/helper/quality.ts` - runQualityGates(), checkAllGates()]
- [ ] 5.4 Implement gate retry loop [deps: 5.3, 3.6] [deliverable: `src/lib/quality/retry.ts` - runWithRetry(), handleGateFailure(), rollbackAndRetry()]
- [ ] 5.5 Implement PIPELINE-ISSUES writer [deps: 0.4] [deliverable: `src/lib/helper/issues.ts` - documentBlocker(), formatIssue()]
- [ ] 5.6 Write tests for execution engine [deps: 5.1-5.5] [deliverable: `tests/execution-engine.test.ts`, `tests/quality-checker.test.ts`]

**Parallel Groups**:

- Group A: 5.1, 5.2, 5.5 (independent)
- Group B: 5.3 (requires 5.2)
- Group C: 5.4 (requires 5.3)
- Group D: 5.6 (requires all previous)

---

## Phase 6: Context Firewalls & Post-Implementation Gates

**Goal**: Implement role-based access control for context and sequential quality gates.

### Tasks

- [ ] 6.1 Implement context firewall [deps: 1.3] [deliverable: `src/lib/firewall/context.ts` - filterContextForRole(), enforceFirewall()]
- [ ] 6.2 Implement role definitions [deps: 1.3] [deliverable: `src/lib/firewall/roles.ts` - TestAuthor, Implementer, GateAgent, CleanupAgent role restrictions with blocked read/write patterns]
- [ ] 6.3 Implement tool interceptor [deps: 6.1, 6.2] [deliverable: `src/lib/firewall/interceptor.ts` - createFirewallInterceptor(), matchesRestriction(), buildBlockedResponse(), logViolation()]
- [ ] 6.4 Implement disagreement protocol [deps: 6.1] [deliverable: `src/lib/firewall/disagreement.ts` - handleDisagreement(), routeToOrchestrator()]
- [ ] 6.5 Implement Verify gate [deps: 5.3] [deliverable: `src/lib/gates/verify.ts` - runVerifyGate()]
- [ ] 6.6 Implement QA Testing gate [deps: 5.3] [deliverable: `src/lib/gates/qa.ts` - runQAGate()]
- [ ] 6.7 Implement Security Audit gate [deps: 5.3] [deliverable: `src/lib/gates/security.ts` - runSecurityGate()]
- [ ] 6.8 Implement Architect Review gate [deps: 5.3] [deliverable: `src/lib/gates/architect.ts` - runArchitectGate()]
- [ ] 6.9 Implement Code Review gate [deps: 5.3] [deliverable: `src/lib/gates/code-review.ts` - runCodeReviewGate()]
- [ ] 6.10 Implement Integration Testing gate [deps: 5.3] [deliverable: `src/lib/gates/integration.ts` - runIntegrationGate()]
- [ ] 6.11 Implement gate sequencer [deps: 6.5-6.10] [deliverable: `src/lib/gates/sequencer.ts` - runGateSequence()]
- [ ] 6.12 Implement intent verification [deps: 6.8] [deliverable: `src/lib/gates/intent-verification.ts` - verifyIntent()]
- [ ] 6.13 Write tests for gates & firewalls [deps: 6.1-6.12] [deliverable: `tests/gates.test.ts`, `tests/firewall.test.ts`]

**Parallel Groups**:

- Group A: 6.1, 6.2 (independent)
- Group B: 6.3 (requires 6.1, 6.2), 6.4 (requires 6.1)
- Group C: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10 (all independent, all require 5.3)
- Group D: 6.11 (requires all of Group C)
- Group E: 6.12 (requires 6.8)
- Group F: 6.13 (requires all previous)

---

## Phase 7: Lessons Feedback & Entropy Management

**Goal**: Implement the lessons feedback loop and cleanup agent functionality.

### Tasks

- [ ] 7.1 Implement lessons manager [deps: 0.4] [deliverable: `src/lib/lessons/manager.ts` - readLessons(), appendLesson(), checkIfRecurring()]
- [ ] 7.2 Implement pattern detector [deps: 7.1] [deliverable: `src/lib/lessons/detector.ts` - detectRecurringPattern()]
- [ ] 7.3 Implement lessons categories [deps: 7.1] [deliverable: `src/lib/lessons/categories.ts` - Testing, Implementation, ErrorHandling, Security]
- [ ] 7.4 Implement entropy detector [deps: 0.4] [deliverable: `src/lib/entropy/detector.ts` - detectDeadCode(), detectUnusedImports(), detectDuplicates()]
- [ ] 7.5 Implement cleanup agent [deps: 7.4] [deliverable: `src/lib/entropy/cleanup.ts` - runCleanupAgent()]
- [ ] 7.6 Implement entropy budget [deps: 7.5] [deliverable: `src/lib/entropy/budget.ts` - calculateEntropyBudget()]
- [ ] 7.7 Write tests for lessons & entropy [deps: 7.1-7.6] [deliverable: `tests/lessons.test.ts`, `tests/entropy.test.ts`]

**Parallel Groups**:

- Group A: 7.1, 7.4 (independent)
- Group B: 7.2, 7.3 (requires 7.1)
- Group C: 7.5, 7.6 (requires 7.4)
- Group D: 7.7 (requires all previous)

---

## Phase 8: Todo-Driven Completion & Observability

**Goal**: Implement hard completion constraints, clarification limits, and observability pattern.

### Tasks

- [ ] 8.1 Implement isIncomplete checker [deps: 1.3] [deliverable: `src/lib/completion/checker.ts` - isIncomplete()]
- [ ] 8.2 Implement completion enforcer [deps: 8.1] [deliverable: `src/lib/completion/enforcer.ts` - enforceCompletion()]
- [ ] 8.3 Implement clarification tracker [deps: 1.3] [deliverable: `src/lib/clarification/tracker.ts` - trackClarification(), checkLimit()]
- [ ] 8.4 Implement clarification handler [deps: 8.3] [deliverable: `src/lib/clarification/handler.ts` - askClarification(), documentAssumption()]
- [ ] 8.5 Implement ToolResult interface [deps: 1.3] [deliverable: `src/lib/observability/result.ts` - ToolResult, createToolResult()]
- [ ] 8.6 Implement observability logger [deps: 8.5, 3.3] [deliverable: `src/lib/observability/logger.ts` - logToolExecution()]
- [ ] 8.7 Write tests for completion & observability [deps: 8.1-8.6] [deliverable: `tests/completion.test.ts`, `tests/observability.test.ts`]

**Parallel Groups**:

- Group A: 8.1, 8.3, 8.5 (independent)
- Group B: 8.2 (requires 8.1), 8.4 (requires 8.3), 8.6 (requires 8.5, 3.3)
- Group C: 8.7 (requires all previous)

---

## Phase 9: Plan Generation & Selection

**Goal**: Implement multi-plan generation and critic agent selection.

### Tasks

- [ ] 9.1 Implement plan generator [deps: 1.3] [deliverable: `src/lib/planning/generator.ts` - generatePlans()]
- [ ] 9.2 Implement plan evaluator [deps: 9.1] [deliverable: `src/lib/planning/evaluator.ts` - evaluatePlan()]
- [ ] 9.3 Implement critic agent [deps: 9.2] [deliverable: `src/lib/planning/critic.ts` - runCriticAgent()]
- [ ] 9.4 Implement plan selector [deps: 9.3] [deliverable: `src/lib/planning/selector.ts` - selectBestPlan()]
- [ ] 9.5 Write tests for planning [deps: 9.1-9.4] [deliverable: `tests/planning.test.ts`]

**Parallel Groups**:

- Sequential: 9.1 → 9.2 → 9.3 → 9.4 → 9.5

---

## Phase 10: Plugin Architecture & CLI

**Goal**: Implement the OpenCode plugin interface, layered configuration, and CLI commands.

### Tasks

- [ ] 10.1 Implement plugin entry point [deps: All previous] [deliverable: `src/index.ts` - OpenForgePipelinePlugin()]
- [ ] 10.2 Implement config handler [deps: 1.7] [deliverable: `src/lib/config/handler.ts` - configHandler(), mergeConfigs()]
- [ ] 10.3 Implement layered config loader [deps: 10.2] [deliverable: `src/lib/config/loader.ts` - loadPluginDefaults(), loadGlobalConfig(), loadProjectConfig()]
- [ ] 10.4 Implement CLI entry point [deps: 4.5] [deliverable: `src/cli.ts` - CLI using commander]
- [ ] 10.5 Implement init command [deps: 10.4] [deliverable: `src/commands/init.ts`]
- [ ] 10.6 Implement plan command [deps: 10.4, 2.2] [deliverable: `src/commands/plan.ts`]
- [ ] 10.7 Implement run command [deps: 10.4, 4.5] [deliverable: `src/commands/run.ts`]
- [ ] 10.8 Implement status command [deps: 10.4] [deliverable: `src/commands/status.ts`]
- [ ] 10.9 Implement resume command [deps: 10.4, 4.5] [deliverable: `src/commands/resume.ts`]
- [ ] 10.10 Write tests for CLI [deps: 10.4-10.9] [deliverable: `tests/cli.test.ts`]

**Parallel Groups**:

- Group A: 10.2, 10.3, 10.4 (independent, can run in parallel)
- Group B: 10.5, 10.6, 10.7, 10.8, 10.9 (all require 10.4)
- Group C: 10.1 (requires all previous phases)
- Group D: 10.10 (requires all of Group B)

---

## Phase 11: OpenCode Commands & Distribution

**Goal**: Create OpenCode command definitions and prepare for npm distribution.

### Tasks

- [ ] 11.1 Create forge-init.md command [deps: 10.5] [deliverable: `commands/forge-init.md`]
- [ ] 11.2 Create forge-plan.md command [deps: 10.6] [deliverable: `commands/forge-plan.md`]
- [ ] 11.3 Create forge-run.md command [deps: 10.7] [deliverable: `commands/forge-run.md`]
- [ ] 11.4 Create forge-status.md command [deps: 10.8] [deliverable: `commands/forge-status.md`]
- [ ] 11.5 Create forge-resume.md command [deps: 10.9] [deliverable: `commands/forge-resume.md`]
- [ ] 11.6 Configure package.json for npm [deps: 10.1] [deliverable: Updated `package.json` with bin, files, exports]
- [ ] 11.7 Create README.md [deps: All] [deliverable: `README.md` with usage examples]
- [ ] 11.8 Add build scripts [deps: 11.6] [deliverable: Build and prepublish scripts in package.json]
- [ ] 11.9 Write integration tests [deps: All] [deliverable: `tests/integration/` directory]

**Parallel Groups**:

- Group A: 11.1, 11.2, 11.3, 11.4, 11.5 (all independent)
- Group B: 11.6, 11.7 (independent)
- Group C: 11.8 (requires 11.6)
- Group D: 11.9 (requires all previous)

---

## Phase 12: Documentation & Polish (Optional)

**Goal**: Add comprehensive documentation, examples, and final polish.

### Tasks

- [ ] 12.1 Create example project [deps: All] [deliverable: `examples/simple-project/`]
- [ ] 12.2 Write troubleshooting guide [deps: All] [deliverable: `docs/troubleshooting.md`]
- [ ] 12.3 Document configuration options [deps: 10.2] [deliverable: `docs/configuration.md`]
- [ ] 12.4 Create contribution guide [deps: None] [deliverable: `CONTRIBUTING.md`]
- [ ] 12.5 Add CHANGELOG.md [deps: None] [deliverable: `CHANGELOG.md`]
- [ ] 12.6 Set up CI/CD [deps: 11.8] [deliverable: `.github/workflows/` with test and publish]

---

## Dependency Graph Summary

```
Phase 0 (Foundation)
    │
    ├──→ Phase 1 (Types) ──→ Phase 2 (ROADMAP) ──┐
    │         │                                  │
    │         ├──→ Phase 3 (HANDOFF) ──→ Phase 4 (Orchestrator)
    │         │         │                        │
    │         │         └──→ Phase 5 (Execution) │
    │         │                                  │
    │         ├──→ Phase 6 (Firewalls/Gates) ────┤
    │         │                                  │
    │         ├──→ Phase 7 (Lessons/Entropy) ────┤
    │         │                                  │
    │         └──→ Phase 8 (Completion/Obs) ─────┤
    │                                            │
    └──→ Phase 9 (Planning) ─────────────────────┘
                                                 │
                                                 ▼
                                          Phase 10 (Plugin/CLI)
                                                 │
                                                 ▼
                                          Phase 11 (Commands/Dist)
                                                 │
                                                 ▼
                                          Phase 12 (Docs/Polish)
```

---

## Parallel Execution Strategy

### Maximum Parallelization Opportunities

| Phase | Max Parallel Agents | Tasks for Parallel Execution             |
| ----- | ------------------- | ---------------------------------------- |
| 0     | 4                   | 0.1, 0.2, 0.4, 0.5                       |
| 1     | 6                   | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6             |
| 2     | 3                   | 2.1, 2.2, 2.3                            |
| 3     | 5                   | 3.1, 3.3, 3.5, 3.6, 3.7                  |
| 4     | 2                   | 4.1, 4.2                                 |
| 5     | 3                   | 5.1, 5.2, 5.5                            |
| 6     | 6                   | 6.5, 6.6, 6.7, 6.8, 6.9, 6.10            |
| 7     | 2                   | 7.1, 7.4                                 |
| 8     | 3                   | 8.1, 8.3, 8.5                            |
| 9     | 1                   | Sequential                               |
| 10    | 3                   | 10.2, 10.3, 10.4                         |
| 11    | 7                   | 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7 |
| 12    | 5                   | 12.1, 12.2, 12.3, 12.4, 12.5             |

---

## File Structure Reference

```
open-forge-pipeline/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.js
├── .prettierrc
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── REQUIREMENTS.md
├── ROADMAP.md
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── cli.ts                      # CLI entry point
│   ├── types.ts                    # Shared types
│   ├── commands/
│   │   ├── index.ts                # Command registry
│   │   ├── init.ts                 # forge init
│   │   ├── plan.ts                 # forge plan
│   │   ├── run.ts                  # forge run
│   │   ├── status.ts               # forge status
│   │   └── resume.ts               # forge resume
│   └── lib/
│       ├── roadmap/
│       │   ├── parser.ts           # ROADMAP.md parsing
│       │   ├── generator.ts        # ROADMAP generation
│       │   ├── classifier.ts       # Task complexity classification
│       │   ├── parallel.ts         # Parallel group detection
│       │   └── types.ts            # ROADMAP types
│       ├── handoff/
│       │   ├── manager.ts          # HANDOFF.md operations
│       │   └── types.ts            # Handoff types
│       ├── helper/
│       │   ├── roadmap.ts          # ROADMAP task marking
│       │   ├── handoff.ts          # HANDOFF read/write
│       │   ├── metrics.ts          # PIPELINE-METRICS token tracking
│       │   ├── drift.ts            # Sentinel file management
│       │   ├── checkpoint.ts       # Shadow git checkpoint operations
│       │   ├── scanner.ts          # Memory injection protection
│       │   ├── quality.ts          # Quality gate runner
│       │   └── issues.ts           # PIPELINE-ISSUES writer
│       ├── orchestrator/
│       │   ├── session.ts          # Session management
│       │   ├── router.ts           # Intent classification
│       │   ├── executor.ts         # Phase execution logic
│       │   ├── compressor.ts       # Active context compression logic
│       │   ├── modes.ts            # Execution modes
│       │   ├── types.ts            # Orchestrator types
│       │   └── index.ts            # Main orchestrator
│       ├── execution/
│       │   └── engine.ts           # Per-phase workflow
│       ├── quality/
│       │   ├── checker.ts          # Quality gate runner
│       │   ├── retry.ts            # Gate retry loop
│       │   └── types.ts            # Check result types
│       ├── firewall/
│       │   ├── context.ts          # Context filtering
│       │   ├── roles.ts            # Role definitions & restriction patterns
│       │   ├── interceptor.ts      # Runtime tool.execute.before hook
│       │   └── disagreement.ts     # Disagreement protocol
│       ├── gates/
│       │   ├── verify.ts           # Verify gate
│       │   ├── qa.ts               # QA Testing gate
│       │   ├── security.ts         # Security Audit gate
│       │   ├── architect.ts        # Architect Review gate
│       │   ├── code-review.ts      # Code Review gate
│       │   ├── integration.ts      # Integration Testing gate
│       │   ├── sequencer.ts        # Gate sequencer
│       │   └── intent-verification.ts
│       ├── lessons/
│       │   ├── manager.ts          # Lessons manager
│       │   ├── detector.ts         # Pattern detector
│       │   └── categories.ts       # Lesson categories
│       ├── entropy/
│       │   ├── detector.ts         # Entropy detector
│       │   ├── cleanup.ts          # Cleanup agent
│       │   └── budget.ts           # Entropy budget
│       ├── completion/
│       │   ├── checker.ts          # isIncomplete checker
│       │   └── enforcer.ts         # Completion enforcer
│       ├── clarification/
│       │   ├── tracker.ts          # Clarification tracker
│       │   └── handler.ts          # Clarification handler
│       ├── observability/
│       │   ├── result.ts           # ToolResult interface
│       │   └── logger.ts           # Observability logger
│       ├── planning/
│       │   ├── generator.ts        # Plan generator
│       │   ├── evaluator.ts        # Plan evaluator
│       │   ├── critic.ts           # Critic agent
│       │   └── selector.ts         # Plan selector
│       ├── config/
│       │   ├── schema.ts           # Zod schemas
│       │   ├── handler.ts          # Config handler
│       │   └── loader.ts           # Layered config loader
│       └── metrics/
│           ├── logger.ts           # PIPELINE-METRICS operations
│           └── types.ts            # Metrics types
├── commands/
│   ├── forge-init.md
│   ├── forge-plan.md
│   ├── forge-run.md
│   ├── forge-status.md
│   └── forge-resume.md
├── templates/
│   ├── ROADMAP.template.md
│   ├── HANDOFF.template.md
│   └── forge.config.template.json
├── tests/
│   ├── types.test.ts
│   ├── roadmap-parser.test.ts
│   ├── roadmap-generator.test.ts
│   ├── handoff-manager.test.ts
│   ├── helper.test.ts
│   ├── orchestrator.test.ts
│   ├── execution-engine.test.ts
│   ├── quality-checker.test.ts
│   ├── gates.test.ts
│   ├── firewall.test.ts
│   ├── lessons.test.ts
│   ├── entropy.test.ts
│   ├── completion.test.ts
│   ├── observability.test.ts
│   ├── planning.test.ts
│   ├── cli.test.ts
│   └── integration/
│       └── ...
├── docs/
│   ├── configuration.md
│   └── troubleshooting.md
└── examples/
    └── simple-project/
```

---

## Notes for Subagents

1. **Each task is atomic** - A single subagent can complete it independently
2. **Check dependencies** - Ensure prerequisite tasks are complete before starting
3. **Follow existing patterns** - Look at similar files in the same directory for style
4. **Write tests** - Each task should include or update relevant tests
5. **Respect context firewalls** - Test authors and implementers have different access
6. **Use helper utilities** - All ROADMAP/HANDOFF operations go through helper/
7. **Document ADRs** - Architecture decisions go in HANDOFF.md
8. **Enforce quality gates** - No phase completes without passing all gates
9. **Track metrics** - Log all invocations for cost manifest
10. **Handle edge cases** - Empty ROADMAP, missing HANDOFF, drift sentinel present
