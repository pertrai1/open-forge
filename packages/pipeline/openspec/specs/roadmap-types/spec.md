# roadmap-types

ROADMAP domain interfaces — Phase, Task, ParallelGroup, Roadmap, and task complexity classification.

## Requirements

### Requirement: Roadmap interface
The system SHALL define a `Roadmap` interface representing a complete parsed ROADMAP.md file. It MUST include a title, an optional overview string, and an ordered array of `Phase` objects.

#### Scenario: Roadmap with multiple phases
- **WHEN** a ROADMAP.md contains 3 phases with tasks
- **THEN** the parsed result conforms to the `Roadmap` interface with a `phases` array of length 3

### Requirement: Phase interface
The system SHALL define a `Phase` interface with a numeric `index`, a `name` string, a `goal` string, an array of `Task` objects, and an array of `ParallelGroup` objects.

#### Scenario: Phase with goal and tasks
- **WHEN** a phase section has a goal line and 4 task items
- **THEN** the `Phase` object contains the goal string and a `tasks` array of length 4

### Requirement: Task interface
The system SHALL define a `Task` interface with: `id` (string, e.g. "1.2"), `description` (string), `done` (boolean), `dependencies` (array of task ID strings), `deliverable` (string file path), and `complexity` (`TaskComplexity`).

#### Scenario: Completed task with dependencies
- **WHEN** a task line reads `- [x] 2.3 Implement parser [deps: 2.1, 2.2] [deliverable: src/parser.ts]`
- **THEN** the `Task` object has `done: true`, `id: "2.3"`, and `dependencies: ["2.1", "2.2"]`

#### Scenario: Task with no dependencies
- **WHEN** a task line reads `- [ ] 0.1 Init project [deps: None] [deliverable: package.json]`
- **THEN** the `Task` object has `dependencies: []` (empty array)

### Requirement: TaskComplexity type
The system SHALL define a `TaskComplexity` literal union type with exactly four values: `'trivial'`, `'simple'`, `'medium'`, `'complex'`.

#### Scenario: Exhaustive complexity matching
- **WHEN** code switches on a `TaskComplexity` value
- **THEN** TypeScript enforces exhaustive matching across all four values

### Requirement: ParallelGroup interface
The system SHALL define a `ParallelGroup` interface with a `name` (string, e.g. "Group A") and `taskIds` (array of task ID strings).

#### Scenario: Parallel group with independent tasks
- **WHEN** a ROADMAP declares "Group A: 1.1, 1.2, 1.3 (all independent)"
- **THEN** the `ParallelGroup` has `name: "Group A"` and `taskIds: ["1.1", "1.2", "1.3"]`
