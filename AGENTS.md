# Open Forge — Agent Instructions

## Mandatory: Read This First

**All code changes must follow this sequence — no skipping steps:**

| Step | Phase    | Action                                   | Verify                                                                            |
| ---- | -------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | TYPES    | Define types in `types.ts` or co-located | `npx nx affected -t build` passes                                                 |
| 2    | RED      | Write ONE failing test                   | Test fails                                                                        |
| 3    | GREEN    | Write minimum code to pass               | New test passes, all existing tests still pass, `npx nx affected -t build` passes |
| 4    | REFACTOR | Clean up if needed                       | All tests still pass                                                              |
| 5    | GATES    | Run quality gates                        | `npx nx affected -t build,test,lint`                                              |
| 6    | COMMIT   | Atomic commit                            | One behavior per commit                                                           |

**Steps 2–6 repeat for each behavior. Do not batch multiple behaviors into one cycle.**

**No skipping steps. No exceptions.**

See [TYPE_DRIVEN_DEVELOPMENT](.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md) and [TEST_DRIVEN_DEVELOPMENT](.agents/directives/TEST_DRIVEN_DEVELOPMENT.md) for detailed guidance.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20+
- **Build**: tsc (composite projects via Nx)
- **Test**: Vitest
- **Lint**: ESLint (flat config) + Prettier
- **Monorepo**: Nx with inferred targets
- **CI**: GitHub Actions + Nx Cloud

## Commands

All commands run through Nx. Never call the underlying tool directly.

```bash
npx nx build <project>              # Build a single project
npx nx test <project>               # Test a single project
npx nx lint <project>               # Lint a single project
npx nx affected -t build,test,lint  # Run gates on affected projects only
npx nx run-many -t build,test,lint  # Run gates on all projects
```

## Conventions

- **Module format**: ESM (`"type": "module"` in all packages)
- **Imports**: Use `.js` extension in relative imports (ESM requirement)
- **Types**: Co-locate in `types.ts` per module, export from `index.ts`
- **Tests**: Place in `tests/` directory at package root, named `*.test.ts`
- **One behavior per commit**: If there's no `test:` commit before a `feat:` commit, the RED phase was skipped

## Forbidden Patterns

| Pattern                             | Why                                      |
| ----------------------------------- | ---------------------------------------- |
| `any` type                          | Defeats type safety                      |
| `as any` cast                       | Hides type errors instead of fixing them |
| `@ts-ignore` / `@ts-expect-error`   | Suppresses real problems                 |
| `Function` type                     | Too permissive, no contract              |
| `it.skip()` / `describe.skip()`     | Skipping tests defeats TDD               |
| `// TODO: write test later`         | No test = no implementation              |
| Implementing without a failing test | Violates core TDD principle              |
| `expect(true).toBe(true)`           | Fake test, no constraint                 |
| Empty `catch` blocks                | Swallows errors silently                 |
| Throwing without typed error        | Hides failure modes from callers         |

## Skills (Mandatory)

**You MUST load and follow the relevant skill before performing any task it covers. These are not optional guidelines.**

| Skill         | When                                 | File                                                                 |
| ------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Test Reviewer | Before writing or reviewing any test | [`.agents/skills/test-reviewer.md`](.agents/skills/test-reviewer.md) |

---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
