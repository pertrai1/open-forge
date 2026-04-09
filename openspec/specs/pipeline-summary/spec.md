# pipeline-summary Specification

## Purpose

Defines how the `TelemetryImpl.getPipelineSummary()` method aggregates stored events into a `PipelineSummary`. Computes total duration, token usage, completed stages, current stage, retry count, and derives pipeline status from event actions.

## Requirements

### Requirement: getPipelineSummary computes totalDurationMs

The `getPipelineSummary()` method SHALL sum the `durationMs` field from all events where `action` is `'complete'`.

#### Scenario: Duration from complete events

- **WHEN** events include `complete` actions with `durationMs` of 100, 200, and 300
- **THEN** `totalDurationMs` SHALL be 600

#### Scenario: Zero duration with no complete events

- **WHEN** no events have `action` equal to `'complete'`
- **THEN** `totalDurationMs` SHALL be 0

#### Scenario: Duration excludes non-complete events

- **WHEN** events include `start`, `fail`, and `retry` actions with `durationMs` values
- **THEN** only `complete` events SHALL contribute to `totalDurationMs`

### Requirement: getPipelineSummary computes totalTokens

The `getPipelineSummary()` method SHALL sum `tokenUsage.prompt + tokenUsage.completion` from all events that include `tokenUsage`.

#### Scenario: Token sum from multiple events

- **WHEN** events have `tokenUsage` of `{ prompt: 100, completion: 50 }` and `{ prompt: 200, completion: 100 }`
- **THEN** `totalTokens` SHALL be 450

#### Scenario: Zero tokens with no token usage

- **WHEN** no events include `tokenUsage`
- **THEN** `totalTokens` SHALL be 0

#### Scenario: Tokens from events without tokenUsage are skipped

- **WHEN** some events have `tokenUsage` and others do not
- **THEN** only events with `tokenUsage` SHALL contribute to `totalTokens`

### Requirement: getPipelineSummary computes stagesCompleted

The `getPipelineSummary()` method SHALL collect unique stage names from events where `action` is `'complete'`, preserving insertion order.

#### Scenario: Completed stages from complete events

- **WHEN** events show `complete` actions for stages `'plan'`, `'test'`, and `'implement'`
- **THEN** `stagesCompleted` SHALL be `['plan', 'test', 'implement']`

#### Scenario: Deduplicates repeated stage completions

- **WHEN** events show `complete` for `'plan'` twice and `'test'` once
- **THEN** `stagesCompleted` SHALL be `['plan', 'test']`

#### Scenario: Empty stages with no completions

- **WHEN** no events have `action` equal to `'complete'`
- **THEN** `stagesCompleted` SHALL be an empty array

### Requirement: getPipelineSummary determines currentStage

The `getPipelineSummary()` method SHALL set `currentStage` to the `stage` value of the chronologically last event (by `timestamp`).

#### Scenario: Current stage is last event's stage

- **WHEN** the last event by timestamp has `stage` equal to `'implement'`
- **THEN** `currentStage` SHALL be `'implement'`

#### Scenario: Current stage undefined with no events

- **WHEN** no events exist for the pipeline
- **THEN** `currentStage` SHALL be `undefined`

### Requirement: getPipelineSummary computes retryCount

The `getPipelineSummary()` method SHALL count events where `action` is `'retry'`.

#### Scenario: Retry count from retry events

- **WHEN** events include 3 events with `action` equal to `'retry'`
- **THEN** `retryCount` SHALL be 3

#### Scenario: Zero retries

- **WHEN** no events have `action` equal to `'retry'`
- **THEN** `retryCount` SHALL be 0

### Requirement: getPipelineSummary derives pipeline status

The `getPipelineSummary()` method SHALL derive `status` from event actions using this precedence:

1. `'halted'` if any event has `action === 'escalate'`
2. `'failed'` if any event has `action === 'fail'` (and no escalation)
3. `'completed'` if the last event by timestamp has `action === 'complete'`
4. `'running'` otherwise

#### Scenario: Status halted on escalation

- **WHEN** any event has `action` equal to `'escalate'`
- **THEN** `status` SHALL be `'halted'`

#### Scenario: Status failed on failure without escalation

- **WHEN** any event has `action` equal to `'fail'` and no event has `action` equal to `'escalate'`
- **THEN** `status` SHALL be `'failed'`

#### Scenario: Status completed on final complete

- **WHEN** the last event by timestamp has `action` equal to `'complete'`
- **AND** no `fail` or `escalate` events exist
- **THEN** `status` SHALL be `'completed'`

#### Scenario: Status running for in-progress pipeline

- **WHEN** events exist but none are `escalate`, `fail`, or a final `complete`
- **THEN** `status` SHALL be `'running'`

#### Scenario: Escalation takes precedence over failure

- **WHEN** events include both `fail` and `escalate` actions
- **THEN** `status` SHALL be `'halted'`

#### Scenario: Status running with no events

- **WHEN** no events exist for the pipeline
- **THEN** `status` SHALL be `'running'`

### Requirement: getPipelineSummary returns pipelineId

The `getPipelineSummary()` method SHALL set `pipelineId` to the value passed as the method argument.

#### Scenario: PipelineId matches argument

- **WHEN** `getPipelineSummary('pipeline-42')` is called
- **THEN** the returned `PipelineSummary.pipelineId` SHALL be `'pipeline-42'`
