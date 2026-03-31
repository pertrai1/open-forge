## Context

Phase 0 produced the project skeleton with empty placeholder files. All downstream modules (Phases 2–10) depend on stable type contracts defined here. These types model the core domain: ROADMAP structures, HANDOFF state, pipeline execution, quality gates, metrics/observability, orchestrator routing, and validated configuration.

The REQUIREMENTS.md defines the shapes explicitly — this phase codifies them as TypeScript interfaces and Zod schemas. There is no existing type infrastructure beyond empty files.

## Goals / Non-Goals

**Goals:**

- Establish the complete type contract surface for all pipeline modules
- Use pure TypeScript interfaces (zero runtime cost) for domain types
- Use Zod schemas only at system boundaries (config validation)
- Infer TypeScript types from Zod schemas where applicable (`z.infer`)
- Ensure all types are independently importable per module (no circular deps)
- Write tests that validate Zod schema parsing and type assignability

**Non-Goals:**

- Runtime validation logic beyond config schema (that's Phase 2+)
- Implementation of any functions or methods — only type definitions
- Generic/reusable utility types — only domain-specific types
- Re-exporting all types from a barrel file — each module owns its types

## Decisions

### 1. Interfaces for domain shapes, literal union types for enums

Use `interface` for object shapes and `type` literals for finite sets. No TypeScript `enum` keyword.

**Why**: Interfaces are extendable and merge-able. Literal unions are exhaustive-checkable and tree-shake better than enums. Matches the project's code style in AGENTS.md.

**Alternative considered**: TypeScript `enum` — rejected because it generates runtime code and doesn't align with project conventions.

### 2. One type file per module, not a central types barrel

Each module (`roadmap/`, `handoff/`, `quality/`, etc.) owns its `types.ts`. `src/types.ts` holds only pipeline-level types that cross module boundaries.

**Why**: Prevents circular imports. Downstream modules import only what they need. Matches the package structure in ROADMAP.md.

**Alternative considered**: Single `src/types/index.ts` barrel — rejected because it couples all modules and creates import cycles as the codebase grows.

### 3. Zod only for config schema, not for domain types

Only `src/lib/config/schema.ts` uses Zod. All other type files are pure TypeScript interfaces.

**Why**: Domain types (Phase, Task, GateResult) are internal contracts — they don't need runtime validation. Config is the only system boundary in this phase (user-provided JSON). Using Zod everywhere would add unnecessary runtime overhead and coupling.

**Alternative considered**: Zod schemas for all types with `z.infer` — rejected because domain types are consumed internally and validated structurally by TypeScript's type system.

### 4. Task complexity as a literal union, not a numeric scale

`TaskComplexity = 'trivial' | 'simple' | 'medium' | 'complex'` rather than numeric levels.

**Why**: REQUIREMENTS.md defines exactly four complexity tiers with specific criteria. Literal strings are self-documenting and exhaustive-matchable in switch/if chains.

### 5. ExecutionMode as a literal union matching CLI flags

`ExecutionMode = 'single-phase' | 'continuous' | 'range'` — directly mirrors the CLI `--phase`, default, and range modes.

**Why**: 1:1 mapping between CLI interface and internal type prevents translation bugs.

### 6. Gate names as a typed literal union, not free-form strings

`GateName = 'verify' | 'qa' | 'security' | 'architect' | 'code-review' | 'integration'` — the six gates are fixed by spec.

**Why**: The gate sequence is defined in REQUIREMENTS.md and unlikely to change. A literal union enables exhaustive matching in the gate sequencer (Phase 6).

### 7. ForgeConfigSchema uses `.optional()` for all fields with sensible defaults

All config fields are optional. The config loader (Phase 10) will merge layered configs and apply defaults.

**Why**: Config is layered (plugin defaults → global → project). Any field can be absent at any layer. Making all fields optional keeps the schema honest about what users actually provide.

## Risks / Trade-offs

**Types may need revision as implementation reveals gaps** → Accepted. Types are cheap to extend. Interfaces can gain optional fields without breaking existing consumers. We'll add fields as needed in later phases rather than speculating now.

**No runtime validation for domain types** → Mitigated by TypeScript strict mode. Domain types are only constructed internally — external input goes through Zod (config) or parsers (ROADMAP.md text, Phase 2).

**WakeContext duplicates some HandoffState fields** → Intentional. WakeContext is a summary struct for session handoff messages, not a subset of HandoffState. They may diverge as the orchestrator evolves.
