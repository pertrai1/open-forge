import {
  parseRoadmap,
  parsePhase,
  parseTask,
  RoadmapParseError,
} from '../src/lib/roadmap/parser.js';

const SAMPLE_ROADMAP = `# Project X - Implementation Roadmap

## Overview

This roadmap breaks down the requirements.

**Tech Stack**: TypeScript / Node.js 20+
**Interface**: CLI + Plugin

---

## Phase 0: Project Foundation

**Goal**: Establish the development environment

### Tasks

- [x] 0.1 Initialize project [deps: None] [deliverable: package.json]
- [x] 0.2 Configure TypeScript [deps: None] [deliverable: tsconfig.json]
- [ ] 0.3 Set up testing [deps: 0.1] [deliverable: vitest.config.ts]
- [x] 0.4 Create directory structure [deps: None] [deliverable: src/ structure]

**Parallel Groups**:

- Group A: 0.1, 0.2, 0.4 (all independent)
- Group B: 0.3 (requires 0.1)

---

## Phase 1: Core Types

**Goal**: Define all TypeScript interfaces

### Tasks

- [x] 1.1 Define ROADMAP types [deps: 0.4] [deliverable: \`src/lib/roadmap/types.ts\` - Phase, Task interfaces]
- [ ] 1.2 Define HANDOFF types [deps: 0.4] [deliverable: src/lib/handoff/types.ts]

**Parallel Groups**:

- Group A: 1.1, 1.2 (all independent)

---

## Phase 2: Parser

**Goal**: Implement parsing

### Tasks

- [ ] 2.1 Implement parser [deps: 1.1] [deliverable: src/lib/roadmap/parser.ts]
- [ ] 2.2 Implement generator [deps: 1.1] [deliverable: src/lib/roadmap/generator.ts]
- [ ] 2.3 Write tests [deps: 2.1, 2.2] [deliverable: tests/roadmap-parser.test.ts]

**Parallel Groups**:

- Group A: 2.1, 2.2 (all independent)
- Group B: 2.3 (requires 2.1, 2.2)
`;

describe('parseTask', () => {
  it('should parse completed task with dependencies', () => {
    const line =
      '- [x] 2.3 Implement parser [deps: 2.1, 2.2] [deliverable: src/parser.ts]';
    const task = parseTask(line);
    expect(task.id).toBe('2.3');
    expect(task.description).toBe('Implement parser');
    expect(task.completed).toBe(true);
    expect(task.dependencies).toEqual(['2.1', '2.2']);
    expect(task.deliverable).toBe('src/parser.ts');
  });

  it('should parse pending task with no dependencies', () => {
    const line =
      '- [ ] 0.1 Init project [deps: None] [deliverable: package.json]';
    const task = parseTask(line);
    expect(task.id).toBe('0.1');
    expect(task.completed).toBe(false);
    expect(task.dependencies).toEqual([]);
    expect(task.deliverable).toBe('package.json');
  });

  it('should parse task with complex deliverable including backticks', () => {
    const line =
      '- [ ] 1.1 Define types [deps: 0.4] [deliverable: `src/types.ts` - Phase, Task interfaces]';
    const task = parseTask(line);
    expect(task.deliverable).toBe('`src/types.ts` - Phase, Task interfaces');
  });

  it('should default complexity to medium', () => {
    const line =
      '- [ ] 0.1 Init project [deps: None] [deliverable: package.json]';
    const task = parseTask(line);
    expect(task.complexity).toBe('medium');
  });

  it('should throw RoadmapParseError on malformed task line', () => {
    const line = '- [ ] 0.1 Missing deps tag [deliverable: foo.ts]';
    expect(() => parseTask(line)).toThrow(RoadmapParseError);
  });
});

