# Open Forge

An agent-first harness engineering system for fully autonomous software development. Open Forge is not a developer tool with AI features — it is an autonomous system where agents are the primary actors. You describe what you want built, and the system plans, implements, tests, reviews, and ships working code with no human in the loop.

The system self-corrects through quality gates, enforces cost and safety constraints via telemetry, and closes the feedback loop with statistical evaluation of agent outputs — enabling autonomous decisions about model changes, prompt tuning, and regression detection.

## Packages

| Package                                           | Description                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@open-forge/pipeline`](packages/pipeline)       | An OpenCode plugin that turns natural language requirements into a fully built application — autonomously, with minimal human intervention |
| [`@open-forge/mcp`](packages/mcp)                 | MCP server implementation for OpenSpec archives                                                                                            |
| [`@open-forge/telemetry`](packages/telemetry)     | Telemetry and constraint evaluation for open-forge pipeline stages                                                                         |
| [`@open-forge/evaluations`](packages/evaluations) | Evaluation framework for measuring agent output quality, regression detection, and statistical analysis                                    |

## Architecture Overview

Open Forge is an autonomous software development pipeline. You give it a description of what you want built, and it runs a multi-phase agent workflow to produce working code with quality enforcement at every step.

```
Requirements (text)
       │
       ▼
┌─────────────┐
│ Intent Router│ ── Classifies: new-project / feature / bug-fix / refactor / migration
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ ROADMAP Gen  │ ── Produces phased, dependency-ordered task plan
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ Pipeline Orchestrator (per phase)                 │
│                                                   │
│  1. Read HANDOFF.md (restore context)             │
│  2. Generate & select plan (critic agent)         │
│  3. Write tests (test author — firewalled)        │
│  4. Implement (implementer — firewalled)          │
│  5. Quality gates (verify → QA → security →       │
│     architect → code review → integration)        │
│  6. Cleanup agent (entropy management)            │
│  7. Update HANDOFF.md (persist context)           │
│                                                   │
│  On failure: retry up to 3x → drift sentinel     │
│  On success: advance to next phase                │
├──────────────────────────────────────────────────┤
│ ⚡ Telemetry (@open-forge/telemetry)              │
│                                                   │
│  • Captures structured events from every stage    │
│  • Evaluates constraints (token budget, retries,  │
│    duration limits) after each stage              │
│  • Halts pipeline on constraint violations        │
│  • Generates audit trails for human review        │
└──────────────────────────────────────────────────┘
       │
       ▼
  ROADMAP_COMPLETE (or PIPELINE-ISSUES.md for blockers)
       │
       ▼
┌──────────────────────────────────────────────────┐
│ 📊 Evaluations (@open-forge/evaluations)         │
│                                                   │
│  • Runs datasets against agent outputs            │
│  • Deterministic, LLM-judge, and custom evals    │
│  • Statistical analysis (confidence intervals,    │
│    significance testing, regression detection)    │
│  • Baseline vs candidate comparison reports       │
│  • Consumes telemetry events + constraint results │
│  • CLI and programmatic API                       │
└──────────────────────────────────────────────────┘
```

### Key Design Principles

- **Context firewalls** — The test-writing agent and the implementing agent are deliberately isolated from each other to prevent hallucination reinforcement
- **Self-correction loops** — When quality gates fail, the system retries up to 3x before escalating to a human via `PIPELINE-ISSUES.md`
- **Drift detection** — If an agent gets stuck in a loop, a sentinel file is written and execution halts rather than burning tokens
- **Constraint enforcement** — Telemetry evaluates token budgets, retry limits, and duration caps after every stage, providing a hard stop before costs spiral
- **Lessons feedback** — Recurring mistakes from gate failures are captured in `LESSONS.md` and fed to future agents
- **Evaluation-driven quality** — Post-pipeline evaluation measures agent output quality with statistical rigor, enabling regression detection and data-driven decisions on model/prompt changes

For the full design — including context firewall rules, gate sequences, and guardrails — see the [pipeline REQUIREMENTS.md](packages/pipeline/REQUIREMENTS.md). For telemetry constraint definitions, see the [telemetry requirements](docs/open-forge-telemetry-REQUIREMENTS.md). For evaluation framework details, see the [evaluations requirements](docs/open-forge-evaluations-REQUIREMENTS.md).

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npx nx run-many -t build

# Run tests
npx nx run-many -t test

# Lint all projects
npx nx run-many -t lint

# Visualize the project graph
npx nx graph
```

## Useful Commands

```bash
npx nx graph                          # Interactive dependency graph
npx nx show project <name> --web      # View project details
npx nx run-many -t build              # Build all projects
npx nx run-many -t test --parallel=3  # Test in parallel
npx nx affected -t build              # Build only affected projects
npx nx release --dry-run              # Preview release changes
npx nx release                        # Create a new release
```

## Nx Cloud

This workspace is connected to [Nx Cloud](https://nx.dev/ci/intro/why-nx-cloud) for remote caching, distributed task execution, and self-healing CI.
