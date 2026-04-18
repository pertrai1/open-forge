## 1. Constraint Evaluator Implementation

- [x] 1.1 Implement `ConstraintEvaluatorImpl` class in `src/ConstraintEvaluatorImpl.ts` — constructor takes `StorageBackend`, maintains internal `Map<string, Constraint>` registry
- [x] 1.2 Implement `addConstraint()` — register or replace constraint by name in the registry
- [x] 1.3 Implement `removeConstraint()` — remove by name, no-op if not found
- [x] 1.4 Implement `evaluate()` — query all events for pipeline, iterate registered constraints, filter events by scope, run `check()`, collect violations into `ConstraintResult` with `evaluatedAt` timestamp
- [x] 1.5 Implement stage-scoped event filtering — for constraints with `scope: 'stage'`, group events by stage and call `check()` once per completed stage
- [x] 1.6 Implement severity mapping — default constraints use configured severity, custom constraints default to `'error'`

## 2. Default Constraints

- [x] 2.1 Implement `createMaxRetriesConstraint(maxRetries)` in `src/constraints/defaults.ts` — pipeline-scoped, counts `retry` actions, fails when count exceeds threshold
- [x] 2.2 Implement `createTokenBudgetConstraint(maxTokens)` in `src/constraints/defaults.ts` — pipeline-scoped, sums `tokenUsage.prompt + tokenUsage.completion`, fails when total exceeds budget
- [x] 2.3 Implement `createDurationConstraint(maxDurationMs)` in `src/constraints/defaults.ts` — stage-scoped, checks `durationMs` on `complete` events, fails when any stage exceeds limit
- [x] 2.4 Implement `createConsecutiveFailuresConstraint(maxConsecutive)` in `src/constraints/defaults.ts` — pipeline-scoped, counts consecutive `fail` actions without intervening `complete`, resets counter on success
- [x] 2.5 Implement `createLintViolationsConstraint(maxViolations)` in `src/constraints/defaults.ts` — pipeline-scoped, sums `metadata.lintViolations` across events, fails when total exceeds limit
- [x] 2.6 Implement `createDefaultConstraints(options?)` — returns array of all 5 constraints with overridable thresholds and sensible defaults

## 3. Constraint Builder Utilities

- [x] 3.1 Implement `threshold(options)` in `src/constraints/builder.ts` — accepts `name`, `value`, `operator` (`gt`/`gte`/`lt`/`lte`/`eq`), `extract` function, optional `scope` (defaults to `'pipeline'`), returns `Constraint`
- [x] 3.2 Implement `boolean(options)` in `src/constraints/builder.ts` — accepts `name`, `assert` function, optional `scope`, returns `Constraint`
- [x] 3.3 Implement `aggregation(options)` in `src/constraints/builder.ts` — accepts `name`, `fn` (`sum`/`count`/`avg`), `extract` function, `value`, `operator`, optional `scope`, returns `Constraint`; handles empty events (sum=0, count=0, avg=0)

## 4. Exports

- [x] 4.1 Export `ConstraintEvaluatorImpl` from `src/index.ts`
- [x] 4.2 Export all default constraint factory functions from `src/index.ts`
- [x] 4.3 Export builder functions (`threshold`, `boolean`, `aggregation`) from `src/index.ts`

## 5. Tests

- [x] 5.1 Write tests for `ConstraintEvaluatorImpl` in `tests/constraints.test.ts` — constructor, addConstraint, removeConstraint, evaluate with passing/failing/empty constraints, scope filtering, severity mapping
- [x] 5.2 Write tests for default constraints — each of the 5 factories (pass/fail/boundary cases), `createDefaultConstraints` with and without options
- [x] 5.3 Write tests for builder utilities — threshold with all operators, boolean pass/fail, aggregation with sum/count/avg, scope defaults, empty events handling
- [x] 5.4 Write performance test — verify `evaluate()` completes under 50ms with 10 constraints and 1000 events
