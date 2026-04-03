# handoff-types

HANDOFF domain interfaces — HandoffState, TaskLog, Convention, CompressedHistory, and wake context.

## Requirements

### Requirement: HandoffState interface

The system SHALL define a `HandoffState` interface representing the full HANDOFF.md state. It MUST include: `currentState` (CurrentState), `goalContext` (GoalContext), `activeConventions` (array of `Convention`), `openIssues` (array of strings), `taskLog` (array of `TaskLog`), and `compressedHistory` (array of strings).

#### Scenario: Complete handoff state

- **WHEN** a HANDOFF.md is parsed with all sections populated
- **THEN** the result conforms to `HandoffState` with all fields present

### Requirement: CurrentState interface

The system SHALL define a `CurrentState` interface with: `completedTasks` (string array), `packagesTouched` (string array), `branch` (string), and `currentPhase` (number).

#### Scenario: Mid-project current state

- **WHEN** the current state section lists 5 completed tasks and 3 packages
- **THEN** `CurrentState` has `completedTasks` of length 5 and `packagesTouched` of length 3

### Requirement: GoalContext interface

The system SHALL define a `GoalContext` interface with: `problem` (string), `userStory` (string), `specRequirement` (string), and `currentTask` (string).

#### Scenario: Goal context traced from requirements

- **WHEN** a phase targets a specific REQUIREMENTS.md section
- **THEN** `GoalContext.problem` traces back to the originating requirement

### Requirement: TaskLog interface

The system SHALL define a `TaskLog` interface with: `taskId` (string), `description` (string), `keyDecision` (string), `filesChanged` (string array), and `commitHash` (optional string).

#### Scenario: Task log entry with commit

- **WHEN** task 1.3 is completed with a commit
- **THEN** the `TaskLog` entry has `taskId: "1.3"` and a populated `commitHash`

#### Scenario: Task log entry without commit

- **WHEN** a task completes without committing
- **THEN** the `TaskLog` entry has `commitHash` as undefined

### Requirement: Convention interface

The system SHALL define a `Convention` interface with: `name` (string) and `description` (string).

#### Scenario: Error handling convention

- **WHEN** a convention for error handling is active
- **THEN** it has a descriptive `name` and `description` explaining the pattern

### Requirement: WakeContext interface

The system SHALL define a `WakeContext` interface with: `changeName` (string), `branch` (string), `nextTask` (string), `progress` (string), `goalContext` (GoalContext), `packagesTouched` (string array), `activeConventions` (string array), `openIssues` (string array), and `lastCommit` (optional string).

#### Scenario: Wake context for session handoff

- **WHEN** the orchestrator hands off to a new thread
- **THEN** `WakeContext` contains all fields needed for immediate orientation
