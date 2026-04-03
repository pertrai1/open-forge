# Design: Phase 0 - Project Foundation

## Context

This is the first phase of the OpenSpec MCP Server project. Currently, there is no project structure, build system, or development tooling. The project exists only as documentation files (ROADMAP.md, REQUIREMENTS.md, AGENTS.md).

**Current State:**
- Documentation files present (ROADMAP.md, REQUIREMENTS.md, AGENTS.md, PIPELINE-ISSUES.md)
- OpenSpec structure initialized (openspec/ directory with config.yaml)
- No source code, tests, or build configuration

**Stakeholders:**
- Development agents executing the ROADMAP loop
- End users who will install and run the MCP server

## Goals / Non-Goals

**Goals:**
- Create a working TypeScript development environment
- Enable test-first development workflow
- Establish code quality tooling (lint, format, typecheck)
- Install MCP SDK dependency for Phase 1

**Non-Goals:**
- Implementing any MCP server functionality (Phase 1+)
- Creating production-ready distribution (Phase 9)
- Advanced tooling beyond basic lint/format/test

## Decisions

### 1. Package Manager: npm

**Decision:** Use npm as the package manager.

**Rationale:** 
- Standard Node.js package manager
- No need for Yarn or pnpm complexity
- Works with all CI/CD systems

**Alternatives Considered:**
- pnpm: More efficient but adds complexity
- Yarn: Similar to npm, no compelling advantage

### 2. TypeScript Configuration

**Decision:** Use strict mode with ESM modules (`"module": "NodeNext"`).

**Rationale:**
- Strict mode catches more errors at compile time
- ESM is the modern standard for Node.js
- Required for MCP SDK compatibility

**Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### 3. Testing Framework: Vitest

**Decision:** Use Vitest for testing.

**Rationale:**
- Fast, modern test framework
- Native TypeScript support
- Compatible with Jest API (easy migration if needed)
- Good watch mode and UI

**Alternatives Considered:**
- Jest: Slower, requires more configuration
- Mocha: More manual setup required

### 4. Linter: ESLint + Prettier

**Decision:** Use ESLint for linting and Prettier for formatting.

**Rationale:**
- Industry standard combination
- TypeScript support via @typescript-eslint
- Automatic code formatting

**Configuration:**
- ESLint with TypeScript parser
- Prettier with 2-space indent, single quotes, trailing commas

### 5. Module System: ESM with .js Extensions

**Decision:** Use ESM modules with explicit `.js` extensions in imports.

**Rationale:**
- Required for NodeNext module resolution
- Explicit file extensions avoid ambiguity
- Works with both TypeScript and runtime Node.js

**Example:**
```typescript
import { foo } from './bar.js';  // Correct
import { foo } from './bar';      // Wrong - will fail at runtime
```

### 6. Directory Structure

**Decision:** Use flat `src/` and `tests/` directories initially.

**Rationale:**
- Start simple, restructure as needed
- Tests mirror src structure
- Matches ROADMAP.md specification

**Structure:**
```
openspec-mcp/
├── src/           # Source code
├── tests/         # Test files (*.test.ts)
├── dist/          # Compiled output (gitignored)
└── node_modules/  # Dependencies (gitignored)
```

## Risks / Trade-offs

### Risk: Over-configuration
**Risk:** Spending too much time on tooling configuration instead of implementation.
**Mitigation:** Use minimal sensible defaults. Adjust in later phases if needed.

### Risk: Version conflicts
**Risk:** Dependency version conflicts between TypeScript, ESLint, and other tools.
**Mitigation:** Use latest stable versions. Pin versions in package.json.

### Risk: ESM compatibility
**Risk:** Some packages may not support ESM properly.
**Mitigation:** Test imports early. Use `require()` fallback only if necessary.

## Migration Plan

Not applicable - this is a greenfield project.

## Open Questions

None. This phase uses standard Node.js/TypeScript patterns with no ambiguity.
