## ADDED Requirements

### Requirement: Write drift sentinel

The system SHALL provide a `writeDriftSentinel(filePath: string, sentinel: DriftSentinel): Promise<void>` function that writes a `.pipeline-drift-sentinel` file in key=value format.

#### Scenario: Write sentinel with all fields

- **WHEN** given a `DriftSentinel` with phase 3, reason "quality checks failed after 3 cycles", timestamp "2025-01-15T10:00:00Z", rolledBackTo "phase-3-pre-gates", and attemptHashes ["abc", "def", "ghi"]
- **THEN** the file contains lines: `phase=3`, `reason=quality checks failed after 3 cycles`, `timestamp=2025-01-15T10:00:00Z`, `rolled_back_to=phase-3-pre-gates`, `attempts_log=["abc","def","ghi"]`

#### Scenario: Write sentinel with null rollback

- **WHEN** given a `DriftSentinel` with `rolledBackTo` as null
- **THEN** the file contains `rolled_back_to=null`

#### Scenario: Create parent directories

- **WHEN** given a file path whose parent directory does not exist
- **THEN** the function creates the parent directories before writing

### Requirement: Read drift sentinel

The system SHALL provide a `readDriftSentinel(filePath: string): Promise<DriftSentinel>` function that reads and parses a `.pipeline-drift-sentinel` file.

#### Scenario: Read valid sentinel file

- **WHEN** given a valid sentinel file with all key=value pairs
- **THEN** the function returns a `DriftSentinel` object with all fields parsed correctly, including `attemptHashes` as an array

#### Scenario: Read non-existent file

- **WHEN** given a file path that does not exist
- **THEN** the function throws a `DriftSentinelError` with a message indicating the file was not found

### Requirement: Check if drift sentinel exists

The system SHALL provide a `checkDriftSentinel(filePath: string): Promise<boolean>` function that returns whether a drift sentinel file exists.

#### Scenario: File exists

- **WHEN** given a path to an existing `.pipeline-drift-sentinel` file
- **THEN** the function returns true

#### Scenario: File does not exist

- **WHEN** given a path to a non-existent file
- **THEN** the function returns false

### Requirement: Clear drift sentinel

The system SHALL provide a `clearDriftSentinel(filePath: string): Promise<void>` function that deletes the drift sentinel file.

#### Scenario: Delete existing file

- **WHEN** given a path to an existing sentinel file
- **THEN** the file is deleted and subsequent `checkDriftSentinel` returns false

#### Scenario: Clear non-existent file (no-op)

- **WHEN** given a path to a non-existent file
- **THEN** the function completes without error (idempotent)

### Requirement: Throw typed errors

The system SHALL throw `DriftSentinelError` (not bare `Error`) for drift sentinel failures.

#### Scenario: DriftSentinelError includes file path

- **WHEN** a read operation fails on a malformed sentinel file
- **THEN** the thrown `DriftSentinelError` has a `filePath` property
