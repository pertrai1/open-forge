import { classifyTask } from '../src/lib/roadmap/classifyTask.js';

describe('classifyTask', () => {
  it('should classify trivial task — no dependencies, single simple deliverable', () => {
    expect(
      classifyTask({ description: 'Rename config file', dependencies: [] })
    ).toBe('trivial');
  });

  it('should classify simple task — few dependencies', () => {
    expect(
      classifyTask({
        description: 'Add logging utility',
        dependencies: ['0.1'],
      })
    ).toBe('simple');
  });

  it('should classify medium task — moderate dependencies', () => {
    expect(
      classifyTask({
        description: 'Implement authentication middleware',
        dependencies: ['1.1', '1.2', '1.3'],
      })
    ).toBe('medium');
  });

  it('should classify complex task — many dependencies', () => {
    expect(
      classifyTask({
        description: 'Implement orchestrator main loop',
        dependencies: ['4.1', '4.2', '4.3', '4.4', '4.5'],
      })
    ).toBe('complex');
  });

  it('should return same result for identical inputs (deterministic)', () => {
    const result1 = classifyTask({
      description: 'Add feature',
      dependencies: ['1.1'],
    });
    const result2 = classifyTask({
      description: 'Add feature',
      dependencies: ['1.1'],
    });
    expect(result1).toBe(result2);
  });

  it('should classify zero dependencies as trivial', () => {
    expect(classifyTask({ description: 'Simple task', dependencies: [] })).toBe(
      'trivial'
    );
  });

  it('should classify five or more dependencies as complex', () => {
    expect(
      classifyTask({
        description: 'Task',
        dependencies: ['1', '2', '3', '4', '5'],
      })
    ).toBe('complex');
  });

  it('should elevate classification for architectural keywords', () => {
    expect(
      classifyTask({
        description: 'Architect the system redesign',
        dependencies: ['1.1', '1.2'],
      })
    ).toBe('complex');
  });

  it('should never lower classification based on keywords', () => {
    // "Simple" in description should not lower from medium (4 deps → medium)
    expect(
      classifyTask({
        description: 'Simple config rename',
        dependencies: ['1', '2', '3', '4'],
      })
    ).toBe('medium');
  });
});
