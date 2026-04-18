# constraint-evaluator Specification

## Purpose

Defines the core constraint evaluation engine that registers constraints, queries pipeline events from storage, and evaluates each constraint to produce structured results with violations and severity levels.

## Requirements

### Requirement: ConstraintEvaluatorImpl constructor accepts StorageBackend

`ConstraintEvaluatorImpl` SHALL accept a `StorageBackend` instance via its constructor. It SHALL NOT accept a `Telemetry` instance.

#### Scenario: Construct with MemoryStorageBackend

- **WHEN** `new ConstraintEvaluatorImpl(memoryStorage)` is called
- **THEN** the evaluator SHALL be ready to register and evaluate constraints

#### Scenario: Construct with FileStorageBackend

- **WHEN** `new ConstraintEvaluatorImpl(fileStorage)` is called
- **THEN** the evaluator SHALL be ready to register and evaluate constraints

### Requirement: addConstraint registers a constraint

`addConstraint(constraint)` SHALL register the given `Constraint` in the evaluator's internal registry. If a constraint with the same name already exists, it SHALL replace the existing constraint.

#### Scenario: Register a new constraint

- **WHEN** `addConstraint()` is called with a `Constraint` having `name: 'max-retries'`
- **THEN** the constraint SHALL be available for subsequent `evaluate()` calls

#### Scenario: Replace existing constraint by name

- **WHEN** `addConstraint()` is called with a constraint named `'max-retries'` and a constraint with that name already exists
- **THEN** the new constraint SHALL replace the previous one
- **AND** `evaluate()` SHALL use the new constraint's `check()` function

### Requirement: removeConstraint removes a constraint by name

`removeConstraint(name)` SHALL remove the constraint with the given name from the registry. If no constraint with that name exists, it SHALL do nothing (no error thrown).

#### Scenario: Remove an existing constraint

- **WHEN** `removeConstraint('max-retries')` is called and a constraint with that name exists
- **THEN** the constraint SHALL no longer be evaluated in subsequent `evaluate()` calls

#### Scenario: Remove a non-existent constraint

- **WHEN** `removeConstraint('non-existent')` is called and no constraint with that name exists
- **THEN** no error SHALL be thrown
- **AND** the evaluator SHALL continue to function normally

### Requirement: evaluate queries events and runs all constraints

`evaluate(pipelineId)` SHALL query all events for the given pipeline from storage, then run each registered constraint's `check()` function against the appropriate events (filtered by scope), and return a `ConstraintResult`.

#### Scenario: All constraints pass

- **WHEN** `evaluate('pipeline-1')` is called and all registered constraints return `passed: true`
- **THEN** the result SHALL have `passed: true` and `violations: []`

#### Scenario: One constraint fails

- **WHEN** `evaluate('pipeline-1')` is called and one constraint returns `passed: false`
- **THEN** the result SHALL have `passed: false`
- **AND** `violations` SHALL contain exactly one `ConstraintViolation` with the constraint's name and message

#### Scenario: Multiple constraints fail

- **WHEN** `evaluate('pipeline-1')` is called and three constraints return `passed: false`
- **THEN** the result SHALL have `passed: false`
- **AND** `violations` SHALL contain exactly three `ConstraintViolation` entries

#### Scenario: No constraints registered

- **WHEN** `evaluate('pipeline-1')` is called and no constraints have been registered
- **THEN** the result SHALL have `passed: true` and `violations: []`

#### Scenario: No events for pipeline

- **WHEN** `evaluate('pipeline-1')` is called and the storage has no events for that pipeline
- **THEN** all constraints SHALL receive an empty events array
- **AND** the result SHALL reflect each constraint's check against an empty array

### Requirement: evaluate scopes events per constraint

For each registered constraint, the evaluator SHALL filter events based on the constraint's `scope` property. Pipeline-scoped constraints SHALL receive all events. Stage-scoped constraints SHALL receive events for a single stage at a time.

#### Scenario: Pipeline-scoped constraint receives all events

- **WHEN** a constraint has `scope: 'pipeline'` and `evaluate()` is called
- **THEN** the constraint's `check()` SHALL receive all events for the pipeline

#### Scenario: Stage-scoped constraint receives filtered events

- **WHEN** a constraint has `scope: 'stage'` and `evaluate()` is called
- **THEN** the constraint's `check()` SHALL be called once per completed stage with only that stage's events

### Requirement: evaluate returns structured ConstraintResult

The `ConstraintResult` SHALL include `passed` (boolean), `violations` (array of `ConstraintViolation`), and `evaluatedAt` (ISO 8601 timestamp).

#### Scenario: Result includes evaluatedAt timestamp

- **WHEN** `evaluate()` returns a result
- **THEN** `result.evaluatedAt` SHALL be a valid ISO 8601 timestamp string

#### Scenario: Violation includes severity

- **WHEN** a constraint fails and a violation is produced
- **THEN** the `ConstraintViolation.severity` SHALL be `'error'` for custom constraints and the configured severity for default constraints

### Requirement: Constraint evaluation completes within performance bounds

`evaluate()` SHALL complete in under 50ms (p99) when evaluating 10 constraints against 1000 events.

#### Scenario: Performance with 1000 events

- **WHEN** `evaluate()` is called with 10 registered constraints and 1000 events in storage
- **THEN** evaluation SHALL complete in under 50ms
