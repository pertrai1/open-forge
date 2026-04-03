# checkpoint-manager

Checkpoint Manager — operations and utilities for the open-forge-pipeline.

## Requirements

### Requirement: Create checkpoint
The system SHALL provide a `createCheckpoint(workDir: string, phase: number, label: string): Promise<void>` function that creates a shadow git checkpoint of the working directory.

#### Scenario: Create first checkpoint for a phase
- **WHEN** given a working directory, phase 3, and label "phase-3-start"
- **THEN** a shadow git repo is initialized at `.forge/checkpoints/phase-3/` with `GIT_DIR` pointing to that directory and `GIT_WORK_TREE` pointing to the working directory
- **AND** all tracked files are committed with message "checkpoint: phase-3-start"

#### Scenario: Create subsequent checkpoint in same phase
- **WHEN** a shadow git repo already exists for phase 3 and a new checkpoint "phase-3-pre-gates" is created
- **THEN** a new commit is created in the existing shadow repo with message "checkpoint: phase-3-pre-gates"
- **AND** the commit is tagged with the label "phase-3-pre-gates"

#### Scenario: Exclude configured directories
- **WHEN** creating a checkpoint in a directory containing `node_modules/`, `dist/`, and `.env` files
- **THEN** those paths are excluded from the checkpoint (via `.gitignore` in the shadow repo)

#### Scenario: Skip checkpointing for large projects
- **WHEN** the working directory contains more than 50,000 files
- **THEN** the function throws a `CheckpointBudgetExceededError` with the file count

### Requirement: Rollback to checkpoint
The system SHALL provide a `rollbackToCheckpoint(workDir: string, phase: number, label: string): Promise<void>` function that restores the working directory to a checkpoint state.

#### Scenario: Rollback restores files
- **WHEN** given phase 3 and label "phase-3-pre-gates" and files have been modified since that checkpoint
- **THEN** all tracked files are restored to their state at the checkpoint
- **AND** new files created since the checkpoint are removed

#### Scenario: Rollback preserves excluded files
- **WHEN** rolling back to a checkpoint
- **THEN** `PIPELINE-ISSUES.md`, `PIPELINE-METRICS.md`, `PIPELINE-LOG.md`, and `HANDOFF.md` are NOT rolled back (preserved as-is)

#### Scenario: Rollback to non-existent label
- **WHEN** given a label that does not exist in the shadow repo
- **THEN** the function throws a `CheckpointNotFoundError` with the label

#### Scenario: Rollback with no shadow repo
- **WHEN** given a phase number with no shadow git repo at `.forge/checkpoints/phase-{N}/`
- **THEN** the function throws a `CheckpointNotFoundError`

### Requirement: Delete checkpoints for a phase
The system SHALL provide a `deleteCheckpoints(workDir: string, phase: number): Promise<void>` function that removes the entire shadow git repo for a phase.

#### Scenario: Delete existing shadow repo
- **WHEN** given phase 3 with an existing shadow repo at `.forge/checkpoints/phase-3/`
- **THEN** the entire `.forge/checkpoints/phase-3/` directory is removed

#### Scenario: Delete non-existent phase (no-op)
- **WHEN** given a phase with no shadow repo
- **THEN** the function completes without error (idempotent)

### Requirement: List checkpoints
The system SHALL provide a `listCheckpoints(workDir: string, phase: number): Promise<readonly string[]>` function that returns all checkpoint labels (tags) for a phase.

#### Scenario: List checkpoints with tags
- **WHEN** given phase 3 with tags "phase-3-start", "phase-3-pre-gates", "phase-3-gate-verify-attempt-1"
- **THEN** the function returns ["phase-3-start", "phase-3-pre-gates", "phase-3-gate-verify-attempt-1"]

#### Scenario: List checkpoints with no shadow repo
- **WHEN** given a phase with no shadow repo
- **THEN** the function returns an empty array

### Requirement: Get checkpoint diff
The system SHALL provide a `getCheckpointDiff(workDir: string, phase: number, fromLabel: string, toLabel: string): Promise<string>` function that returns the git diff between two checkpoint labels.

#### Scenario: Diff between two labels
- **WHEN** given phase 3, fromLabel "phase-3-pre-gates", toLabel "phase-3-gate-verify-attempt-1"
- **THEN** the function returns the git diff output as a string

#### Scenario: Diff with non-existent label
- **WHEN** given a fromLabel or toLabel that does not exist
- **THEN** the function throws a `CheckpointNotFoundError`

### Requirement: Throw typed errors
The system SHALL use typed error classes for all checkpoint failures.

#### Scenario: CheckpointNotFoundError
- **WHEN** a rollback or diff references a non-existent checkpoint
- **THEN** a `CheckpointNotFoundError` is thrown with `phase` and `label` properties

#### Scenario: CheckpointBudgetExceededError
- **WHEN** the file count exceeds the budget
- **THEN** a `CheckpointBudgetExceededError` is thrown with a `fileCount` property

#### Scenario: CheckpointGitError
- **WHEN** a git command fails during checkpoint operations
- **THEN** a `CheckpointGitError` is thrown with `command` and `stderr` properties
