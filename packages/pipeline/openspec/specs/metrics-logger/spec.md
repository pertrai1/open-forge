# metrics-logger

Metrics Logger — operations and utilities for the open-forge-pipeline.

## Requirements

### Requirement: Log invocation metrics

The system SHALL provide a `logInvocation(filePath: string, metrics: InvocationMetrics): Promise<void>` function that appends a single invocation record as a JSON line to a PIPELINE-METRICS.md file.

#### Scenario: Append to existing file

- **WHEN** given a PIPELINE-METRICS.md file with 3 existing JSON lines and a new `InvocationMetrics` record
- **THEN** the file now contains 4 JSON lines, with the new record as the last line

#### Scenario: Create file if not exists

- **WHEN** given a file path that does not exist
- **THEN** the function creates the file with a markdown header and the first JSON line

#### Scenario: Create parent directories

- **WHEN** given a file path whose parent directory does not exist
- **THEN** the function creates the parent directories before writing

#### Scenario: Each line is valid JSON

- **WHEN** an invocation is logged
- **THEN** the appended line is a valid JSON string that deserializes to an `InvocationMetrics` object

### Requirement: Read all invocation records

The system SHALL provide a `readInvocations(filePath: string): Promise<readonly InvocationMetrics[]>` function that reads all invocation records from a PIPELINE-METRICS.md file.

#### Scenario: Read file with multiple records

- **WHEN** given a PIPELINE-METRICS.md file with 5 JSON lines
- **THEN** the function returns an array of 5 `InvocationMetrics` objects

#### Scenario: Read empty or non-existent file

- **WHEN** given a file path that does not exist
- **THEN** the function returns an empty array

#### Scenario: Skip non-JSON lines

- **WHEN** given a PIPELINE-METRICS.md file containing markdown header lines and JSON lines
- **THEN** the function returns only the successfully parsed JSON lines, silently skipping markdown headers and blank lines

### Requirement: Build cost manifest

The system SHALL provide a `getCostManifest(runId: string, invocations: readonly InvocationMetrics[]): CostManifest` function that aggregates invocation records into a `CostManifest` with totals, per-role, and per-phase breakdowns.

#### Scenario: Aggregate totals

- **WHEN** given 3 invocations with inputTokens [100, 200, 300], outputTokens [10, 20, 30], costUsd [0.01, 0.02, 0.03]
- **THEN** the `totals` field has `totalInputTokens` 600, `totalOutputTokens` 60, `totalCostUsd` 0.06, `totalInvocations` 3

#### Scenario: Count successful and failed invocations

- **WHEN** given 5 invocations with outcomes ['pass', 'pass', 'fail', 'pass', 'error']
- **THEN** `totals.successfulInvocations` is 3 and `totals.failedInvocations` is 2

#### Scenario: Per-role breakdown

- **WHEN** given invocations with roles ['test-author', 'implementer', 'test-author']
- **THEN** `byRole` contains 2 entries: one for 'test-author' with `invocationCount` 2 and one for 'implementer' with `invocationCount` 1

#### Scenario: Per-phase breakdown

- **WHEN** given invocations with phase numbers [1, 1, 2]
- **THEN** `byPhase` contains 2 entries: phase 1 with `invocationCount` 2 and phase 2 with `invocationCount` 1

#### Scenario: Empty invocations

- **WHEN** given an empty invocations array
- **THEN** the `totals` has all zero values, and `byRole` and `byPhase` are empty arrays

#### Scenario: First-pass rate calculation

- **WHEN** given 4 invocations for role 'implementer' with outcomes ['pass', 'fail', 'pass', 'pass']
- **THEN** the `firstPassRate` for 'implementer' in `byRole` is 0.75 (3 passes / 4 total)
