# constraint-builder Specification

## Purpose

Defines declarative builder utilities for constructing threshold, boolean, and aggregation constraints without manually implementing the `Constraint` interface. Builders produce `Constraint` instances with correct scoping and check functions.

## Requirements

### Requirement: threshold builder creates threshold constraints

The `threshold(options)` function SHALL return a `Constraint` that extracts a numeric value from events using an `extract` function, compares it against a `value` using an `operator` (`'gt'`, `'gte'`, `'lt'`, `'lte'`, `'eq'`), and returns `passed: false` when the comparison is true (the threshold is violated).

#### Scenario: Threshold with gt operator

- **WHEN** `threshold({ name: 'max-retries', extract: countRetries, value: 3, operator: 'gt' })` is created and events contain 4 retries
- **THEN** the constraint SHALL return `passed: false`

#### Scenario: Threshold with lte operator passes

- **WHEN** `threshold({ name: 'max-retries', extract: countRetries, value: 3, operator: 'gt' })` is created and events contain 3 retries
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Threshold includes actual and threshold in result

- **WHEN** a threshold constraint fails
- **THEN** the `ConstraintCheckResult` SHALL include `actualValue` (the extracted value) and `threshold` (the configured value)

#### Scenario: Threshold with custom scope

- **WHEN** `threshold({ ..., scope: 'stage' })` is created
- **THEN** the resulting `Constraint` SHALL have `scope: 'stage'`

#### Scenario: Threshold defaults to pipeline scope

- **WHEN** `threshold({ name: 'test', extract: fn, value: 10, operator: 'gt' })` is created without a `scope` parameter
- **THEN** the resulting `Constraint` SHALL have `scope: 'pipeline'`

### Requirement: boolean builder creates boolean constraints

The `boolean(options)` function SHALL return a `Constraint` that evaluates an `assert` function against events. If `assert` returns `false`, the constraint fails.

#### Scenario: Boolean assertion passes

- **WHEN** `boolean({ name: 'has-completion', assert: hasCompleteAction })` is created and events include a `complete` action
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Boolean assertion fails

- **WHEN** `boolean({ name: 'has-completion', assert: hasCompleteAction })` is created and events have no `complete` action
- **THEN** the constraint SHALL return `passed: false`
- **AND** the message SHALL describe what assertion failed

#### Scenario: Boolean with custom scope

- **WHEN** `boolean({ ..., scope: 'stage' })` is created
- **THEN** the resulting `Constraint` SHALL have `scope: 'stage'`

### Requirement: aggregation builder creates aggregation constraints

The `aggregation(options)` function SHALL return a `Constraint` that applies an aggregation function (`'sum'`, `'count'`, `'avg'`) to values extracted from events, compares the result against a threshold value, and fails when the comparison condition is met.

#### Scenario: Sum aggregation exceeds threshold

- **WHEN** `aggregation({ name: 'total-tokens', fn: 'sum', extract: getTokenUsage, value: 10000, operator: 'gt' })` is created and events sum to 12000 tokens
- **THEN** the constraint SHALL return `passed: false`

#### Scenario: Avg aggregation within threshold

- **WHEN** `aggregation({ name: 'avg-duration', fn: 'avg', extract: getDuration, value: 5000, operator: 'gt' })` is created and events average 3000ms
- **THEN** the constraint SHALL return `passed: true`

#### Scenario: Count aggregation

- **WHEN** `aggregation({ name: 'file-count', fn: 'count', extract: getModifiedFiles, value: 20, operator: 'gt' })` is created and there are 25 modified files
- **THEN** the constraint SHALL return `passed: false`

#### Scenario: Aggregation with empty events

- **WHEN** an aggregation constraint receives an empty events array
- **THEN** sum SHALL be 0, count SHALL be 0, avg SHALL be 0
- **AND** the constraint SHALL evaluate normally against those defaults

#### Scenario: Aggregation defaults to pipeline scope

- **WHEN** `aggregation({ name: 'test', fn: 'sum', extract: fn, value: 10, operator: 'gt' })` is created without a `scope` parameter
- **THEN** the resulting `Constraint` SHALL have `scope: 'pipeline'`
