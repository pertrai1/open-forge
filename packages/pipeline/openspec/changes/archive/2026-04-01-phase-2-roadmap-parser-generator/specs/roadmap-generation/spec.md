# roadmap-generation

Serialize a `Roadmap` object to canonical ROADMAP.md markdown format matching the template structure.

## ADDED Requirements

### Requirement: Generate complete ROADMAP markdown

The system SHALL provide a `generateRoadmap(roadmap: Roadmap): string` function that serializes a `Roadmap` object into a valid ROADMAP.md markdown string.

#### Scenario: Generate roadmap with title and overview

- **WHEN** given a `Roadmap` with title "Project X - Implementation Roadmap" and overview text
- **THEN** the output starts with `# Project X - Implementation Roadmap` followed by `## Overview` and the overview content

#### Scenario: Generate roadmap with multiple phases

- **WHEN** given a `Roadmap` with 3 phases
- **THEN** the output contains 3 phase sections separated by `---` dividers, each with `## Phase N: Name` headers

### Requirement: Generate phase sections

The system SHALL render each phase with its goal, tasks, and parallel groups in the canonical format.

#### Scenario: Generate phase with goal

- **WHEN** given a `RoadmapPhase` with goal "Establish the development environment"
- **THEN** the phase section contains `**Goal**: Establish the development environment`

#### Scenario: Generate phase task list

- **WHEN** given a phase with 3 tasks
- **THEN** the output contains a `### Tasks` subsection with 3 task lines in order

### Requirement: Generate task lines

The system SHALL render each task in the canonical format: `- [x/space] ID Description [deps: ...] [deliverable: ...]`.

#### Scenario: Generate completed task with dependencies

- **WHEN** given a `RoadmapTask` with `id` "2.3", `completed` true, `dependencies` ["2.1", "2.2"], `deliverable` "src/parser.ts", and `description` "Implement parser"
- **THEN** the output line is `- [x] 2.3 Implement parser [deps: 2.1, 2.2] [deliverable: src/parser.ts]`

#### Scenario: Generate pending task with no dependencies

- **WHEN** given a `RoadmapTask` with `id` "0.1", `completed` false, and `dependencies` []
- **THEN** the output line contains `- [ ] 0.1` and `[deps: None]`

### Requirement: Generate parallel groups section

The system SHALL render parallel groups in the canonical format when present.

#### Scenario: Generate parallel groups with notes

- **WHEN** given a phase with 2 parallel groups, Group A with taskIds ["1.1", "1.2"] and note "all independent"
- **THEN** the output contains `**Parallel Groups**:` followed by `- Group A: 1.1, 1.2 (all independent)`

#### Scenario: Omit parallel groups section when empty

- **WHEN** given a phase with no parallel groups
- **THEN** the output does not contain a "Parallel Groups" section

### Requirement: Output matches canonical template structure

The system SHALL produce output that follows the structure defined in `templates/ROADMAP.template.md`.

#### Scenario: Phase sections separated by dividers

- **WHEN** generating a roadmap with 2+ phases
- **THEN** each phase section is preceded by a `---` horizontal rule divider

#### Scenario: Consistent spacing

- **WHEN** generating any roadmap
- **THEN** there is exactly one blank line between the goal line and `### Tasks`, and one blank line between the task list and parallel groups
