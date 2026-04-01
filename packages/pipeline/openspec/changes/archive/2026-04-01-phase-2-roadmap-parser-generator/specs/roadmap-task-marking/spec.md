# roadmap-task-marking

Mark tasks complete/incomplete in a ROADMAP.md file and query for the next pending task respecting dependency order.

## ADDED Requirements

### Requirement: Mark task as done
The system SHALL provide a `markTaskDone(markdown: string, taskId: string): string` function that changes a task's checkbox from `[ ]` to `[x]` in the raw markdown string.

#### Scenario: Mark pending task done
- **WHEN** given markdown containing `- [ ] 2.1 Implement parser [deps: 1.1] [deliverable: src/parser.ts]` and taskId "2.1"
- **THEN** the returned markdown contains `- [x] 2.1 Implement parser [deps: 1.1] [deliverable: src/parser.ts]` and all other content is unchanged

#### Scenario: Mark already-done task (no-op)
- **WHEN** given markdown where task "2.1" is already `[x]` and taskId "2.1"
- **THEN** the returned markdown is identical to the input (no modification)

#### Scenario: Throw on unknown task ID
- **WHEN** given taskId "99.9" that does not exist in the markdown
- **THEN** a `RoadmapTaskNotFoundError` is thrown with the task ID in the message

### Requirement: Mark task as undone
The system SHALL provide a `markTaskUndone(markdown: string, taskId: string): string` function that changes a task's checkbox from `[x]` to `[ ]`.

#### Scenario: Mark completed task undone
- **WHEN** given markdown containing `- [x] 1.1 Define types` and taskId "1.1"
- **THEN** the returned markdown contains `- [ ] 1.1 Define types`

#### Scenario: Throw on unknown task ID
- **WHEN** given taskId "99.9" that does not exist in the markdown
- **THEN** a `RoadmapTaskNotFoundError` is thrown

### Requirement: Preserve formatting
The system SHALL preserve all original formatting, whitespace, comments, and non-task content when marking tasks.

#### Scenario: Non-task content unchanged
- **WHEN** marking task "2.1" as done in a markdown string containing dependency graphs, notes sections, and horizontal rules
- **THEN** only the checkbox on the "2.1" task line changes; all other content remains byte-identical

### Requirement: Get next actionable task
The system SHALL provide a `getNextTask(roadmap: Roadmap): RoadmapTask | null` function that returns the first pending task whose dependencies are all completed.

#### Scenario: First pending task with no dependencies
- **WHEN** given a roadmap where all tasks are pending and task "0.1" has no dependencies
- **THEN** `getNextTask` returns task "0.1"

#### Scenario: Task with satisfied dependencies
- **WHEN** given a roadmap where tasks "1.1" and "1.2" are completed, and task "1.3" depends on ["1.1", "1.2"] and is pending
- **THEN** `getNextTask` returns task "1.3"

#### Scenario: Task blocked by incomplete dependency
- **WHEN** given a roadmap where task "2.4" depends on ["2.1"] and task "2.1" is not completed, and no other pending task has satisfied dependencies
- **THEN** `getNextTask` returns `null`

#### Scenario: All tasks completed
- **WHEN** given a roadmap where every task has `completed` true
- **THEN** `getNextTask` returns `null`

#### Scenario: Cross-phase dependency resolution
- **WHEN** given a roadmap where task "2.1" depends on ["1.1"] and task "1.1" in phase 1 is completed
- **THEN** `getNextTask` considers the cross-phase dependency satisfied
