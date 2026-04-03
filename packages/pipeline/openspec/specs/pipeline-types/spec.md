# pipeline-types

Pipeline execution state — PipelineState, PhaseState, ExecutionMode, DriftSentinel, and failure handling.

## Requirements

### Requirement: ExecutionMode type

The system SHALL define an `ExecutionMode` literal union type with exactly three values: `'single-phase'`, `'continuous'`, `'range'`.

#### Scenario: Exhaustive mode matching

- **WHEN** code switches on an `ExecutionMode` value
- **THEN** TypeScript enforces exhaustive matching across all three values

### Requirement: PhaseState interface

The system SHALL define a `PhaseState` interface with: `phaseIndex` (number), `mode` (`ExecutionMode`), `pendingTasks` (string array of task IDs), `completedTasks` (string array of task IDs), `qualityGatesPassed` (boolean), and `retryCount` (number).

#### Scenario: Phase in progress with pending tasks

- **WHEN** a phase has 3 of 5 tasks completed and gates not yet run
- **THEN** `PhaseState` has `completedTasks` of length 3, `pendingTasks` of length 2, and `qualityGatesPassed: false`

#### Scenario: Phase complete

- **WHEN** all tasks are done and quality gates pass
- **THEN** `PhaseState` has empty `pendingTasks` and `qualityGatesPassed: true`

### Requirement: PipelineState interface

The system SHALL define a `PipelineState` interface with: `currentPhase` (number), `totalPhases` (number), `executionMode` (`ExecutionMode`), `phases` (array of `PhaseState`), `startedAt` (string ISO8601), and `status` (`PipelineStatus`).

#### Scenario: Pipeline mid-execution

- **WHEN** the pipeline is processing phase 3 of 10
- **THEN** `PipelineState` has `currentPhase: 3`, `totalPhases: 10`, and `status: 'running'`

### Requirement: PipelineStatus type

The system SHALL define a `PipelineStatus` literal union type with values: `'idle'`, `'running'`, `'paused'`, `'completed'`, `'failed'`, `'blocked'`.

#### Scenario: Pipeline blocked by drift sentinel

- **WHEN** a drift sentinel is detected
- **THEN** `PipelineState.status` is `'blocked'`

### Requirement: DriftSentinel interface

The system SHALL define a `DriftSentinel` interface with: `phase` (number), `reason` (string), and `timestamp` (string ISO8601).

#### Scenario: Drift sentinel from failed quality checks

- **WHEN** quality checks fail after 3 cycles on phase 2
- **THEN** `DriftSentinel` has `phase: 2` and a descriptive `reason`

### Requirement: PhaseRange interface

The system SHALL define a `PhaseRange` interface with: `start` (number) and `end` (number), for use with the `'range'` execution mode.

#### Scenario: Range execution of phases 2-5

- **WHEN** the user specifies `--phase 2-5`
- **THEN** `PhaseRange` has `start: 2` and `end: 5`
