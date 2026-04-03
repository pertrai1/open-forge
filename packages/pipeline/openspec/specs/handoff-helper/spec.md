# handoff-helper

Handoff Helper — operations and utilities for the open-forge-pipeline.

## Requirements

### Requirement: Get active conventions

The system SHALL provide a `getActiveConventions(state: HandoffState): readonly Convention[]` function that returns the active conventions from a `HandoffState`.

#### Scenario: Return conventions from state

- **WHEN** given a `HandoffState` with 3 conventions in the `conventions` array
- **THEN** the function returns an array of 3 `Convention` objects matching the state's conventions

#### Scenario: Return empty array when no conventions

- **WHEN** given a `HandoffState` with an empty `conventions` array
- **THEN** the function returns an empty array

### Requirement: Build wake context

The system SHALL provide a `getWakeContext(state: HandoffState, nextTask: string, progress: string): WakeContext` function that builds a structured `WakeContext` object from a `HandoffState` for session handoff.

#### Scenario: Build complete wake context

- **WHEN** given a `HandoffState` with sessionId "ses-123", branch "feat/phase-3", 2 conventions, 1 open issue, and a goal context, plus nextTask "3.2 — Implement helper" and progress "1/8 tasks complete"
- **THEN** the returned `WakeContext` has `changeName` equal to the sessionId, `branch` from currentState, `nextTask` and `progress` as passed, `goalContext` summarized from the state's goal context, `packagesTouched` from currentState, `activeConventions` as convention names, and `openIssues` as issue descriptions

#### Scenario: Wake context with no open issues

- **WHEN** given a `HandoffState` with no open issues (empty array or all resolved)
- **THEN** the returned `WakeContext` has an empty `openIssues` array

#### Scenario: Wake context filters resolved issues

- **WHEN** given a `HandoffState` with 3 open issues where 1 is resolved (`resolved: true`)
- **THEN** the returned `WakeContext` has `openIssues` containing only the 2 unresolved issue descriptions

#### Scenario: Wake context summarizes goal context

- **WHEN** given a `HandoffState` with goalContext having problem "Build pipeline", userStory "As a dev...", specRequirement "Req 1.1", currentTask "Implement parser"
- **THEN** the `goalContext` field in `WakeContext` contains a summary string combining problem, user story, and spec requirement

### Requirement: Get last commit from task log

The system SHALL provide a `getLastCommit(state: HandoffState): string` function that returns the commit hash and description from the most recent task log entry.

#### Scenario: Return last commit

- **WHEN** given a `HandoffState` with 3 task log entries, the most recent having commitHash "abc1234" and description "Implement parser"
- **THEN** the function returns "abc1234 — Implement parser"

#### Scenario: Return empty string when no task log

- **WHEN** given a `HandoffState` with an empty task log
- **THEN** the function returns an empty string

#### Scenario: Handle empty commit hash

- **WHEN** given a `HandoffState` where the most recent task log entry has an empty commitHash
- **THEN** the function returns "(no commit) — {description}"
