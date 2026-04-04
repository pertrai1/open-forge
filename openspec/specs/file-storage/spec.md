# file-storage Specification

## Purpose

TBD - created by archiving change telemetry-phase-1. Update Purpose after archive.

## Requirements

### Requirement: File storage implements StorageBackend

The `FileStorageBackend` class SHALL implement the `StorageBackend` interface, persisting events as JSONL (one JSON object per line) in an append-only file.

#### Scenario: Create file storage with path

- **WHEN** a `FileStorageBackend` is instantiated with a file path
- **THEN** it SHALL create the file (and parent directories) if they do not exist

### Requirement: File storage append writes JSONL

The `FileStorageBackend.append()` method SHALL serialize the event as JSON and append it as a single line to the storage file.

#### Scenario: Append writes one line per event

- **WHEN** three events are appended
- **THEN** the file SHALL contain exactly three lines, each being valid JSON

#### Scenario: Append is atomic per event

- **WHEN** `append()` is called
- **THEN** each event SHALL be written as a complete line (no partial writes visible to readers)

### Requirement: File storage query reads and filters JSONL

The `FileStorageBackend.query()` method SHALL read the JSONL file, parse each line, and filter by the provided `EventFilter`.

#### Scenario: Query filters persisted events

- **WHEN** events are appended and then queried with a filter
- **THEN** only matching events SHALL be returned

### Requirement: File storage persists across instances

Events stored by `FileStorageBackend` SHALL be readable by a new instance pointing to the same file.

#### Scenario: Data survives instance recreation

- **WHEN** events are appended, the instance is discarded, and a new instance is created with the same path
- **THEN** the new instance SHALL return the previously stored events via `query()`

### Requirement: File storage count avoids full deserialization

The `FileStorageBackend.count()` method SHALL count matching events efficiently without requiring all events to be held in memory simultaneously.

#### Scenario: Count returns correct number

- **WHEN** events are appended and `count()` is called with a matching filter
- **THEN** the correct count SHALL be returned

### Requirement: File storage handles empty or missing file

The `FileStorageBackend` SHALL gracefully handle cases where the file does not yet exist or is empty.

#### Scenario: Query on non-existent file

- **WHEN** `query()` is called before any events are appended (file does not exist)
- **THEN** an empty array SHALL be returned

#### Scenario: Count on empty file

- **WHEN** `count()` is called on an empty file
- **THEN** zero SHALL be returned
