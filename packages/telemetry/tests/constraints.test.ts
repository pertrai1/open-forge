import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Constraint, EventFilter, PipelineEvent } from '../src/types.js';
import type { StorageBackend } from '../src/storage/StorageBackend.js';
import { ConstraintEvaluatorImpl } from '../src/ConstraintEvaluatorImpl.js';
import { MemoryStorageBackend } from '../src/storage/MemoryStorageBackend.js';

function makeEvent(overrides: Partial<PipelineEvent> = {}): PipelineEvent {
  return {
    timestamp: '2024-06-15T10:00:00.000Z',
    pipelineId: 'pipeline-1',
    phase: 1,
    stage: 'plan',
    action: 'start',
    ...overrides,
  };
}

class RecordingStorageBackend implements StorageBackend {
  readonly queries: EventFilter[] = [];

  constructor(private readonly events: PipelineEvent[]) {}

  async append(event: PipelineEvent): Promise<void> {
    this.events.push(event);
  }

  async query(filter: EventFilter): Promise<PipelineEvent[]> {
    this.queries.push(filter);
    return this.events;
  }

  async count(_filter: EventFilter): Promise<number> {
    return this.events.length;
  }
}

describe('ConstraintEvaluatorImpl', () => {
  let evaluator: ConstraintEvaluatorImpl;

  beforeEach(() => {
    evaluator = new ConstraintEvaluatorImpl(new MemoryStorageBackend());
  });

  it('returns a passing result with an ISO timestamp when no constraints are registered', async () => {
    const result = await evaluator.evaluate('pipeline-1');

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
    expect(new Date(result.evaluatedAt).toISOString()).toBe(result.evaluatedAt);
  });

  it('replaces an existing constraint when a new one uses the same name', async () => {
    const first: Constraint = {
      name: 'max-events',
      scope: 'pipeline',
      check: () => ({ passed: true }),
    };
    const replacement: Constraint = {
      name: 'max-events',
      scope: 'pipeline',
      check: () => ({
        passed: false,
        message: 'replacement constraint failed',
      }),
    };

    evaluator.addConstraint(first);
    evaluator.addConstraint(replacement);

    const result = await evaluator.evaluate('pipeline-1');

    expect(result.passed).toBe(false);
    expect(result.violations).toEqual([
      {
        constraintName: 'max-events',
        message: 'replacement constraint failed',
        severity: 'error',
      },
    ]);
  });

  it('treats removing an unknown constraint as a no-op and removes existing constraints', async () => {
    evaluator.addConstraint({
      name: 'blocker',
      scope: 'pipeline',
      check: () => ({ passed: false, message: 'should not run' }),
    });

    evaluator.removeConstraint('missing-constraint');
    evaluator.removeConstraint('blocker');

    const result = await evaluator.evaluate('pipeline-1');

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('queries storage once and returns a passing result when all constraints pass', async () => {
    const events = [
      makeEvent({
        timestamp: '2024-06-15T10:00:00.000Z',
        stage: 'plan',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:01:00.000Z',
        stage: 'plan',
        action: 'complete',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:02:00.000Z',
        stage: 'test',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:03:00.000Z',
        stage: 'test',
        action: 'complete',
      }),
    ];
    const storage = new RecordingStorageBackend(events);
    const pipelineCheck = vi.fn(() => ({ passed: true }));
    const stageCheck = vi.fn(() => ({ passed: true }));
    const localEvaluator = new ConstraintEvaluatorImpl(storage);

    localEvaluator.addConstraint({
      name: 'pipeline-budget',
      scope: 'pipeline',
      check: pipelineCheck,
    });
    localEvaluator.addConstraint({
      name: 'stage-budget',
      scope: 'stage',
      check: stageCheck,
    });

    const result = await localEvaluator.evaluate('pipeline-1');

    expect(storage.queries).toEqual([{ pipelineId: 'pipeline-1' }]);
    expect(pipelineCheck).toHaveBeenCalledTimes(1);
    expect(pipelineCheck).toHaveBeenCalledWith(events);
    expect(stageCheck).toHaveBeenCalledTimes(2);
    expect(stageCheck.mock.calls).toEqual([
      [[events[0], events[1]]],
      [[events[2], events[3]]],
    ]);
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('returns violations for every failing pipeline and stage constraint with default error severity', async () => {
    const storage = new RecordingStorageBackend([
      makeEvent({
        timestamp: '2024-06-15T10:00:00.000Z',
        stage: 'plan',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:01:00.000Z',
        stage: 'plan',
        action: 'complete',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:02:00.000Z',
        stage: 'test',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:03:00.000Z',
        stage: 'test',
        action: 'complete',
      }),
    ]);
    const localEvaluator = new ConstraintEvaluatorImpl(storage);

    localEvaluator.addConstraint({
      name: 'total-event-limit',
      scope: 'pipeline',
      check: () => ({
        passed: false,
        message: 'Pipeline exceeded total event limit',
      }),
    });
    localEvaluator.addConstraint({
      name: 'completed-stage-limit',
      scope: 'stage',
      check: () => ({
        passed: false,
        message: 'Stage exceeded completion limit',
      }),
    });

    const result = await localEvaluator.evaluate('pipeline-1');

    expect(result.passed).toBe(false);
    expect(result.violations).toEqual([
      {
        constraintName: 'total-event-limit',
        message: 'Pipeline exceeded total event limit',
        severity: 'error',
      },
      {
        constraintName: 'completed-stage-limit',
        stage: 'plan',
        message: 'Stage exceeded completion limit',
        severity: 'error',
      },
      {
        constraintName: 'completed-stage-limit',
        stage: 'test',
        message: 'Stage exceeded completion limit',
        severity: 'error',
      },
    ]);
  });

  it('only evaluates completed stages and returns mixed pass/fail results across constraints', async () => {
    const events = [
      makeEvent({
        timestamp: '2024-06-15T10:00:00.000Z',
        stage: 'plan',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:01:00.000Z',
        stage: 'plan',
        action: 'retry',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:02:00.000Z',
        stage: 'plan',
        action: 'complete',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:03:00.000Z',
        stage: 'test',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:04:00.000Z',
        stage: 'qa',
        action: 'start',
      }),
      makeEvent({
        timestamp: '2024-06-15T10:05:00.000Z',
        stage: 'qa',
        action: 'complete',
      }),
    ];
    const seenStages: PipelineEvent[][] = [];
    const localEvaluator = new ConstraintEvaluatorImpl(
      new RecordingStorageBackend(events)
    );

    localEvaluator.addConstraint({
      name: 'pipeline-order',
      scope: 'pipeline',
      check: () => ({ passed: true }),
    });
    localEvaluator.addConstraint({
      name: 'retry-budget',
      scope: 'stage',
      check: (stageEvents) => {
        seenStages.push(stageEvents);
        if (stageEvents[0]?.stage === 'plan') {
          return {
            passed: false,
            message: 'Plan stage retried too many times',
          };
        }

        return { passed: true };
      },
    });

    const result = await localEvaluator.evaluate('pipeline-1');

    expect(seenStages).toEqual([
      [events[0], events[1], events[2]],
      [events[4], events[5]],
    ]);
    expect(result.passed).toBe(false);
    expect(result.violations).toEqual([
      {
        constraintName: 'retry-budget',
        stage: 'plan',
        message: 'Plan stage retried too many times',
        severity: 'error',
      },
    ]);
  });
});
