import { generateRoadmap } from '../src/lib/roadmap/generator.js';
import type { Roadmap, RoadmapPhase } from '../src/lib/roadmap/types.js';

function makePhase(overrides: Partial<RoadmapPhase> = {}): RoadmapPhase {
  return {
    number: 0,
    name: 'Foundation',
    goal: 'Setup the project',
    tasks: [],
    parallelGroups: [],
    ...overrides,
  };
}

function makeRoadmap(overrides: Partial<Roadmap> = {}): Roadmap {
  return {
    title: 'Test Project - Implementation Roadmap',
    overview: 'A test project overview.',
    phases: [],
    ...overrides,
  };
}

describe('generateRoadmap', () => {
  it('should generate roadmap with title and overview', () => {
    const roadmap = makeRoadmap();
    const output = generateRoadmap(roadmap);
    expect(output).toContain('# Test Project - Implementation Roadmap');
    expect(output).toContain('## Overview');
    expect(output).toContain('A test project overview.');
  });

  it('should generate roadmap with multiple phases separated by dividers', () => {
    const roadmap = makeRoadmap({
      phases: [
        makePhase({ number: 0, name: 'Foundation' }),
        makePhase({ number: 1, name: 'Types' }),
        makePhase({ number: 2, name: 'Parser' }),
      ],
    });
    const output = generateRoadmap(roadmap);
    expect(output).toContain('## Phase 0: Foundation');
    expect(output).toContain('## Phase 1: Types');
    expect(output).toContain('## Phase 2: Parser');
    // Each phase section preceded by ---
    const dividerCount = (output.match(/^---$/gm) || []).length;
    expect(dividerCount).toBeGreaterThanOrEqual(3);
  });

  it('should generate phase with goal', () => {
    const roadmap = makeRoadmap({
      phases: [makePhase({ goal: 'Establish the development environment' })],
    });
    const output = generateRoadmap(roadmap);
    expect(output).toContain('**Goal**: Establish the development environment');
  });

  it('should generate phase task list under ### Tasks', () => {
    const roadmap = makeRoadmap({
      phases: [
        makePhase({
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
              completed: true,
              dependencies: ['0.1'],
              deliverable: 'tsconfig.json',
              complexity: 'simple',
            },
            {
              id: '0.3',
              description: 'Test',
              completed: false,
              dependencies: [],
              deliverable: 'vitest.config.ts',
              complexity: 'medium',
            },
          ],
        }),
      ],
    });
    const output = generateRoadmap(roadmap);
    expect(output).toContain('### Tasks');
    expect(output).toContain(
      '- [ ] 0.1 Init [deps: None] [deliverable: pkg.json]'
    );
    expect(output).toContain(
      '- [x] 0.2 Config [deps: 0.1] [deliverable: tsconfig.json]'
    );
    expect(output).toContain(
      '- [ ] 0.3 Test [deps: None] [deliverable: vitest.config.ts]'
    );
  });

  it('should generate completed task with [x] and dependencies', () => {
    const roadmap = makeRoadmap({
      phases: [
        makePhase({
          tasks: [
            {
              id: '2.3',
              description: 'Implement parser',
              completed: true,
              dependencies: ['2.1', '2.2'],
              deliverable: 'src/parser.ts',
              complexity: 'medium',
            },
          ],
        }),
      ],
    });
    const output = generateRoadmap(roadmap);
    expect(output).toContain(
      '- [x] 2.3 Implement parser [deps: 2.1, 2.2] [deliverable: src/parser.ts]'
    );
  });

  it('should generate pending task with [deps: None]', () => {
    const roadmap = makeRoadmap({
      phases: [
        makePhase({
          tasks: [
            {
              id: '0.1',
              description: 'Init',
              completed: false,
              dependencies: [],
              deliverable: 'pkg.json',
              complexity: 'trivial',
            },
          ],
        }),
      ],
    });
    const output = generateRoadmap(roadmap);
    expect(output).toContain('- [ ] 0.1');
    expect(output).toContain('[deps: None]');
  });

  it('should generate parallel groups with notes', () => {
    const roadmap = makeRoadmap({
      phases: [
        makePhase({
          tasks: [
            {
              id: '1.1',
              description: 'A',
              completed: false,
              dependencies: [],
              deliverable: 'a.ts',
              complexity: 'trivial',
            },
            {
              id: '1.2',
              description: 'B',
              completed: false,
              dependencies: [],
              deliverable: 'b.ts',
              complexity: 'trivial',
            },
          ],
          parallelGroups: [
            {
              name: 'Group A',
              taskIds: ['1.1', '1.2'],
              note: 'all independent',
            },
          ],
        }),
      ],
    });
    const output = generateRoadmap(roadmap);
    expect(output).toContain('**Parallel Groups**:');
    expect(output).toContain('- Group A: 1.1, 1.2 (all independent)');
  });

  it('should omit parallel groups section when empty', () => {
    const roadmap = makeRoadmap({
      phases: [
        makePhase({
          tasks: [
            {
              id: '0.1',
              description: 'Init',
              completed: false,
              dependencies: [],
              deliverable: 'pkg.json',
              complexity: 'trivial',
            },
          ],
          parallelGroups: [],
        }),
      ],
    });
    const output = generateRoadmap(roadmap);
    expect(output).not.toContain('**Parallel Groups**');
  });
});
