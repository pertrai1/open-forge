# handoff-manager

Handoff Manager — operations and utilities for the open-forge-pipeline.

## Requirements

### Requirement: Read HANDOFF state from file

The system SHALL provide a `readHandoff(filePath: string): Promise<HandoffState>` function that reads a HANDOFF.md file and returns the parsed `HandoffState` object from its embedded JSON block.

#### Scenario: Read valid HANDOFF.md

- **WHEN** given a file path to a HANDOFF.md containing a valid JSON code block with a serialized `HandoffState`
- **THEN** the function returns a `HandoffState` object with all fields populated from the JSON

#### Scenario: Read non-existent file

- **WHEN** given a file path that does not exist
- **THEN** the function throws a `HandoffReadError` with a message indicating the file was not found

#### Scenario: Read file with malformed JSON

- **WHEN** given a HANDOFF.md file where the JSON code block contains invalid JSON
- **THEN** the function throws a `HandoffReadError` with a message indicating the JSON is malformed

#### Scenario: Read file with no JSON block

- **WHEN** given a HANDOFF.md file that contains markdown but no fenced JSON code block
- **THEN** the function throws a `HandoffReadError` with a message indicating no JSON block was found

### Requirement: Write HANDOFF state to file

The system SHALL provide a `writeHandoff(filePath: string, state: HandoffState): Promise<void>` function that serializes a `HandoffState` object and writes it to a HANDOFF.md file with both human-readable markdown and an embedded JSON block.

#### Scenario: Write valid state

- **WHEN** given a valid `HandoffState` object and a file path
- **THEN** the file is written with a markdown header and a fenced JSON code block containing the serialized state
- **AND** the file is readable by `readHandoff()` and round-trips to an equivalent `HandoffState`

#### Scenario: Write creates parent directories

- **WHEN** given a file path whose parent directory does not exist
- **THEN** the function creates the parent directories before writing the file

#### Scenario: Write enforces task log bound

- **WHEN** given a `HandoffState` with more than 5 entries in `taskLog`
- **THEN** the written state contains only the last 5 task log entries (most recent)

#### Scenario: Write enforces compressed history bound

- **WHEN** given a `HandoffState` with more than 10 entries in `compressedHistory`
- **THEN** the written state contains only the last 10 compressed history entries

### Requirement: Append task log entry

The system SHALL provide an `appendTaskLog(state: HandoffState, entry: TaskLogEntry): HandoffState` function that returns a new `HandoffState` with the entry appended to the task log, enforcing bounding rules.

#### Scenario: Append to task log with fewer than 5 entries

- **WHEN** given a state with 3 task log entries and a new entry
- **THEN** the returned state has 4 task log entries with the new entry at the end

#### Scenario: Append to task log at capacity

- **WHEN** given a state with 5 task log entries and a new entry
- **THEN** the returned state has 5 task log entries (oldest removed, new entry at the end)
- **AND** the removed entry is compressed into a new `CompressedHistoryEntry` appended to `compressedHistory`

#### Scenario: Append compresses oldest entry

- **WHEN** a task log entry is evicted due to the 5-entry bound
- **THEN** the evicted entry is converted to a `CompressedHistoryEntry` with `taskRange` set to the task ID, `summary` set to the description, and `files` set to the `filesModified` array

### Requirement: Update current state

The system SHALL provide an `updateCurrentState(state: HandoffState, update: Partial<CurrentState>): HandoffState` function that returns a new `HandoffState` with the `currentState` field merged with the update and `updatedAt` set to the current ISO 8601 timestamp.

#### Scenario: Update tasks completed

- **WHEN** given a state and an update `{ tasksCompleted: ['3.1', '3.2'] }`
- **THEN** the returned state has `currentState.tasksCompleted` equal to `['3.1', '3.2']` and `updatedAt` updated

#### Scenario: Partial update preserves other fields

- **WHEN** given a state with `currentState.branch` equal to "main" and an update `{ status: 'complete' }`
- **THEN** the returned state has `currentState.branch` still equal to "main" and `currentState.status` equal to "complete"

### Requirement: Throw typed errors

The system SHALL throw `HandoffReadError` or `HandoffWriteError` (not bare `Error`) for all handoff-related failures.

#### Scenario: HandoffReadError includes file path

- **WHEN** a read operation fails
- **THEN** the thrown `HandoffReadError` has a `filePath` property set to the path that failed

#### Scenario: HandoffWriteError includes file path

- **WHEN** a write operation fails due to a filesystem error
- **THEN** the thrown `HandoffWriteError` has a `filePath` property set to the path that failed
