# event-query Specification

## Purpose

Defines how the `TelemetryImpl.query()` method retrieves filtered pipeline events from the storage backend. Query is a pure delegation layer — it accepts an `EventFilter` and returns matching events without additional processing.

## Requirements

### Requirement: query delegates to storage backend

The `query()` method SHALL pass the `EventFilter` directly to the injected `StorageBackend.query()` method and return the results without modification.

#### Scenario: Query returns matching events

- **WHEN** events have been emitted and `query()` is called with a matching `EventFilter`
- **THEN** all events matching the filter SHALL be returned

#### Scenario: Query returns empty for no matches

- **WHEN** `query()` is called with a filter that matches no events
- **THEN** an empty array SHALL be returned

### Requirement: query supports all filter fields

The `query()` method SHALL support filtering by all fields defined in `EventFilter`: `pipelineId` (required), `stage`, `action`, `from`, and `to`.

#### Scenario: Query by pipelineId only

- **WHEN** `query()` is called with only `pipelineId` in the filter
- **THEN** all events for that pipeline SHALL be returned

#### Scenario: Query by pipelineId and stage

- **WHEN** `query()` is called with `pipelineId` and `stage`
- **THEN** only events matching both SHALL be returned

#### Scenario: Query by pipelineId and action

- **WHEN** `query()` is called with `pipelineId` and `action`
- **THEN** only events matching both SHALL be returned

#### Scenario: Query by time range

- **WHEN** `query()` is called with `from` and/or `to` timestamps
- **THEN** only events within the specified time range SHALL be returned

#### Scenario: Query with all filter fields

- **WHEN** `query()` is called with `pipelineId`, `stage`, `action`, `from`, and `to`
- **THEN** only events matching all criteria SHALL be returned

### Requirement: query works with any storage backend

The `query()` method SHALL work identically regardless of which `StorageBackend` implementation is injected.

#### Scenario: Query with memory storage

- **WHEN** `TelemetryImpl` is constructed with a `MemoryStorageBackend`
- **THEN** `query()` SHALL return filtered events from memory

#### Scenario: Query with file storage

- **WHEN** `TelemetryImpl` is constructed with a `FileStorageBackend`
- **THEN** `query()` SHALL return filtered events from the JSONL file
