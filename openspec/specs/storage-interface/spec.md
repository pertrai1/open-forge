# storage-interface Specification

## Purpose

Defines the `StorageBackend` contract (`append`, `query`, `count`) that all telemetry storage implementations must satisfy. Decouples telemetry business logic from persistence — consumers choose a concrete backend at composition time.

## Requirements

### Requirement: StorageBackend interface defines append operation

The `StorageBackend` interface SHALL define an `append(event: PipelineEvent): Promise<void>` method that persists a single pipeline event to the storage backend.

#### Scenario: Append a valid event

- **WHEN** `append()` is called with a valid `PipelineEvent`
- **THEN** the event SHALL be persisted and retrievable via `query()`

#### Scenario: Append preserves event data

- **WHEN** an event is appended and then queried back
- **THEN** all fields of the returned event SHALL match the original event exactly

### Requirement: StorageBackend interface defines query operation

The `StorageBackend` interface SHALL define a `query(filter: EventFilter): Promise<PipelineEvent[]>` method that retrieves events matching the given filter criteria.

#### Scenario: Query by pipelineId

- **WHEN** `query()` is called with an `EventFilter` containing only `pipelineId`
- **THEN** all events matching that `pipelineId` SHALL be returned

#### Scenario: Query by pipelineId and stage

- **WHEN** `query()` is called with an `EventFilter` containing `pipelineId` and `stage`
- **THEN** only events matching both `pipelineId` and `stage` SHALL be returned

#### Scenario: Query by pipelineId and action

- **WHEN** `query()` is called with an `EventFilter` containing `pipelineId` and `action`
- **THEN** only events matching both `pipelineId` and `action` SHALL be returned

#### Scenario: Query by time range

- **WHEN** `query()` is called with an `EventFilter` containing `from` and/or `to` timestamps
- **THEN** only events within the specified time range SHALL be returned

#### Scenario: Query returns empty for no matches

- **WHEN** `query()` is called with a filter that matches no events
- **THEN** an empty array SHALL be returned

### Requirement: StorageBackend interface defines count operation

The `StorageBackend` interface SHALL define a `count(filter: EventFilter): Promise<number>` method that returns the number of events matching the given filter without loading them all into memory.

#### Scenario: Count matches query results

- **WHEN** `count()` is called with the same filter as `query()`
- **THEN** the returned number SHALL equal the length of the array returned by `query()` with the same filter

#### Scenario: Count returns zero for no matches

- **WHEN** `count()` is called with a filter that matches no events
- **THEN** zero SHALL be returned
