## 1. Error Types

- [x] 1.1 Define `RoadmapParseError` class in `src/lib/roadmap/parser.ts` — extends `Error`, includes `line` number and context string, sets `name` to `'RoadmapParseError'`
- [x] 1.2 Define `RoadmapTaskNotFoundError` class in `src/lib/helper/roadmap.ts` — extends `Error`, includes `taskId` string, sets `name` to `'RoadmapTaskNotFoundError'`

## 2. ROADMAP Parser

- [x] 2.1 Implement `parseTask(line: string): RoadmapTask` — regex extraction of id, description, completed, dependencies, deliverable; default complexity to `'medium'`; throw `RoadmapParseError` on malformed lines
- [x] 2.2 Implement parallel group line parser (internal helper) — parse `- Group X: id1, id2 (note)` into `ParallelGroup`; handle missing notes
- [x] 2.3 Implement `parsePhase(lines: string[], phaseNumber: number): RoadmapPhase` — extract phase name from header, goal from `**Goal**:` line, collect tasks and parallel groups
- [x] 2.4 Implement `parseRoadmap(markdown: string): Roadmap` — extract title from `#` header, overview between `## Overview` and first `## Phase`, split into phase blocks and delegate to `parsePhase`; throw `RoadmapParseError` on missing title
- [x] 2.5 Write tests for parser against real ROADMAP.md format — cover all 12 scenarios from `roadmap-parsing` spec

## 3. ROADMAP Generator

- [x] 3.1 Implement `generateRoadmap(roadmap: Roadmap): string` — render title, overview, phase sections with goal/tasks/parallel groups, `---` dividers between phases
- [x] 3.2 Implement task line rendering — `- [x/ ] ID Description [deps: ...] [deliverable: ...]` format with `None` for empty deps
- [x] 3.3 Implement parallel groups rendering — `**Parallel Groups**:` section with `- Group X: ids (note)` lines; omit section when no groups
- [x] 3.4 Write tests for generator — cover all 8 scenarios from `roadmap-generation` spec; verify output structure matches template

## 4. Task Complexity Classifier

- [x] 4.1 Implement `classifyTask(description: string, dependencies: readonly string[], deliverable: string): TaskComplexity` — dependency count as primary signal (0→trivial, 1-2→simple, 3-4→medium, 5+→complex); keyword elevation as secondary signal; never lower classification
- [x] 4.2 Write tests for classifier — cover all 8 scenarios from `task-complexity-classification` spec; verify determinism and keyword elevation

## 5. ROADMAP Task Marker

- [x] 5.1 Implement `markTaskDone(markdown: string, taskId: string): string` — regex replace `- [ ] {taskId} ` → `- [x] {taskId} `; no-op if already done; throw `RoadmapTaskNotFoundError` if task ID not found
- [x] 5.2 Implement `markTaskUndone(markdown: string, taskId: string): string` — regex replace `- [x] {taskId} ` → `- [ ] {taskId} `; throw `RoadmapTaskNotFoundError` if task ID not found
- [x] 5.3 Implement `getNextTask(roadmap: Roadmap): RoadmapTask | null` — iterate all tasks across all phases, return first pending task whose dependencies are all completed (cross-phase aware); return `null` if none actionable or all complete
- [x] 5.4 Write tests for task marker — cover all 9 scenarios from `roadmap-task-marking` spec; verify formatting preservation

## 6. Parallel Group Detector

- [x] 6.1 Implement `detectParallelGroups(tasks: readonly RoadmapTask[]): ParallelGroup[]` — topological grouping by intra-phase dependencies; sequential group naming (Group A, B, C...); generate descriptive notes; ignore cross-phase deps; return empty array for empty input
- [x] 6.2 Write tests for parallel group detector — cover all 7 scenarios from `parallel-group-detection` spec

## 7. Integration Verification

- [x] 7.1 Run `npm run verify` — typecheck + lint + format + build + tests all pass
