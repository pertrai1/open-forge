# Test Driven Development Directive

## Prerequisite: Types Must Exist First

This directive is step 2 of the implementation pipeline:

```
1. Define types/interfaces     → TYPE_DRIVEN_DEVELOPMENT.md
2. Write tests against types   → this file (TDD)
3. Implement minimum code      → driven by failing tests
```

**Do not write tests until types are defined and verified with `npx nx affected -t build`.** Types constrain structure; tests constrain behavior. Together they force minimal, correct implementations.

---

## MANDATORY: Strict RED/GREEN TDD

After types are defined, you MUST follow strict Test-Driven Development. This is non-negotiable.

### The Cycle

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐     │
│  │  RED    │ ───▶ │  GREEN  │ ───▶ │ REFACTOR│     │
│  │         │      │         │      │         │     │
│  │ Write   │      │ Write   │      │ Clean   │     │
│  │ failing │      │ minimum │      │ up code │     │
│  │ test    │      │ code    │      │         │     │
│  └─────────┘      └─────────┘      └─────────┘     │
│       ▲                                  │         │
│       └──────────────────────────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## The Rules

### Rule 1: No Implementation Without a Failing Test

Before writing ANY implementation code:

1. Write a test that describes ONE behavior
2. Run the test — it MUST fail (RED)
3. Only then write implementation

### Rule 2: Write ONE Test at a Time

- Never write multiple tests before implementing
- One test = one behavior = one implementation cycle

### Rule 3: Write the MINIMUM Code to Pass

The GREEN phase is about making the test pass with the least code possible. If the test doesn't require it, don't implement it.

### Rule 4: Verify Types After GREEN

After making a test pass, verify the implementation still satisfies the type contract:

```bash
npx nx build <project>
```

If types fail, the implementation is wrong. Fix before continuing.

### Rule 5: Never Refactor During GREEN

1. RED — Write failing test
2. GREEN — Make it pass (may be ugly)
3. REFACTOR — Clean up while keeping test green
4. Commit AFTER REFACTOR, not after GREEN

### Rule 6: No Skipping RED

You cannot:

- Comment out tests to make them "pass"
- Write tests that always pass
- Skip the RED phase because "I know what to implement"

If the test doesn't fail, the cycle is invalid.

---

## Monorepo Workflow

### Running Tests

```bash
# Test a specific package
npx nx test <project>

# Test only affected packages (after changes)
npx nx affected -t test

# Test all packages
npx nx run-many -t test
```

### Scoping Your Cycle

In a monorepo, each RED/GREEN/REFACTOR cycle targets ONE package:

1. Write the failing test in the target package's `tests/` directory
2. Implement in the target package's `src/` directory
3. Run `npx nx test <project>` — not the entire workspace
4. Run `npx nx affected -t build,test,lint` before committing — catches cross-package breakage

### Cross-Package Changes

When a type change in package A affects package B:

1. Update types in package A (TYPE_DRIVEN_DEVELOPMENT)
2. Run `npx nx affected -t build` — identifies all affected packages
3. Fix any type errors in dependent packages BEFORE writing new tests
4. Then resume TDD in the target package

---

## The Workflow

### Step-by-Step Process

```
1. Types are defined (from TYPE_DRIVEN_DEVELOPMENT.md)

2. Pick ONE method/behavior to implement

3. RED Phase:
   - Write a test for that behavior
   - Run test: MUST fail
   - If it passes, the test is wrong — fix it

4. GREEN Phase:
   - Write minimum code to make test pass
   - Run all tests: MUST pass (new + existing)
   - Run type check: MUST pass

5. REFACTOR Phase (skip only if code is already clean):
   - Clean up implementation
   - Run all tests: MUST still pass

6. GATES — Run full quality gates before committing:
   npx nx affected -t build,test,lint
   All must pass. Fix failures before proceeding.

7. Commit AFTER GATES, not after GREEN

8. Return to step 2 for next behavior
```

---

## Commit Cadence

Commit AFTER GATES, not after GREEN. Small commits = easy to review, easy to revert.

```bash
git commit -m "test: failing test for telemetry emit event capture"
git commit -m "feat(telemetry): emit captures and persists pipeline events"
git commit -m "test: failing test for telemetry constraint evaluation"
git commit -m "feat(telemetry): constraint evaluator checks events against thresholds"
```

Use conventional commits with package scope for monorepo clarity.

---

## Forbidden Patterns

| Pattern                            | Why Forbidden                    |
| ---------------------------------- | -------------------------------- |
| `it.skip()`                        | Skipping tests defeats TDD       |
| `// TODO: write test later`        | No test = no implementation      |
| Implementing without test          | Violates core principle          |
| Copy-pasting tests to pass quickly | Tests must reflect real behavior |
| `expect(true).toBe(true)`          | Fake test, no constraint         |
| Writing test after implementation  | That's not TDD                   |
| Batch-writing all tests first      | One test at a time               |

---

## Why This Matters for LLM Agents

Without TDD, agents:

1. **Over-implement** — Solve problems you didn't ask about
2. **Over-abstract** — Build frameworks for simple features
3. **Guess intent** — Add features they think you might want
4. **Skip edge cases** — Or handle edge cases that don't exist
5. **Lose focus** — Drift into unrelated improvements

With strict TDD, the agent:

1. **Implements exactly** what the test requires
2. **Stops** when the test passes
3. **Moves** to the next failing test
4. **Cannot drift** — the test is the budget

---

## Quick Reference

| Phase    | Action                               | Must Be                         |
| -------- | ------------------------------------ | ------------------------------- |
| RED      | Write test                           | Failing                         |
| GREEN    | Write code                           | Minimum to pass, no regressions |
| REFACTOR | Clean up                             | All tests still pass            |
| GATES    | `npx nx affected -t build,test,lint` | All pass                        |
| COMMIT   | Atomic commit                        | One behavior per commit         |

---

_This directive is mandatory for all code changes after type definitions are complete._
