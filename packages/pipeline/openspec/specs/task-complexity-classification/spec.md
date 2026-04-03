# task-complexity-classification

Classify `RoadmapTask` complexity as trivial/simple/medium/complex based on deliverable analysis and dependency count.

## Requirements

### Requirement: Classify task complexity

The system SHALL provide a `classifyTask(description: string, dependencies: readonly string[], deliverable: string): TaskComplexity` function that returns a deterministic complexity classification.

#### Scenario: Trivial task — no dependencies, single simple deliverable

- **WHEN** given description "Rename config file", dependencies [] (empty), and deliverable "tsconfig.json"
- **THEN** the returned complexity is `'trivial'`

#### Scenario: Simple task — few dependencies, single deliverable

- **WHEN** given description "Add logging utility", dependencies ["0.1"], and deliverable "src/lib/logger.ts"
- **THEN** the returned complexity is `'simple'`

#### Scenario: Medium task — moderate dependencies, multi-file deliverable

- **WHEN** given description "Implement authentication middleware", dependencies ["1.1", "1.2", "1.3"], and deliverable "src/lib/auth/middleware.ts - validateToken(), refreshSession()"
- **THEN** the returned complexity is `'medium'`

#### Scenario: Complex task — many dependencies

- **WHEN** given description "Implement orchestrator main loop", dependencies ["4.1", "4.2", "4.3", "4.4", "4.5"], and deliverable "src/lib/orchestrator/index.ts"
- **THEN** the returned complexity is `'complex'`

### Requirement: Deterministic classification

The system SHALL return the same `TaskComplexity` value for identical inputs regardless of call order or external state.

#### Scenario: Repeated classification yields same result

- **WHEN** `classifyTask` is called twice with identical arguments
- **THEN** both calls return the same `TaskComplexity` value

### Requirement: Dependency count as primary signal

The system SHALL use the number of dependencies as the primary complexity signal: 0 deps → trivial, 1-2 deps → simple, 3-4 deps → medium, 5+ deps → complex.

#### Scenario: Zero dependencies classifies as trivial

- **WHEN** given dependencies [] (empty)
- **THEN** the base classification is `'trivial'` (may be elevated by other signals)

#### Scenario: Five or more dependencies classifies as complex

- **WHEN** given dependencies with 5 or more entries
- **THEN** the classification is `'complex'` regardless of other signals

### Requirement: Description keywords as secondary signal

The system SHALL use keywords in the task description to elevate (but never lower) the complexity beyond what dependency count alone indicates.

#### Scenario: Architectural keyword elevates to complex

- **WHEN** given description containing "architect" or "redesign" or "migration" with 2 dependencies
- **THEN** the classification is elevated to `'complex'` despite the low dependency count

#### Scenario: Keywords never lower classification

- **WHEN** given description "Simple config rename" with 4 dependencies
- **THEN** the classification remains `'medium'` (from dependency count) — the word "simple" does not lower it
