# OpenForge Pipeline

> **Status: Pre-development** — The design is documented in [REQUIREMENTS.md](./REQUIREMENTS.md), but no code has been written yet. Now is the best time to influence the architecture, challenge assumptions, and shape the direction of the project.

An OpenCode plugin that turns natural language requirements into a fully built application — autonomously, with minimal human intervention.

## How It Works

You give it a description of what you want built (plain text requirements), and it runs an automated software development pipeline:

1. **Analyzes your intent** — Figures out if you want a new project, a feature, a bug fix, a refactor, or a migration
2. **Creates a ROADMAP** — Breaks the work into phased, dependency-ordered tasks with parallel groups
3. **Executes autonomously** — Agents implement each phase: writing specs, tests (test-first), then code
4. **Enforces quality** — Six sequential gates (verification, QA, security audit, architecture review, code review, integration testing) must all pass before a phase is complete
5. **Persists context** — A `HANDOFF.md` file bridges context between sessions so work can be interrupted and resumed without losing state

## Why This Project Matters

Most "chat with your codebase" tools focus on single-task execution. OpenForge Pipeline attempts something different — structured, multi-phase autonomous execution with quality gates and session persistence. Here's what makes this worth contributing to:

- **Context firewalls are a novel approach to agent reliability.** By deliberately isolating the test author from the implementer, we prevent a subtle but real failure mode: hallucination reinforcement. If one agent hallucinates a behavior while writing tests, it will hallucinate the same thing during implementation — the tests pass, but the code is wrong. Separating the two with information barriers breaks that cycle. This is something most agent orchestration tools ignore entirely.

- **Drift detection saves real money.** Rather than letting agents burn tokens in infinite retry loops, the sentinel file pattern gives you a hard stop with structured documentation of *why* it stopped and *what* the human needs to do. This is the kind of design born from painful experience with runaway agent costs.

- **The system actually learns within a project.** Most agent pipelines treat every run as independent. The lessons feedback loop captures recurring mistake patterns from quality gate failures and feeds them back into future agent invocations, so the same class of bug doesn't keep slipping through phase after phase.

- **There's nothing like this in open source.** The closest comparisons (Devin, SWE-agent) are either closed-source or focused on single-task execution. A fully open, multi-phase pipeline with autonomous quality enforcement and session persistence doesn't exist yet.

## Known Risks & Open Challenges

These are areas where the design may need to evolve based on real-world usage. If you're looking for high-impact contributions, start here:

- **Token cost could be brutal.** Six sequential quality gates, each with up to 3 retry cycles, plus a cleanup agent, plus a critic agent evaluating 3-5 plans — that's a lot of LLM invocations per phase. The cost manifest tracking is built in for a reason, but the default gate configuration may need to be more aggressive about skipping gates for simpler tasks. Tuning the complexity classification thresholds will be critical.

- **Plan selection via critic agent may produce convergent results.** The design calls for generating 3-5 implementation approaches and selecting the best via a critic agent. In practice, LLM-generated plans tend to converge toward similar solutions. Getting meaningfully different approaches will require very specific, divergent prompting — and that prompting strategy will need iteration.

- **Context firewalls are enforced by instructions, not code.** The separation between test author and implementer is enforced via skill file instructions, not programmatic access control. This is a pragmatic choice (programmatic enforcement would be far more complex), but agents can and do ignore instructions. Whether this matters depends on how critical the isolation is in practice — and that's something we'll only learn through usage.

## Key Design Principles

- **Context firewalls** — The test-writing agent and the implementing agent are deliberately isolated from each other to prevent confirmation bias (where tests are unconsciously written to match the planned implementation rather than challenge it)
- **Self-correction loops** — When quality gates fail, the system retries up to 3 times before escalating to a human via `PIPELINE-ISSUES.md`
- **Drift detection** — If an agent gets stuck in a loop, a sentinel file is written and execution halts rather than burning tokens infinitely
- **Lessons feedback** — Recurring mistakes from gate failures are captured in `LESSONS.md` and fed to future agents
- **Entropy management** — A cleanup agent runs after each phase to prevent documentation rot and dead code accumulation

## Architecture Overview

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
└──────────────────────────────────────────────────┘
       │
       ▼
  ROADMAP_COMPLETE (or PIPELINE-ISSUES.md for blockers)
```

**Key files the pipeline generates in your project:**

| File | Purpose |
|------|---------|
| `ROADMAP.md` | Phased execution plan with task dependencies |
| `HANDOFF.md` | Session context bridge (survives restarts) |
| `LESSONS.md` | Recurring mistake patterns from gate failures |
| `PIPELINE-METRICS.md` | Token usage, cost tracking, agent efficiency |
| `PIPELINE-ISSUES.md` | Blockers requiring human intervention |
| `forge.config.json` | Project-specific pipeline configuration |

For the full design — including context firewall rules, gate sequences, handoff structure, and guardrails — see [REQUIREMENTS.md](./REQUIREMENTS.md).

## Installation

Distributed as an npm package (`open-forge-pipeline`). Can be installed globally or run via `npx`. Also registers as an OpenCode plugin by adding it to your `opencode.json` config (global or project-level).

Detailed installation and setup instructions will be added once the first release is available.

## Usage

The pipeline is controlled through CLI commands and OpenCode slash commands:

| Command | Description |
|---------|-------------|
| `init` | Initialize a new project from a requirements file |
| `plan` | Generate a ROADMAP without executing it |
| `run` | Execute the ROADMAP (all phases, a single phase, or a range) |
| `status` | Show current pipeline progress |
| `resume` | Resume from the last checkpoint after an interruption |

## Configuration

Project-specific settings are defined in `forge.config.json`, including language, framework, test framework, and build/test/lint commands. The plugin can also auto-detect settings from `package.json`, language files, and framework configs.

## Contributing

This project is in the design phase — contributions at every level are welcome:

- **Challenge the design** — Read [REQUIREMENTS.md](./REQUIREMENTS.md) and open an issue if something doesn't make sense or could be improved
- **Tackle an open challenge** — The [Known Risks & Open Challenges](#known-risks--open-challenges) section lists areas where the design needs real-world validation
- **Help build it** — Once implementation begins, the ROADMAP will have tasks tagged with complexity levels and dependency info

### Getting Started

1. Fork the repo
2. Read [REQUIREMENTS.md](./REQUIREMENTS.md) for the full design
3. Open an issue to discuss before submitting large changes
4. Follow existing patterns and conventions as the codebase develops

## Requirements

- OpenCode CLI
- Node.js 18+
- Git
- OpenSpec CLI (optional, for spec-driven workflow)

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Distribution**: npm package
- **Interface**: CLI + OpenCode Plugin

## License

MIT
