# AGENTS.md — open-forge-pipeline

> What agents can't infer from config files alone.

## Development Workflow: Spec-Driven TDD

All implementation follows this exact sequence. No step may be skipped, reordered, or combined:

1. **Spec first** — there MUST be a spec to work against. No code without a spec. If no spec exists, create or request one before writing any code.
2. **Scenarios from spec** — extract every testable scenario from the spec. Each scenario becomes a test case.
3. **Write failing tests** — write tests for the scenario BEFORE any implementation. Run the tests and confirm they FAIL. If a test passes before implementation, the test is wrong or the code already exists — investigate before proceeding.
4. **Implement to pass** — write the minimum code to make the failing tests pass. Do not write code that isn't required by a failing test.
5. **Verify** — run `npm run verify` (typecheck → lint → format → build → tests). ALL checks must pass. Do not proceed if verify fails.
6. **Commit** — commit atomically with a message referencing the scenario. One commit per scenario, not batched.
7. **Repeat** — move to the next scenario. Go to step 3.

**Enforcement checkpoints** — a task is NOT complete unless:
- Every scenario from the spec has a corresponding test
- Every test was observed failing before implementation
- `npm run verify` passes with zero errors
- Each scenario has its own atomic commit
- No implementation code exists without a test that exercises it

**If code already exists** (e.g., from a previous session): do NOT skip the workflow. Verify the existing code against the spec scenarios. If tests are missing, write them. If commits are missing, make them. Existing code does not exempt you from the workflow.

## Project Context

OpenCode plugin (npm package) that transforms natural language requirements into fully implemented applications via an autonomous agent pipeline. TypeScript/Node.js. **Pre-development stage** — most source code is yet to be written.

**Read first**: `REQUIREMENTS.md` (full design), `ROADMAP.md` (execution plan).

## Commands

```bash
npm run build              # tsc → dist/
npm run typecheck          # tsc --noEmit
npm run lint               # eslint src tests
npm run lint:fix           # eslint --fix
npm run format             # prettier --write
npm run format:check       # prettier --check
npm run verify             # ⚠️ MUST pass before every commit (typecheck + lint + format + build + tests)
npm run test               # ⚠️ runs typecheck + lint + format:check THEN vitest
npm run test:watch         # vitest watch mode
npm run test:coverage      # vitest --coverage

# Run tests WITHOUT pretest overhead:
npx vitest run

# Single test file:
npx vitest run tests/setup.test.ts

# Single test by name:
npx vitest run -t "should be true"
```

**Gotcha**: `npm run test` triggers `pretest` (typecheck + lint + format:check). Use `npx vitest run` when you only want tests.

## Code Style Examples

These conventions aren't caught by ESLint, Prettier, or TypeScript — agents must follow them manually.

### Imports

Use `.js` extension in relative imports (NodeNext requires it — tsc won't error until runtime). Group with blank lines between:

```typescript
// ✅ Good
import { readFile } from 'node:fs/promises';

import { z } from 'zod';
import { Command } from 'commander';

import { parseRoadmap } from './lib/roadmap/parser.js';
import type { PhaseState } from './types.js';

// ❌ Bad — missing .js, no grouping
import { readFile } from 'node:fs/promises';
import { parseRoadmap } from './lib/roadmap/parser';
import { z } from 'zod';
```

### Error Handling & Validation

```typescript
// ✅ Good — typed error, Zod at boundary
class RoadmapParseError extends Error {
  constructor(public readonly line: number, message: string) {
    super(`Line ${line}: ${message}`);
    this.name = 'RoadmapParseError';
  }
}

const PhaseInputSchema = z.object({
  name: z.string().min(1),
  tasks: z.array(z.string()),
});

function parsePhaseInput(raw: unknown): PhaseInput {
  return PhaseInputSchema.parse(raw);
}

// ❌ Bad — bare Error, any, swallowed catch
function parsePhase(data: any) {
  try {
    return JSON.parse(data);
  } catch (e) {}
}
```

### Types

```typescript
// ✅ Good — interface for shapes, type for unions, infer from Zod
interface GateResult {
  gate: string;
  passed: boolean;
  findings: string[];
}

type Intent = 'new-project' | 'feature-add' | 'bug-fix' | 'refactor' | 'migration';

const ForgeConfigSchema = z.object({ /* ... */ });
type ForgeConfig = z.infer<typeof ForgeConfigSchema>;

// ❌ Bad — as unknown as, type for plain object
type GateResult = { gate: any; passed: any };
const config = rawData as unknown as ForgeConfig;
```

### Naming

- Files: `kebab-case.ts` (e.g., `roadmap-parser.ts`)
- Types/Interfaces: `PascalCase` (e.g., `PhaseState`)
- Functions/variables: `camelCase` (e.g., `parseRoadmap`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)

### Testing

- Vitest globals are enabled — no need to import `describe`, `it`, `expect`
- Tests live in `tests/` mirroring `src/` structure

## Boundaries

### Always do
- Follow the spec-driven TDD workflow (spec → scenarios → failing tests → implement → commit)
- Commit atomically per passing scenario
- Use `.js` extension in relative imports
- Validate external input with Zod at system boundaries
- Use typed errors for domain-specific failures
- Infer types from Zod schemas where possible

### Ask first
- Adding new dependencies
- Changing package structure or module boundaries
- Modifying pipeline configuration schema

### Never do
- Use `any`, `as unknown as Foo`, `@ts-ignore`, or `@ts-expect-error`
- Swallow errors with empty catch blocks
- Throw bare `new Error()` for domain errors
- Modify test files from the implementer role (context firewall)

## Design Patterns

These are project-specific architectural decisions — read `REQUIREMENTS.md` for full detail.

- **Context firewalls**: Test author and implementer are deliberately isolated to prevent confirmation bias
- **Drift detection**: Sentinel files (`.pipeline-drift-sentinel`) halt execution after 3 failed retries
- **Session handoff**: `HANDOFF.md` bridges context between sessions
- **Quality gates**: 6 sequential gates (verify → QA → security → architect → code review → integration)
- **Lessons loop**: Recurring mistakes captured in `LESSONS.md` and fed to future agents
- **Entropy management**: Cleanup agent runs post-gates to prevent documentation rot

## Package Structure

```
src/
├── index.ts              # Entry point (exports)
├── cli.ts                # CLI entry (commander)
├── commands/             # CLI command handlers
├── lib/
│   ├── roadmap/          # ROADMAP parsing/generation
│   ├── handoff/          # Session context management
│   ├── helper/           # Agent bookkeeping utilities
│   ├── orchestrator/     # Session management, routing, execution
│   ├── quality/          # Quality gate runner
│   └── metrics/          # Pipeline metrics logging
└── types.ts              # Shared types
tests/                    # Mirrors src/ structure
templates/                # File templates
```
