## Context

This is Phase 0 of the OpenForge Pipeline implementation — the foundational setup that must be completed before any actual feature development begins. The project is a TypeScript/Node.js CLI tool that will be distributed as an npm package and also function as an OpenCode plugin.

**Current State**: Empty repository with only documentation files (README.md, REQUIREMENTS.md, ROADMAP.md).

**Constraints**:

- Must support Node.js 20+ (per ROADMAP.md)
- Must use TypeScript with strict mode
- Must enable parallel development by multiple subagents
- Must follow the directory structure defined in ROADMAP.md

**Stakeholders**: Developers implementing subsequent phases (1-12) who need a stable, well-configured foundation.

## Goals / Non-Goals

**Goals:**

- Create a fully functional Node.js project with all dependencies installed
- Configure TypeScript with strict type checking for maximum code safety
- Set up Vitest as the testing framework with a passing sample test
- Establish the complete directory structure to enable parallel development
- Configure ESLint and Prettier for consistent code quality
- Provide template files that will be used by the pipeline at runtime

**Non-Goals:**

- Writing any implementation code (that starts in Phase 1)
- Setting up CI/CD pipelines (Phase 12)
- Creating example projects (Phase 12)
- Writing comprehensive documentation beyond template files
- Configuring the plugin entry point (Phase 10)

## Decisions

### 1. TypeScript Configuration Strategy

**Decision**: Use `tsconfig.json` with `strict: true`, `target: ES2022`, `module: NodeNext`, and `moduleResolution: NodeNext`.

**Rationale**:

- `strict: true` enables all strict type-checking options, catching bugs at compile time
- `ES2022` target aligns with Node.js 18+ support (Node 18 has full ES2022 support)
- `NodeNext` module resolution is the modern standard for Node.js TypeScript projects and properly handles ESM/CJS interop
- Source maps enabled for better debugging experience

**Alternatives Considered**:

- `target: ES2020` — Rejected: Node 18+ supports ES2022, no reason to target older
- `module: CommonJS` — Rejected: NodeNext is the modern recommendation for new projects
- Lerna/Nx monorepo setup — Rejected: Overkill for a single package

### 2. Testing Framework Selection

**Decision**: Use Vitest instead of Jest.

**Rationale**:

- Vitest is significantly faster than Jest (especially with TypeScript)
- Native ESM support without complex configuration
- Built-in TypeScript support via esbuild
- Jest-compatible API eases learning curve
- Better watch mode performance

**Alternatives Considered**:

- Jest — Rejected: Slower, more complex configuration for ESM/TypeScript
- Mocha — Rejected: Requires more setup, less modern DX
- Node:test — Rejected: Less feature-rich, newer ecosystem

### 3. Directory Structure Approach

**Decision**: Create all directories upfront with `.gitkeep` files in empty directories.

**Rationale**:

- Enables parallel development — agents can immediately find and use the correct locations
- Prevents "where should this file go?" decisions during implementation
- Git tracks empty directories via `.gitkeep`
- Matches the comprehensive structure defined in ROADMAP.md

**Structure**:

```
src/
├── index.ts              # Plugin entry (Phase 10)
├── cli.ts                # CLI entry (Phase 10)
├── types.ts              # Shared types (Phase 1)
├── commands/             # CLI commands (Phase 10)
└── lib/                  # Core libraries (Phases 1-9)
    ├── roadmap/
    ├── handoff/
    ├── helper/
    ├── orchestrator/
    ├── execution/
    ├── quality/
    ├── firewall/
    ├── gates/
    ├── lessons/
    ├── entropy/
    ├── completion/
    ├── clarification/
    ├── observability/
    ├── planning/
    ├── config/
    └── metrics/
```

### 4. Linting and Formatting Setup

**Decision**: Use ESLint with `@typescript-eslint` plugin and Prettier with minimal configuration.

**Rationale**:

- ESLint catches code quality issues beyond formatting
- TypeScript ESLint provides TypeScript-specific rules
- Prettier handles formatting automatically
- Separation of concerns: ESLint for quality, Prettier for style

**Configuration**:

- ESLint: Recommended rules + TypeScript recommended
- Prettier: Semi-colons, single quotes, trailing commas (ES5 compatible)

**Alternatives Considered**:

- Biome (formerly Rome) — Rejected: Less mature ecosystem, fewer IDE integrations
- ESLint only — Rejected: Formatting rules in ESLint are deprecated in favor of Prettier
- No linter — Rejected: Quality gates require linting to pass

### 5. Template File Strategy

**Decision**: Create template files with placeholder syntax that the pipeline will populate.

**Templates**:

- `ROADMAP.template.md` — Markdown structure for phased task lists
- `HANDOFF.template.md` — Session state persistence format
- `forge.config.template.json` — Default pipeline configuration

**Rationale**:

- Templates provide consistent structure for generated files
- Users can customize templates before running the pipeline
- Templates are documentation of expected file formats

### 6. Package.json Scripts

**Decision**: Define scripts for all common development tasks.

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

**Rationale**:

- `build` compiles TypeScript to JavaScript in `dist/`
- `test` runs Vitest in CI mode (single run)
- `test:watch` for development
- `lint` catches code quality issues
- `format` auto-formats code
- `typecheck` validates types without emitting files (useful for CI)

## Risks / Trade-offs

### Risk: Over-configuration → Mitigation: Minimal defaults

**Risk**: Spending too much time perfecting configurations instead of moving to implementation.
**Mitigation**: Use sensible defaults from established projects. Configuration can be refined in later phases if needed.

### Risk: Dependency version conflicts → Mitigation: Use caret ranges

**Risk**: Strict dependency versions may cause conflicts as the project evolves.
**Mitigation**: Use caret ranges (`^`) for dependencies to allow minor version updates. Lock file will ensure reproducible builds.

### Risk: Directory structure changes → Mitigation: Follow ROADMAP.md exactly

**Risk**: The directory structure might need to change as implementation reveals requirements.
**Mitigation**: The ROADMAP.md structure was designed with full knowledge of the architecture. Trust it and create the full structure now.

### Risk: Template files become stale → Mitigation: Version templates with code

**Risk**: Templates might diverge from actual implementation needs.
**Mitigation**: Templates are versioned with the codebase. Update them as part of the normal development workflow.

### Trade-off: Full structure vs. Just-in-time creation

**Trade-off**: Creating all directories upfront means some will remain empty for many phases.
**Benefit**: Enables parallel development and eliminates "where does this go?" decisions.
**Cost**: Slightly more complex initial setup.
**Decision**: Accept the trade-off — the benefit for parallel development outweighs the cost.

## Migration Plan

N/A — This is initial setup, no migration required.

## Open Questions

None — The requirements and roadmap provide sufficient clarity for this phase. All decisions are straightforward and low-risk.
