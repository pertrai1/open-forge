# roadmap-parsing

Parse ROADMAP.md markdown into typed `Roadmap` structure — phases, tasks, dependencies, deliverables, parallel groups, and overview sections.

## Requirements

### Requirement: Parse complete ROADMAP

The system SHALL provide a `parseRoadmap(markdown: string): Roadmap` function that parses a valid ROADMAP.md string into a `Roadmap` object containing title, overview, and all phases.

#### Scenario: Parse roadmap with multiple phases

- **WHEN** given a ROADMAP.md string with title "Project X - Implementation Roadmap", an overview section, and 3 phases
- **THEN** the returned `Roadmap` has `title` equal to "Project X - Implementation Roadmap", a non-empty `overview` string, and `phases` array of length 3

#### Scenario: Parse roadmap with no phases

- **WHEN** given a ROADMAP.md string with only a title and overview section (no phase blocks)
- **THEN** the returned `Roadmap` has the title, overview content, and an empty `phases` array

#### Scenario: Parse overview content

- **WHEN** given a ROADMAP.md with overview text including tech stack and architecture details between the title and first phase
- **THEN** the `overview` field contains all text between the `## Overview` header and the first `## Phase` header, trimmed of leading/trailing whitespace

### Requirement: Parse phase blocks

The system SHALL provide a `parsePhase(lines: string[], phaseNumber: number): RoadmapPhase` function that parses a phase block into a `RoadmapPhase` object.

#### Scenario: Parse phase with goal and tasks

- **WHEN** given lines for "## Phase 2: ROADMAP Parser" with goal "Implement parsing" and 4 task lines
- **THEN** the returned `RoadmapPhase` has `number` 2, `name` "ROADMAP Parser", `goal` "Implement parsing", and `tasks` array of length 4

#### Scenario: Parse phase number and name from header

- **WHEN** given a phase header line "## Phase 0: Project Foundation"
- **THEN** the phase has `number` 0 and `name` "Project Foundation"

#### Scenario: Parse parallel groups within phase

- **WHEN** given a phase block containing a "Parallel Groups" section with 3 groups
- **THEN** the `parallelGroups` array has length 3 with correct names and task IDs

### Requirement: Parse individual task lines

The system SHALL provide a `parseTask(line: string): RoadmapTask` function that extracts all fields from a single ROADMAP task line.

#### Scenario: Parse completed task with dependencies

- **WHEN** given the line `- [x] 2.3 Implement parser [deps: 2.1, 2.2] [deliverable: src/parser.ts]`
- **THEN** the returned `RoadmapTask` has `id` "2.3", `description` "Implement parser", `completed` true, `dependencies` ["2.1", "2.2"], and `deliverable` "src/parser.ts"

#### Scenario: Parse pending task with no dependencies

- **WHEN** given the line `- [ ] 0.1 Init project [deps: None] [deliverable: package.json]`
- **THEN** the returned `RoadmapTask` has `id` "0.1", `completed` false, `dependencies` [] (empty array), and `deliverable` "package.json"

#### Scenario: Parse task with complex deliverable

- **WHEN** given the line `- [ ] 1.1 Define types [deps: 0.4] [deliverable: \`src/types.ts\` - Phase, Task interfaces]`
- **THEN** the `deliverable` field contains the full deliverable text including backticks and description

#### Scenario: Default complexity to medium

- **WHEN** a task line does not contain an explicit complexity tag
- **THEN** the `complexity` field defaults to `'medium'`

### Requirement: Parse parallel group lines

The system SHALL parse parallel group entries from the "Parallel Groups" section of a phase.

#### Scenario: Parse group with task IDs and note

- **WHEN** given the line "- Group A: 0.1, 0.2, 0.4, 0.5 (all independent)"
- **THEN** the `ParallelGroup` has `name` "Group A", `taskIds` ["0.1", "0.2", "0.4", "0.5"], and `note` "all independent"

#### Scenario: Parse group with note containing parenthetical

- **WHEN** given the line "- Group B: 0.3 (requires 0.1)"
- **THEN** the `ParallelGroup` has `name` "Group B", `taskIds` ["0.3"], and `note` "requires 0.1"

#### Scenario: Parse group with no note

- **WHEN** given the line "- Group C: 1.1, 1.2"
- **THEN** the `ParallelGroup` has `name` "Group C", `taskIds` ["1.1", "1.2"], and `note` "" (empty string)

### Requirement: Throw typed errors on malformed input

The system SHALL throw a `RoadmapParseError` (not a bare `Error`) when encountering malformed ROADMAP.md content.

#### Scenario: Missing title header

- **WHEN** given a ROADMAP.md string with no `#` level-1 header
- **THEN** a `RoadmapParseError` is thrown with a message indicating the title is missing

#### Scenario: Malformed task line

- **WHEN** given a task line missing the `[deps: ...]` tag
- **THEN** a `RoadmapParseError` is thrown with the line number and the malformed content
