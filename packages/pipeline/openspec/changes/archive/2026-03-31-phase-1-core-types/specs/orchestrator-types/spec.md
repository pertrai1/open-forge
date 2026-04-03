## ADDED Requirements

### Requirement: Intent type

The system SHALL define an `Intent` literal union type with exactly five values: `'new-project'`, `'feature-add'`, `'bug-fix'`, `'refactor'`, `'migration'`.

#### Scenario: Exhaustive intent matching

- **WHEN** code switches on an `Intent` value
- **THEN** TypeScript enforces exhaustive matching across all five intents

### Requirement: Strategy type

The system SHALL define a `Strategy` literal union type with values: `'full-pipeline'`, `'incremental'`, `'targeted'`, `'transformation'`, `'port'`.

#### Scenario: Intent-to-strategy mapping

- **WHEN** intent is `'new-project'`
- **THEN** the corresponding strategy is `'full-pipeline'`

### Requirement: SessionState interface

The system SHALL define a `SessionState` interface with: `sessionId` (string), `intent` (`Intent`), `strategy` (`Strategy`), `startedAt` (string ISO8601), `currentPhase` (number), `pipelineState` (`PipelineState`), and `handoffPath` (string).

#### Scenario: Active session

- **WHEN** a session is in progress on phase 3
- **THEN** `SessionState` has a unique `sessionId`, `currentPhase: 3`, and a valid `pipelineState`

### Requirement: IntentStrategyMap type

The system SHALL define an `IntentStrategyMap` type mapping each `Intent` to its corresponding `Strategy`. This MUST be a `Record<Intent, Strategy>`.

#### Scenario: Complete mapping

- **WHEN** all intents are mapped
- **THEN** `IntentStrategyMap` has exactly 5 entries with no missing keys
