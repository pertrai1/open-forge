import { detectParallelGroups } from '../src/lib/roadmap/detectParallelGroups.js';
import type { RoadmapTask } from '../src/lib/roadmap/types.js';

function makeTask(
  overrides: Partial<RoadmapTask> & Pick<RoadmapTask, 'id'>
): RoadmapTask {
  return {
    description: `Task ${overrides.id}`,
    completed: false,
    dependencies: [],
    deliverable: `${overrides.id}.ts`,
    complexity: 'medium',
    ...overrides,
  };
}

describe('detectParallelGroups', () => {
  it('should put all independent tasks in one group', () => {
    const tasks = [
      makeTask({ id: '0.1' }),
      makeTask({ id: '0.2' }),
      makeTask({ id: '0.3' }),
      makeTask({ id: '0.4' }),
    ];
    const groups = detectParallelGroups(tasks);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Group A');
    expect(groups[0].taskIds).toEqual(['0.1', '0.2', '0.3', '0.4']);
  });

  it('should create separate groups for linear dependency chain', () => {
    const tasks = [
      makeTask({ id: '1.1' }),
      makeTask({ id: '1.2', dependencies: ['1.1'] }),
      makeTask({ id: '1.3', dependencies: ['1.2'] }),
    ];
    const groups = detectParallelGroups(tasks);
    expect(groups).toHaveLength(3);
    expect(groups[0].taskIds).toEqual(['1.1']);
    expect(groups[1].taskIds).toEqual(['1.2']);
    expect(groups[2].taskIds).toEqual(['1.3']);
  });

  it('should group mixed independent and dependent tasks', () => {
    const tasks = [
      makeTask({ id: '2.1' }),
      makeTask({ id: '2.2' }),
      makeTask({ id: '2.3' }),
      makeTask({ id: '2.4', dependencies: ['2.1'] }),
      makeTask({ id: '2.5', dependencies: ['2.1'] }),
    ];
    const groups = detectParallelGroups(tasks);
    expect(groups).toHaveLength(2);
    expect(groups[0].taskIds).toContain('2.1');
    expect(groups[0].taskIds).toContain('2.2');
    expect(groups[0].taskIds).toContain('2.3');
    expect(groups[1].taskIds).toContain('2.4');
    expect(groups[1].taskIds).toContain('2.5');
  });

  it('should assign sequential group names', () => {
    const tasks = [
      makeTask({ id: '1.1' }),
      makeTask({ id: '1.2', dependencies: ['1.1'] }),
      makeTask({ id: '1.3', dependencies: ['1.2'] }),
    ];
    const groups = detectParallelGroups(tasks);
    expect(groups[0].name).toBe('Group A');
    expect(groups[1].name).toBe('Group B');
    expect(groups[2].name).toBe('Group C');
  });

  it('should generate "all independent" note for group with no intra-phase deps', () => {
    const tasks = [makeTask({ id: '0.1' }), makeTask({ id: '0.2' })];
    const groups = detectParallelGroups(tasks);
    expect(groups[0].note).toBe('all independent');
  });

  it('should ignore cross-phase dependencies', () => {
    const tasks = [
      makeTask({ id: '2.1', dependencies: ['1.1'] }), // 1.1 not in this list
      makeTask({ id: '2.2' }),
    ];
    const groups = detectParallelGroups(tasks);
    // Both should be in the first group since 1.1 is cross-phase
    expect(groups).toHaveLength(1);
    expect(groups[0].taskIds).toContain('2.1');
    expect(groups[0].taskIds).toContain('2.2');
  });

  it('should return empty array for empty task list', () => {
    const groups = detectParallelGroups([]);
    expect(groups).toEqual([]);
  });
});
