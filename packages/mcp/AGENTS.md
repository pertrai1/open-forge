# AGENTS.md — Coding Agent Guide for OpenSpec MCP Server

## Project

TypeScript MCP server exposing OpenSpec archives as resources/tools. Progressive disclosure — agents discover, search, and read specs without loading everything.

**Stack**: TypeScript / Node.js | **Interface**: MCP Server (stdio) | **Testing**: Vitest

## Commands

```bash
npm run test                                   # All tests
npm run test -- tests/path/to/test.test.ts     # Single test file
npm run test -- -t "test name pattern"         # Single test by name
npm run check                                  # lint + typecheck + test + build
```

## Project Structure

```
src/
  index.ts              # Entry point, stdio transport
  server.ts             # MCP server instance & capabilities
  config.ts             # Path resolution for ./openspec/
  specs/                # Spec handling (reader, searcher, extractors)
  handlers/             # MCP resource handlers
  tools/                # MCP tools (schema.ts + handler.ts per tool)
tests/                  # Mirror src/ structure, suffix: .test.ts
openspec/               # Data directory (specs/, changes/, config.yaml)
scripts/                # roadmap-helper.sh, roadmap-loop.sh
```

## Constraints

### DO NOT
- Suppress type errors (`as any`, `@ts-ignore`, `@ts-expect-error`)
- Catch and swallow errors silently
- Commit without explicit request
- Use `import type` for runtime values
- Implement a scenario before its unit test exists
- Work on scenarios without a failing test proving the need

### MUST
- Write unit tests BEFORE implementing any scenario
- Use `.js` extension in imports for ESM: `import { x } from './module.js'`
- Group imports: built-ins → external → internal
- Return structured errors for MCP tools: `{ isError: true, content: [...] }`
- Resolve paths relative to `./openspec/` in project root

### Test-First Workflow
Each phase has small, atomic, logically grouped items. For each scenario:
1. Write a failing unit test that defines expected behavior
2. Run test to confirm it fails for the right reason
3. Implement minimal code to make test pass
4. Refactor if needed (test still passes)

### When Blocked
If stuck for >5 minutes or after 3 failed fix attempts:
1. **STOP** — don't silently work around issues
2. Fill out `PIPELINE-ISSUES.md` with exact errors, context, and what you need
3. Wait for human resolution before proceeding

### Documentation During Execution
- **Per-phase**: Fill out phase section in `PIPELINE-LOG.md` (timestamps, what worked, challenges, fix attempts)
- **At completion**: Fill out Summary Metrics and Pipeline Insights in `PIPELINE-LOG.md`
- This data is critical for improving the autonomous pipeline

## Patterns

### Path Resolution
```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OPENSPEC_PATH = path.join(PROJECT_ROOT, 'openspec');
```

### MCP Tool Output
```typescript
// Success
{ results: [...], query: "bash", total: 1 }

// Error
{ isError: true, content: [{ type: 'text', text: 'Error message' }] }
```

## Edge Cases

| Case | Response |
|------|----------|
| Spec folder without `spec.md` | Error: "Spec file not found: {name}" |
| Missing Purpose section | Description: "No description available" |
| Empty changes directory | `{"changes": [], "total": 0}` |
| Empty search query | Error: "Query parameter required" |
| Path traversal in spec name | Error: "Invalid spec name" |

## Key Decisions

- **Path**: `./openspec/` relative to project root
- **URI Schemes**: `spec://` for specs, `changes://` for history
- **MIME Types**: `text/markdown` for all spec content
- **Testing**: Required for each phase
