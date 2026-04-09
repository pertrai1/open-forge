# event-emission Specification

## Purpose

Defines how the `TelemetryImpl.emit()` method validates and persists pipeline events. Ensures required fields are present before storage and that storage failures do not crash the calling pipeline.

## Requirements

### Requirement: emit validates required event fields

The `emit()` method SHALL validate that the `PipelineEvent` contains all required fields (`timestamp`, `pipelineId`, `phase`, `stage`, `action`) before attempting storage. If any required field is missing or empty, `emit()` SHALL throw an error.

#### Scenario: Emit with all required fields

- **WHEN** `emit()` is called with a `PipelineEvent` containing `timestamp`, `pipelineId`, `phase`, `stage`, and `action`
- **THEN** the event SHALL be persisted to the storage backend

#### Scenario: Emit rejects missing timestamp

- **WHEN** `emit()` is called with a `PipelineEvent` where `timestamp` is missing or empty
- **THEN** `emit()` SHALL throw an error
- **AND** the event SHALL NOT be persisted

#### Scenario: Emit rejects missing pipelineId

- **WHEN** `emit()` is called with a `PipelineEvent` where `pipelineId` is missing or empty
- **THEN** `emit()` SHALL throw an error
- **AND** the event SHALL NOT be persisted

#### Scenario: Emit rejects missing stage

- **WHEN** `emit()` is called with a `PipelineEvent` where `stage` is missing
- **THEN** `emit()` SHALL throw an error

#### Scenario: Emit rejects missing action

- **WHEN** `emit()` is called with a `PipelineEvent` where `action` is missing
- **THEN** `emit()` SHALL throw an error

#### Scenario: Emit accepts event with only required fields

- **WHEN** `emit()` is called with a `PipelineEvent` containing only the required fields and no optional fields
- **THEN** the event SHALL be persisted successfully

### Requirement: emit delegates to storage backend

The `emit()` method SHALL delegate persistence to the injected `StorageBackend.append()` method.

#### Scenario: Emit appends to injected storage

- **WHEN** `emit()` is called with a valid event and a `MemoryStorageBackend`
- **THEN** the event SHALL be retrievable via the storage backend's `query()` method

#### Scenario: Emit works with file storage backend

- **WHEN** `emit()` is called with a valid event and a `FileStorageBackend`
- **THEN** the event SHALL be persisted to the file and retrievable after recreation

### Requirement: emit handles storage failures gracefully

If the storage backend's `append()` method throws an error, `emit()` SHALL catch the error, suppress it, and resolve normally. The pipeline SHALL NOT crash due to a telemetry storage failure.

#### Scenario: Emit suppresses storage error

- **WHEN** `emit()` is called and the storage backend's `append()` throws an error
- **THEN** `emit()` SHALL resolve without throwing
- **AND** the pipeline SHALL continue unaffected

### Requirement: emit preserves optional fields

When a `PipelineEvent` includes optional fields (`durationMs`, `tokenUsage`, `agentId`, `model`, `filesModified`, `filesCreated`, `error`, `metadata`), `emit()` SHALL pass them through to storage without modification.

#### Scenario: Emit preserves all optional fields

- **WHEN** `emit()` is called with an event containing `durationMs`, `tokenUsage`, `agentId`, `model`, `filesModified`, `filesCreated`, `error`, and `metadata`
- **THEN** the persisted event SHALL retain all optional fields with their original values
