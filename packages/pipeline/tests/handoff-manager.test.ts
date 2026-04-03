import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  readHandoff,
  writeHandoff,
  appendTaskLog,
  updateCurrentState,
  HandoffReadError,
} from '../src/lib/handoff/manager.js';
import type { HandoffState, TaskLogEntry } from '../src/lib/handoff/types.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'handoff-test-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function makeState(overrides: Partial<HandoffState> = {}): HandoffState {
  return {
    sessionId: 'ses-001',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    currentState: {
      tasksCompleted: ['1.1'],
      packagesTouched: ['src/lib/roadmap'],
      branch: 'main',
      currentPhase: 1,
      status: 'in-progress',
    },
    goalContext: {
      problem: 'Build pipeline',
      userStory: 'As a dev...',
      specRequirement: 'Req 1.1',
      currentTask: 'Implement parser',
    },
    conventions: [
      {
        name: 'Error handling',
        pattern: 'Typed errors',
        rationale: 'Better debugging',
        usage: 'Extend Error',
      },
    ],
    architectureDecisions: [],
    openIssues: [],
    taskLog: [],
    compressedHistory: [],
    ...overrides,
  };
}

function makeEntry(id: string): TaskLogEntry {
  return {
    taskId: id,
    description: `Task ${id} done`,
    keyDecision: `Decision for ${id}`,
    filesModified: [`src/${id}.ts`],
    commitHash: `hash-${id}`,
    timestamp: '2025-01-01T00:00:00Z',
  };
}

describe('writeHandoff / readHandoff round-trip', () => {
  it('should write and read back equivalent state', async () => {
    const filePath = join(tempDir, 'HANDOFF.md');
    const state = makeState();
    await writeHandoff(filePath, state);

    const result = await readHandoff(filePath);
    expect(result.sessionId).toBe('ses-001');
    expect(result.currentState.branch).toBe('main');
    expect(result.conventions).toHaveLength(1);
    expect(result.conventions[0].name).toBe('Error handling');
  });

  it('should create parent directories', async () => {
    const filePath = join(tempDir, 'nested', 'dir', 'HANDOFF.md');
    await writeHandoff(filePath, makeState());

    const result = await readHandoff(filePath);
    expect(result.sessionId).toBe('ses-001');
  });

  it('should enforce task log bound of 5', async () => {
    const entries = Array.from({ length: 7 }, (_, i) => makeEntry(`${i + 1}`));
    const state = makeState({ taskLog: entries });
    const filePath = join(tempDir, 'HANDOFF.md');
    await writeHandoff(filePath, state);

    const result = await readHandoff(filePath);
    expect(result.taskLog).toHaveLength(5);
    // Should keep the last 5 (most recent)
    expect(result.taskLog[0].taskId).toBe('3');
    expect(result.taskLog[4].taskId).toBe('7');
  });

  it('should enforce compressed history bound of 10', async () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      taskRange: `Task ${i}`,
      summary: `Summary ${i}`,
      files: [`file-${i}.ts`],
    }));
    const state = makeState({ compressedHistory: history });
    const filePath = join(tempDir, 'HANDOFF.md');
    await writeHandoff(filePath, state);

    const result = await readHandoff(filePath);
    expect(result.compressedHistory).toHaveLength(10);
  });
});

describe('readHandoff errors', () => {
  it('should throw HandoffReadError for non-existent file', async () => {
    await expect(readHandoff(join(tempDir, 'nonexistent.md'))).rejects.toThrow(
      HandoffReadError
    );
  });

  it('should include filePath in HandoffReadError', async () => {
    const filePath = join(tempDir, 'nonexistent.md');
    try {
      await readHandoff(filePath);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HandoffReadError);
      expect((err as HandoffReadError).filePath).toBe(filePath);
    }
  });

  it('should throw HandoffReadError for file with no JSON block', async () => {
    const { writeFile } = await import('node:fs/promises');
    const filePath = join(tempDir, 'HANDOFF.md');
    await writeFile(filePath, '# HANDOFF\n\nNo JSON here.\n', 'utf-8');

    await expect(readHandoff(filePath)).rejects.toThrow(HandoffReadError);
  });

  it('should throw HandoffReadError for malformed JSON', async () => {
    const { writeFile } = await import('node:fs/promises');
    const filePath = join(tempDir, 'HANDOFF.md');
    await writeFile(
      filePath,
      '# HANDOFF\n\n```json\n{invalid json}\n```\n',
      'utf-8'
    );

    await expect(readHandoff(filePath)).rejects.toThrow(HandoffReadError);
  });
});

describe('appendTaskLog', () => {
  it('should append entry when fewer than 5', () => {
    const state = makeState({
      taskLog: [makeEntry('1'), makeEntry('2'), makeEntry('3')],
    });
    const result = appendTaskLog(state, makeEntry('4'));
    expect(result.taskLog).toHaveLength(4);
    expect(result.taskLog[3].taskId).toBe('4');
  });

  it('should evict oldest when at capacity (5)', () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`${i + 1}`));
    const state = makeState({ taskLog: entries });
    const result = appendTaskLog(state, makeEntry('6'));

    expect(result.taskLog).toHaveLength(5);
    expect(result.taskLog[0].taskId).toBe('2');
    expect(result.taskLog[4].taskId).toBe('6');
  });

  it('should compress evicted entry into compressed history', () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(`${i + 1}`));
    const state = makeState({ taskLog: entries, compressedHistory: [] });
    const result = appendTaskLog(state, makeEntry('6'));

    expect(result.compressedHistory).toHaveLength(1);
    expect(result.compressedHistory[0].taskRange).toBe('1');
    expect(result.compressedHistory[0].summary).toBe('Task 1 done');
    expect(result.compressedHistory[0].files).toEqual(['src/1.ts']);
  });
});

describe('updateCurrentState', () => {
  it('should merge partial update', () => {
    const state = makeState();
    const result = updateCurrentState(state, {
      tasksCompleted: ['3.1', '3.2'],
    });
    expect(result.currentState.tasksCompleted).toEqual(['3.1', '3.2']);
  });

  it('should preserve other fields', () => {
    const state = makeState();
    const result = updateCurrentState(state, { status: 'complete' });
    expect(result.currentState.branch).toBe('main');
    expect(result.currentState.status).toBe('complete');
  });

  it('should update the updatedAt timestamp', () => {
    const state = makeState({ updatedAt: '2025-01-01T00:00:00Z' });
    const result = updateCurrentState(state, { status: 'complete' });
    expect(result.updatedAt).not.toBe('2025-01-01T00:00:00Z');
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
