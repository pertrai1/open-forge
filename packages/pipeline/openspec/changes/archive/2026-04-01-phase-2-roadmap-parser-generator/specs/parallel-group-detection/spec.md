# parallel-group-detection

Analyze task dependency graphs within a phase to detect groups of tasks that can execute concurrently.

## ADDED Requirements

### Requirement: Detect parallel groups from dependencies
The system SHALL provide a `detectParallelGroups(tasks: readonly RoadmapTask[]): ParallelGroup[]` function that computes groups of concurrently executable tasks based on their dependency graph.

#### Scenario: All tasks independent
- **WHEN** given 4 tasks with no dependencies (all have `dependencies: []`)
- **THEN** the returned array contains a single `ParallelGroup` with all 4 task IDs and name "Group A"

#### Scenario: Linear dependency chain
- **WHEN** given 3 tasks where task 2 depends on task 1, and task 3 depends on task 2
- **THEN** the returned array contains 3 groups, each with a single task ID, in dependency order

#### Scenario: Mixed independent and dependent tasks
- **WHEN** given tasks where "2.1", "2.2", "2.3" have no intra-phase dependencies, "2.4" depends on "2.1", and "2.5" depends on "2.1"
- **THEN** the first group contains ["2.1", "2.2", "2.3"] and the second group contains ["2.4", "2.5"]

### Requirement: Alphabetical group naming
The system SHALL assign group names sequentially as "Group A", "Group B", "Group C", etc.

#### Scenario: Three groups get sequential names
- **WHEN** dependency analysis produces 3 groups
- **THEN** the groups are named "Group A", "Group B", "Group C"

### Requirement: Generate descriptive notes
The system SHALL generate a human-readable `note` for each group based on its characteristics.

#### Scenario: All-independent group note
- **WHEN** a group contains tasks that all have no intra-phase dependencies
- **THEN** the group's `note` is "all independent"

#### Scenario: Dependent group note
- **WHEN** a group contains tasks that depend on tasks from a previous group
- **THEN** the group's `note` describes the dependency (e.g., "requires 2.1")

### Requirement: Only consider intra-phase dependencies
The system SHALL ignore dependencies on tasks outside the provided task list (cross-phase dependencies) when computing groups.

#### Scenario: Cross-phase dependency ignored
- **WHEN** given tasks ["2.1", "2.2"] where "2.1" depends on ["1.1"] (not in the list) and "2.2" has no dependencies
- **THEN** both "2.1" and "2.2" appear in the first group (the cross-phase dependency on "1.1" is ignored)

### Requirement: Handle empty task list
The system SHALL return an empty array when given no tasks.

#### Scenario: No tasks
- **WHEN** given an empty tasks array
- **THEN** the returned array is empty
