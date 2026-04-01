import {
  markTaskDone,
  markTaskUndone,
  getNextTask,
  RoadmapTaskNotFoundError,
} from '../src/lib/helper/roadmap.js';
import type { Roadmap } from '../src/lib/roadmap/types.js';

const SAMPLE_MD = `# Test Roadmap

## Overview

Overview text.

---

## Phase 0: Foundation

**Goal**: Setup

### Tasks

- [x] 0.1 Init project [deps: None] [deliverable: package.json]
- [ ] 0.2 Configure TS [deps: None] [deliverable: tsconfig.json]
- [ ] 0.3 Setup tests [deps: 0.1] [deliverable: vitest.config.ts]

**Parallel Groups**:

- Group A: 0.1, 0.2 (all independent)
- Group B: 0.3 (requires 0.1)

---

## Phase 1: Types

**Goal**: Define types

### Tasks

- [x] 1.1 Define ROADMAP types [deps: 0.4] [deliverable: src/types.ts]
- [x] 1.2 Define HANDOFF types [deps: 0.4] [deliverable: src/handoff/types.ts]
- [ ] 1.3 Define pipeline types [deps: 1.1, 1.2] [deliverable: src/pipeline.ts]
`;

describe('markTaskDone', () => {
  it('should mark pending task done', () => {
    const result = markTaskDone(SAMPLE_MD, '0.2');
    expect(result).toContain('- [x] 0.2 Configure TS');
    // Other tasks unchanged
    expect(result).toContain('- [x] 0.1 Init project');
    expect(result).toContain('- [ ] 0.3 Setup tests');
  });

  it('should be a no-op for already-done task', () => {
    const result = markTaskDone(SAMPLE_MD, '0.1');
    expect(result).toBe(SAMPLE_MD);
  });

  it('should throw RoadmapTaskNotFoundError for unknown task ID', () => {
    expect(() => markTaskDone(SAMPLE_MD, '99.9')).toThrow(
      RoadmapTaskNotFoundError
    );
  });

  it('should preserve all non-task content', () => {
    const result = markTaskDone(SAMPLE_MD, '0.2');
    expect(result).toContain('# Test Roadmap');
    expect(result).toContain('## Overview');
    expect(result).toContain('Overview text.');
    expect(result).toContain('**Parallel Groups**:');
    expect(result).toContain('- Group A: 0.1, 0.2 (all independent)');
    expect(result).toContain('---');
  });
});

describe('markTaskUndone', () => {
  it('should mark completed task undone', () => {
    const result = markTaskUndone(SAMPLE_MD, '0.1');
    expect(result).toContain('- [ ] 0.1 Init project');
  });

  it('should throw RoadmapTaskNotFoundError for unknown task ID', () => {
    expect(() => markTaskUndone(SAMPLE_MD, '99.9')).toThrow(
      RoadmapTaskNotFoundError
    );
  });
});

describe('getNextTask', () => {
  const makeRoadmap = (phases: Roadmap['phases']): Roadmap => ({
    title: 'Test',
    overview: '',
    phases,
  });

  it('should return first pending task with no dependencies', () => {
    const roadmap = makeRoadmap([
      {
        number: 0,
        name: 'Foundation',
        goal: 'Setup',
        tasks: [
          {
            id: '0.1',
            description: 'Init',
            completed: false,
            dependencies: [],
            deliverable: 'pkg.json',
            complexity: 'trivial',
          },
          {
            id: '0.2',
            description: 'Config',
            completed: false,
            dependencies: ['0.1'],
            deliverable: 'tsconfig.json',
            complexity: 'simple',
          },
        ],
        parallelGroups: [],
      },
    ]);
    const next = getNextTask(roadmap);
    expect(next).not.toBeNull();
    expect(next!.id).toBe('0.1');
  });

  it('should return task with satisfied dependencies', () => {
    const roadmap = makeRoadmap([
      {
        number: 0,
        name: 'Foundation',
        goal: 'Setup',
        tasks: [
          {
            id: '1.1',
            description: 'A',
            completed: true,
            dependencies: [],
            deliverable: 'a.ts',
            complexity: 'trivial',
          },
          {
            id: '1.2',
            description: 'B',
            completed: true,
            dependencies: [],
            deliverable: 'b.ts',
            complexity: 'trivial',
          },
          {
            id: '1.3',
            description: 'C',
            completed: false,
            dependencies: ['1.1', '1.2'],
            deliverable: 'c.ts',
            complexity: 'medium',
          },
        ],
        parallelGroups: [],
      },
    ]);
    const next = getNextTask(roadmap);
    expect(next).not.toBeNull();
    expect(next!.id).toBe('1.3');
  });

  it('should return null when task is blocked by incomplete dependency', () => {
    const roadmap = makeRoadmap([
      {
        number: 0,
        name: 'Foundation',
        goal: 'Setup',
        tasks: [
          {
            id: '2.1',
            description: 'A',
            completed: false,
            dependencies: ['1.1'],
            deliverable: 'a.ts',
            complexity: 'trivial',
          },
        ],
        parallelGroups: [],
      },
    ]);
    // 1.1 doesn't exist in this roadmap, so it's unresolved → blocked
    const next = getNextTask(roadmap);
    expect(next).toBeNull();
  });

  it('should return null when all tasks completed', () => {
    const roadmap = makeRoadmap([
      {
        number: 0,
        name: 'Foundation',
        goal: 'Setup',
        tasks: [
          {
            id: '0.1',
            description: 'Done',
            completed: true,
            dependencies: [],
            deliverable: 'a.ts',
            complexity: 'trivial',
          },
        ],
        parallelGroups: [],
      },
    ]);
    const next = getNextTask(roadmap);
    expect(next).toBeNull();
  });

  it('should resolve cross-phase dependencies', () => {
    const roadmap = makeRoadmap([
      {
        number: 0,
        name: 'Phase 0',
        goal: 'Setup',
        tasks: [
          {
            id: '1.1',
            description: 'Types',
            completed: true,
            dependencies: [],
            deliverable: 'types.ts',
            complexity: 'trivial',
          },
        ],
        parallelGroups: [],
      },
      {
        number: 1,
        name: 'Phase 1',
        goal: 'Build',
        tasks: [
          {
            id: '2.1',
            description: 'Parser',
            completed: false,
            dependencies: ['1.1'],
            deliverable: 'parser.ts',
            complexity: 'medium',
          },
        ],
        parallelGroups: [],
      },
    ]);
    const next = getNextTask(roadmap);
    expect(next).not.toBeNull();
    expect(next!.id).toBe('2.1');
  });
});
