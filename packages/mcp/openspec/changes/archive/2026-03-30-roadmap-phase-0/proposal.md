# Proposal: Phase 0 - Project Foundation

## Why

This phase establishes the foundational development environment, project structure, and testing infrastructure for the OpenSpec MCP Server project. Without this foundation, subsequent phases cannot proceed with implementing the MCP server, resources, tools, and prompts.

The project currently has no build system, package configuration, testing framework, or development tooling. This phase addresses all these gaps to enable autonomous development through the remaining phases.

## What Changes

This phase creates the complete project foundation from scratch:

1. **NodeJS Project Initialization**: Create `package.json` with TypeScript, MCP SDK, Vitest, ESLint, Prettier dependencies. Configure npm scripts for common development tasks (build, test, lint, typecheck).

2. **TypeScript Configuration**: Set up `tsconfig.json` with strict mode, ESM module resolution (`"module": "NodeNext"`), ES2022+ target, and explicit return types.

3. **Testing Infrastructure**: Configure Vitest as Create `vitest.config.ts` and a sample passing test to verify the test framework is correctly configured.

4. **Directory Structure**: Create `src/` for source code and `tests/` for test files, following the structure defined in ROADMAP.md.

5. **Code Quality Tooling**: Add ESLint for linting and Prettier for code formatting with appropriate rules for TypeScript.

6. **MCP SDK Integration**: Install `@modelcontextprotocol/sdk` as the core dependency for building the MCP server.

## Capabilities

### New Capabilities

No new capabilities are introduced in this phase. This phase focuses solely on project infrastructure and tooling setup.

### Modified Capabilities

No existing capabilities to modify. This is the first phase of development.

## Impact

**Affected Systems:**
- Project root: New configuration files (`package.json`, `tsconfig.json`, `vitest.config.ts`, `.eslintrc.js`, `.prettierrc`)
- Source code: New `src/` directory (initially empty or with placeholder)
- Tests: New `tests/` directory with sample test
- Dependencies: `node_modules/` populated with TypeScript, Vitest, MCP SDK, ESLint, Prettier

**Enables:**
- Phase 1: Basic MCP Server (can now compile and run TypeScript code)
- Phase 2-9: All subsequent phases (depend on working build/test infrastructure)

**Constraints Established:**
- ESM module system with `.js` extension in imports
- Strict TypeScript mode (no `any`, explicit types)
- Vitest as testing framework
- Test-first development workflow
- Code quality gates (lint + typecheck + test + build)
