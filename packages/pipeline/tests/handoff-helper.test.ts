import {
  getActiveConventions,
  getWakeContext,
  getLastCommit,
} from '../src/lib/helper/handoff.js';
import type { HandoffState } from '../src/lib/handoff/types.js';

function makeState(overrides: Partial<HandoffState> = {}): HandoffState {
  return {
    sessionId: 'ses-123',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    currentState: {
      tasksCompleted: ['1.1', '1.2'],
      packagesTouched: ['src/lib/roadmap', 'src/lib/handoff'],
      branch: 'feat/phase-3',
      currentPhase: 3,
      status: 'in-progress',
    },
    goalContext: {
      problem: 'Build pipeline',
      userStory: 'As a dev, I want autonomous execution',
      specRequirement: 'Req 3.1',
      currentTask: 'Implement handoff manager',
    },
    conventions: [
      {
        name: 'Error handling',
        pattern: 'Typed errors',
        rationale: 'Better debugging',
        usage: 'Extend Error',
      },
      {
        name: 'Import style',
        pattern: '.js extensions',
        rationale: 'NodeNext',
        usage: 'Always use .js',
      },
    ],
    architectureDecisions: [],
    openIssues: [
      { description: 'Blocker: missing type', resolved: false },
      { description: 'Fixed: typo', resolved: true },
      { description: 'Open: perf issue', resolved: false },
    ],
    taskLog: [
      {
        taskId: '3.1',
        description: 'Implement handoff manager',
        keyDecision: 'JSON in markdown',
        filesModified: ['src/lib/handoff/manager.ts'],
        commitHash: 'abc1234',
        timestamp: '2025-01-01T10:00:00Z',
      },
    ],
    compressedHistory: [],
    ...overrides,
  };
}

describe('getActiveConventions', () => {
  it('should return conventions from state', () => {
    const result = getActiveConventions(makeState());
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Error handling');
    expect(result[1].name).toBe('Import style');
  });

  it('should return empty array when no conventions', () => {
    const result = getActiveConventions(makeState({ conventions: [] }));
    expect(result).toEqual([]);
  });
});

describe('getWakeContext', () => {
  it('should build complete wake context', () => {
    const state = makeState();
    const result = getWakeContext({
      state,
      nextTask: '3.2 — Implement helper',
      progress: '1/8 tasks complete',
    });

    expect(result.changeName).toBe('ses-123');
    expect(result.branch).toBe('feat/phase-3');
    expect(result.nextTask).toBe('3.2 — Implement helper');
    expect(result.progress).toBe('1/8 tasks complete');
    expect(result.packagesTouched).toEqual([
      'src/lib/roadmap',
      'src/lib/handoff',
    ]);
    expect(result.activeConventions).toEqual([
      'Error handling',
      'Import style',
    ]);
  });

  it('should filter resolved issues', () => {
    const state = makeState();
    const result = getWakeContext({
      state,
      nextTask: 'next',
      progress: 'progress',
    });
    // 3 issues total, 1 resolved → 2 unresolved
    expect(result.openIssues).toHaveLength(2);
    expect(result.openIssues).toContain('Blocker: missing type');
    expect(result.openIssues).toContain('Open: perf issue');
    expect(result.openIssues).not.toContain('Fixed: typo');
  });

  it('should return empty openIssues when all resolved', () => {
    const state = makeState({
      openIssues: [{ description: 'Fixed', resolved: true }],
    });
    const result = getWakeContext({
      state,
      nextTask: 'next',
      progress: 'progress',
    });
    expect(result.openIssues).toEqual([]);
  });

  it('should summarize goal context', () => {
    const result = getWakeContext({
      state: makeState(),
      nextTask: 'next',
      progress: 'progress',
    });
    expect(result.goalContext).toContain('Build pipeline');
    expect(result.goalContext).toContain('As a dev');
    expect(result.goalContext).toContain('Req 3.1');
  });
});

describe('getLastCommit', () => {
  it('should return last commit hash and description', () => {
    const result = getLastCommit(makeState());
    expect(result).toBe('abc1234 — Implement handoff manager');
  });

  it('should return empty string when no task log', () => {
    const result = getLastCommit(makeState({ taskLog: [] }));
    expect(result).toBe('');
  });

  it('should handle empty commit hash', () => {
    const state = makeState({
      taskLog: [
        {
          taskId: '1.1',
          description: 'Something',
          keyDecision: 'none',
          filesModified: [],
          commitHash: '',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ],
    });
    const result = getLastCommit(state);
    expect(result).toBe('(no commit) — Something');
  });
});
