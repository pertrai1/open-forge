# default-constraints Specification

## Purpose

Defines the pre-built constraint implementations for common agent pipeline guardrails: max-retries, token-budget, duration, consecutive-failures, and lint-violations. These provide out-of-the-box safety constraints that require zero configuration.

## Requirements

### Requirement: createMaxRetriesConstraint creates a retry limit constraint

The `createMaxRetriesConstraint(maxRetries)` function SHALL return a `Constraint` that fails when the number of `retry` actions in events exceeds `maxRetries`. The constraint SHALL have pipeline scope.

#### Scenario: Retries within limit

- **WHEN** events contain 2 `retry` actions and `maxRetries` is 3
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Retries exceed limit

- **WHEN** events contain 4 `retry` actions and `maxRetries` is 3
- **THEN** the constraint SHALL return `passed: false`
- **AND** the message SHALL indicate the actual retry count and the threshold

#### Scenario: Zero retries with non-zero limit

- **WHEN** events contain no `retry` actions and `maxRetries` is 3
- **THEN** the constraint SHALL return `passed: true`

### Requirement: createTokenBudgetConstraint creates a token budget constraint

The `createTokenBudgetConstraint(maxTokens)` function SHALL return a `Constraint` that fails when the total tokens (prompt + completion) across all events exceed `maxTokens`. The constraint SHALL have pipeline scope.

#### Scenario: Tokens within budget

- **WHEN** events contain a total of 5000 tokens and `maxTokens` is 10000
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Tokens exceed budget

- **WHEN** events contain a total of 12000 tokens and `maxTokens` is 10000
- **THEN** the constraint SHALL return `passed: false`
- **AND** the message SHALL indicate the actual token count and the budget

#### Scenario: Events without tokenUsage

- **WHEN** events have no `tokenUsage` fields
- **THEN** the constraint SHALL count zero tokens and return `passed: true`

### Requirement: createDurationConstraint creates a stage duration constraint

The `createDurationConstraint(maxDurationMs)` function SHALL return a `Constraint` that fails when any single stage's duration exceeds `maxDurationMs`. The constraint SHALL have stage scope.

#### Scenario: Stage duration within limit

- **WHEN** a stage has `durationMs: 5000` and `maxDurationMs` is 10000
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Stage duration exceeds limit

- **WHEN** a stage has `durationMs: 15000` and `maxDurationMs` is 10000
- **THEN** the constraint SHALL return `passed: false`
- **AND** the message SHALL indicate the stage name, actual duration, and the limit

#### Scenario: Event without durationMs

- **WHEN** a stage's completion event has no `durationMs` field
- **THEN** the constraint SHALL skip that event and not count it as a violation

### Requirement: createConsecutiveFailuresConstraint creates a consecutive failure constraint

The `createConsecutiveFailuresConstraint(maxConsecutive)` function SHALL return a `Constraint` that fails when a sequence of consecutive `fail` actions (without an intervening `complete`) exceeds `maxConsecutive`. The constraint SHALL have pipeline scope.

#### Scenario: Failures below threshold

- **WHEN** events show 2 consecutive `fail` actions and `maxConsecutive` is 3
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Consecutive failures exceed threshold

- **WHEN** events show 4 consecutive `fail` actions and `maxConsecutive` is 3
- **THEN** the constraint SHALL return `passed: false`
- **AND** the message SHALL indicate the actual consecutive failure count

#### Scenario: Failures interrupted by success

- **WHEN** events show 2 `fail` actions, then a `complete`, then 2 more `fail` actions
- **THEN** the constraint SHALL return `passed: true` (consecutive count reset)

### Requirement: createLintViolationsConstraint creates a lint violation constraint

The `createLintViolationsConstraint(maxViolations)` function SHALL return a `Constraint` that fails when the total count of lint violations in event metadata exceeds `maxViolations`. Lint violations are counted from `event.metadata.lintViolations` (number). The constraint SHALL have pipeline scope.

#### Scenario: Violations within limit

- **WHEN** events contain a total of 3 lint violations across metadata and `maxViolations` is 5
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Violations exceed limit

- **WHEN** events contain a total of 8 lint violations across metadata and `maxViolations` is 5
- **THEN** the constraint SHALL return `passed: false`
- **AND** the message SHALL indicate the actual violation count and the limit

#### Scenario: Events without lint metadata

- **WHEN** events have no `metadata.lintViolations` field
- **THEN** the constraint SHALL count zero violations and return `passed: true`

### Requirement: Default constraint factory creates all defaults at once

The `createDefaultConstraints(options?)` function SHALL return an array of all five default constraints with sensible defaults. All thresholds SHALL be overridable via an optional options object.

#### Scenario: Create defaults with no options

- **WHEN** `createDefaultConstraints()` is called with no arguments
- **THEN** the result SHALL be an array of 5 `Constraint` instances with default thresholds

#### Scenario: Create defaults with custom thresholds

- **WHEN** `createDefaultConstraints({ maxRetries: 5, maxTokens: 50000 })` is called
- **THEN** the max-retries constraint SHALL use threshold 5
- **AND** the token-budget constraint SHALL use threshold 50000
- **AND** other constraints SHALL use their default thresholds
