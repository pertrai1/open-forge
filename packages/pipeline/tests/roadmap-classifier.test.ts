import { classifyTask } from '../src/lib/roadmap/classifier.js';

describe('classifyTask', () => {
  it('should classify trivial task — no dependencies, single simple deliverable', () => {
    expect(classifyTask('Rename config file', [], 'tsconfig.json')).toBe(
      'trivial'
    );
  });

  it('should classify simple task — few dependencies', () => {
    expect(
      classifyTask('Add logging utility', ['0.1'], 'src/lib/logger.ts')
    ).toBe('simple');
  });

  it('should classify medium task — moderate dependencies', () => {
    expect(
      classifyTask(
        'Implement authentication middleware',
        ['1.1', '1.2', '1.3'],
        'src/lib/auth/middleware.ts - validateToken(), refreshSession()'
      )
    ).toBe('medium');
  });

  it('should classify complex task — many dependencies', () => {
    expect(
      classifyTask(
        'Implement orchestrator main loop',
        ['4.1', '4.2', '4.3', '4.4', '4.5'],
        'src/lib/orchestrator/index.ts'
      )
    ).toBe('complex');
  });

  it('should return same result for identical inputs (deterministic)', () => {
    const result1 = classifyTask('Add feature', ['1.1'], 'src/feature.ts');
    const result2 = classifyTask('Add feature', ['1.1'], 'src/feature.ts');
    expect(result1).toBe(result2);
  });

  it('should classify zero dependencies as trivial', () => {
    expect(classifyTask('Simple task', [], 'file.ts')).toBe('trivial');
  });

  it('should classify five or more dependencies as complex', () => {
    expect(classifyTask('Task', ['1', '2', '3', '4', '5'], 'file.ts')).toBe(
      'complex'
    );
  });

  it('should elevate classification for architectural keywords', () => {
    expect(
      classifyTask(
        'Architect the system redesign',
        ['1.1', '1.2'],
        'src/arch.ts'
      )
    ).toBe('complex');
  });

  it('should never lower classification based on keywords', () => {
    // "Simple" in description should not lower from medium (4 deps → medium)
    expect(
      classifyTask('Simple config rename', ['1', '2', '3', '4'], 'file.ts')
    ).toBe('medium');
  });
});
