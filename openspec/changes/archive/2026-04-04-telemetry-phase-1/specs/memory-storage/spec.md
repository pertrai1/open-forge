## ADDED Requirements

### Requirement: In-memory storage implements StorageBackend

The `MemoryStorageBackend` class SHALL implement the `StorageBackend` interface, storing all events in an in-memory array.

#### Scenario: Create in-memory storage

- **WHEN** a `MemoryStorageBackend` is instantiated
- **THEN** it SHALL be ready for use with zero configuration

### Requirement: In-memory storage append is synchronous-fast

The `MemoryStorageBackend.append()` method SHALL resolve immediately after pushing the event to the internal array.

#### Scenario: Append resolves without delay

- **WHEN** `append()` is called
- **THEN** the promise SHALL resolve within 1ms under normal conditions

### Requirement: In-memory storage query filters correctly

The `MemoryStorageBackend.query()` method SHALL filter the internal array by all provided `EventFilter` fields.

#### Scenario: Query with combined filters

- **WHEN** multiple events exist for different pipelines and stages
- **THEN** `query()` with combined filters SHALL return only matching events

### Requirement: In-memory storage is ephemeral

Events stored in `MemoryStorageBackend` SHALL not persist beyond the lifetime of the instance.

#### Scenario: Data lost on new instance

- **WHEN** a `MemoryStorageBackend` is created, events are appended, and a new instance is created
- **THEN** the new instance SHALL have zero events