describe('parsePhase', () => {
  it('should parse phase with goal and tasks', () => {
    const lines = [
      '## Phase 2: ROADMAP Parser',
      '',
      '**Goal**: Implement parsing',
      '',
      '### Tasks',
      '',
      '- [ ] 2.1 Implement parser [deps: 1.1] [deliverable: src/parser.ts]',
      '- [ ] 2.2 Implement generator [deps: 1.1] [deliverable: src/generator.ts]',
      '- [ ] 2.3 Write tests [deps: 2.1, 2.2] [deliverable: tests/parser.test.ts]',
      '',
      '**Parallel Groups**:',
      '',
      '- Group A: 2.1, 2.2 (all independent)',
      '- Group B: 2.3 (requires 2.1, 2.2)',
    ];
    const phase = parsePhase(lines, 2);
    expect(phase.number).toBe(2);
    expect(phase.name).toBe('ROADMAP Parser');
    expect(phase.goal).toBe('Implement parsing');
    expect(phase.tasks).toHaveLength(3);
    expect(phase.parallelGroups).toHaveLength(2);
  });

  it('should parse phase number and name from header', () => {
    const lines = [
      '## Phase 0: Project Foundation',
      '',
      '**Goal**: Setup',
      '',
      '### Tasks',
      '',
      '- [ ] 0.1 Init [deps: None] [deliverable: pkg.json]',
    ];
    const phase = parsePhase(lines, 0);
    expect(phase.number).toBe(0);
    expect(phase.name).toBe('Project Foundation');
  });

  it('should parse parallel groups within phase', () => {
    const lines = [
      '## Phase 0: Foundation',
      '',
      '**Goal**: Setup',
      '',
      '### Tasks',
      '',
      '- [ ] 0.1 Task A [deps: None] [deliverable: a.ts]',
      '- [ ] 0.2 Task B [deps: None] [deliverable: b.ts]',
      '- [ ] 0.3 Task C [deps: 0.1] [deliverable: c.ts]',
      '',
      '**Parallel Groups**:',
      '',
      '- Group A: 0.1, 0.2 (all independent)',
      '- Group B: 0.3 (requires 0.1)',
      '- Group C: 0.4, 0.5 (requires 0.2)',
    ];
    const phase = parsePhase(lines, 0);
    expect(phase.parallelGroups).toHaveLength(3);
  });
});

describe('parseRoadmap', () => {
  it('should parse roadmap with multiple phases', () => {
    const roadmap = parseRoadmap(SAMPLE_ROADMAP);
    expect(roadmap.title).toBe('Project X - Implementation Roadmap');
    expect(roadmap.overview).toBeTruthy();
    expect(roadmap.phases).toHaveLength(3);
  });

  it('should parse roadmap with no phases', () => {
    const md = `# Empty Roadmap

## Overview

Just an overview, no phases yet.
`;
    const roadmap = parseRoadmap(md);
    expect(roadmap.title).toBe('Empty Roadmap');
    expect(roadmap.overview).toBeTruthy();
    expect(roadmap.phases).toHaveLength(0);
  });

  it('should parse overview content between title and first phase', () => {
    const roadmap = parseRoadmap(SAMPLE_ROADMAP);
    expect(roadmap.overview).toContain('Tech Stack');
    expect(roadmap.overview).toContain('TypeScript');
  });

  it('should throw RoadmapParseError on missing title', () => {
    const md = `## Overview\n\nNo title header here.\n`;
    expect(() => parseRoadmap(md)).toThrow(RoadmapParseError);
  });
});

describe('parallel group parsing', () => {
  it('should parse group with task IDs and note', () => {
    const lines = [
      '## Phase 0: Foundation',
      '',
      '**Goal**: Setup',
      '',
      '### Tasks',
      '',
      '- [x] 0.1 Task A [deps: None] [deliverable: a.ts]',
      '- [x] 0.2 Task B [deps: None] [deliverable: b.ts]',
      '- [ ] 0.4 Task D [deps: None] [deliverable: d.ts]',
      '- [ ] 0.5 Task E [deps: None] [deliverable: e.ts]',
      '',
      '**Parallel Groups**:',
      '',
      '- Group A: 0.1, 0.2, 0.4, 0.5 (all independent)',
    ];
    const phase = parsePhase(lines, 0);
    const group = phase.parallelGroups[0];
    expect(group.name).toBe('Group A');
    expect(group.taskIds).toEqual(['0.1', '0.2', '0.4', '0.5']);
    expect(group.note).toBe('all independent');
  });

  it('should parse group with parenthetical note', () => {
    const lines = [
      '## Phase 0: Foundation',
      '',
      '**Goal**: Setup',
      '',
      '### Tasks',
      '',
      '- [ ] 0.3 Task C [deps: 0.1] [deliverable: c.ts]',
      '',
      '**Parallel Groups**:',
      '',
      '- Group B: 0.3 (requires 0.1)',
    ];
    const phase = parsePhase(lines, 0);
    const group = phase.parallelGroups[0];
    expect(group.name).toBe('Group B');
    expect(group.taskIds).toEqual(['0.3']);
    expect(group.note).toBe('requires 0.1');
  });

  it('should parse group with no note', () => {
    const lines = [
      '## Phase 0: Foundation',
      '',
      '**Goal**: Setup',
      '',
      '### Tasks',
      '',
      '- [ ] 1.1 Task A [deps: None] [deliverable: a.ts]',
      '- [ ] 1.2 Task B [deps: None] [deliverable: b.ts]',
      '',
      '**Parallel Groups**:',
      '',
      '- Group C: 1.1, 1.2',
    ];
    const phase = parsePhase(lines, 0);
    const group = phase.parallelGroups[0];
    expect(group.name).toBe('Group C');
    expect(group.taskIds).toEqual(['1.1', '1.2']);
    expect(group.note).toBe('');
  });
});
