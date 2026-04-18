import { describe, expect, it } from 'vitest';

import type { PipelineEvent } from '../src/types.js';
import {
  createConsecutiveFailuresConstraint,
  createDefaultConstraints,
  createDurationConstraint,
  createLintViolationsConstraint,
  createMaxRetriesConstraint,
  createTokenBudgetConstraint,
} from '../src/constraints/defaults.js';

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

describe('createMaxRetriesConstraint', () => {
  it('returns the expected metadata and passes with no retry events', () => {
    const constraint = createMaxRetriesConstraint(2);

    expect(constraint.name).toBe('max-retries');
    expect(constraint.description).toBe(
      'Ensures pipeline retry attempts do not exceed the configured maximum.'
    );
    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check([])).toEqual({ passed: true });
  });

  it('passes when retry count is exactly at the threshold', () => {
    const constraint = createMaxRetriesConstraint(2);
    const events = [
      makeEvent({ action: 'retry' }),
      makeEvent({ action: 'retry', phase: 2 }),
    ];

    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('fails when retry count is just over the threshold', () => {
    const constraint = createMaxRetriesConstraint(2);
    const events = [
      makeEvent({ action: 'retry' }),
      makeEvent({ action: 'retry', phase: 2 }),
      makeEvent({ action: 'retry', phase: 3 }),
    ];

    expect(constraint.check(events)).toEqual({
      passed: false,
      message: 'Max retries exceeded: 3 > 2',
      actualValue: 3,
      threshold: 2,
    });
  });
});

describe('createTokenBudgetConstraint', () => {
  it('returns the expected metadata and treats missing token usage as zero', () => {
    const constraint = createTokenBudgetConstraint(100);
    const events = [
      makeEvent(),
      makeEvent({ phase: 2, tokenUsage: undefined }),
    ];

    expect(constraint.name).toBe('token-budget');
    expect(constraint.description).toBe(
      'Ensures total token usage stays within the configured pipeline budget.'
    );
    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('passes when total token usage is exactly at the threshold', () => {
    const constraint = createTokenBudgetConstraint(300);
    const events = [
      makeEvent({ tokenUsage: { prompt: 100, completion: 50 } }),
      makeEvent({ phase: 2, tokenUsage: { prompt: 75, completion: 75 } }),
    ];

    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('fails when total token usage is just over the threshold', () => {
    const constraint = createTokenBudgetConstraint(300);
    const events = [
      makeEvent({ tokenUsage: { prompt: 100, completion: 50 } }),
      makeEvent({ phase: 2, tokenUsage: { prompt: 120, completion: 31 } }),
      makeEvent({ phase: 3 }),
    ];

    expect(constraint.check(events)).toEqual({
      passed: false,
      message: 'Token budget exceeded: 301 > 300',
      actualValue: 301,
      threshold: 300,
    });
  });
});

describe('createDurationConstraint', () => {
  it('returns the expected metadata and skips events without a completed duration', () => {
    const constraint = createDurationConstraint(1_000);
    const events = [
      makeEvent({ action: 'start', durationMs: 5_000 }),
      makeEvent({ action: 'complete', phase: 2, durationMs: undefined }),
    ];

    expect(constraint.name).toBe('duration-limit');
    expect(constraint.description).toBe(
      'Ensures completed stages do not exceed the configured duration limit.'
    );
    expect(constraint.scope).toBe('stage');
    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('passes when a completed stage duration is exactly at the threshold', () => {
    const constraint = createDurationConstraint(1_000);
    const events = [
      makeEvent({ action: 'complete', durationMs: 1_000, stage: 'test' }),
    ];

    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('fails when a completed stage duration is just over the threshold', () => {
    const constraint = createDurationConstraint(1_000);
    const events = [
      makeEvent({ action: 'complete', durationMs: 1_001, stage: 'qa' }),
    ];

    expect(constraint.check(events)).toEqual({
      passed: false,
      message: 'Stage duration exceeded for qa: 1001ms > 1000ms',
      actualValue: 1_001,
      threshold: 1_000,
    });
  });
});

describe('createConsecutiveFailuresConstraint', () => {
  it('returns the expected metadata and passes with no failures', () => {
    const constraint = createConsecutiveFailuresConstraint(2);

    expect(constraint.name).toBe('consecutive-failures');
    expect(constraint.description).toBe(
      'Ensures pipelines do not accumulate too many consecutive failures.'
    );
    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check([])).toEqual({ passed: true });
  });

  it('passes at the boundary when complete events reset the failure streak', () => {
    const constraint = createConsecutiveFailuresConstraint(2);
    const events = [
      makeEvent({ action: 'fail' }),
      makeEvent({ action: 'fail', phase: 2 }),
      makeEvent({ action: 'complete', phase: 3 }),
      makeEvent({ action: 'fail', phase: 4 }),
      makeEvent({ action: 'fail', phase: 5 }),
    ];

    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('counts consecutive failures across non-complete actions (retry does not reset)', () => {
    const constraint = createConsecutiveFailuresConstraint(2);
    const events = [
      makeEvent({ action: 'fail' }),
      makeEvent({ action: 'retry', phase: 2 }),
      makeEvent({ action: 'fail', phase: 3 }),
      makeEvent({ action: 'fail', phase: 4 }),
    ];

    expect(constraint.check(events)).toEqual({
      passed: false,
      message: 'Consecutive failures exceeded: 3 > 2',
      actualValue: 3,
      threshold: 2,
    });
  });
});

describe('createLintViolationsConstraint', () => {
  it('returns the expected metadata and treats missing lint metadata as zero', () => {
    const constraint = createLintViolationsConstraint(5);
    const events = [
      makeEvent(),
      makeEvent({ phase: 2, metadata: {} }),
      makeEvent({ phase: 3, metadata: { lintViolations: 0 } }),
    ];

    expect(constraint.name).toBe('lint-violations');
    expect(constraint.description).toBe(
      'Ensures total lint violations stay within the configured maximum.'
    );
    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('passes when total lint violations are exactly at the threshold', () => {
    const constraint = createLintViolationsConstraint(5);
    const events = [
      makeEvent({ metadata: { lintViolations: 2 } }),
      makeEvent({ phase: 2, metadata: { lintViolations: 3 } }),
    ];

    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('fails when total lint violations are just over the threshold', () => {
    const constraint = createLintViolationsConstraint(5);
    const events = [
      makeEvent({ metadata: { lintViolations: 2 } }),
      makeEvent({ phase: 2, metadata: { lintViolations: 4 } }),
    ];

    expect(constraint.check(events)).toEqual({
      passed: false,
      message: 'Lint violations exceeded: 6 > 5',
      actualValue: 6,
      threshold: 5,
    });
  });
});

describe('createDefaultConstraints', () => {
  it('returns all default constraints in the expected order', () => {
    const constraints = createDefaultConstraints();

    expect(constraints.map((constraint) => constraint.name)).toEqual([
      'max-retries',
      'token-budget',
      'duration-limit',
      'consecutive-failures',
      'lint-violations',
    ]);

    expect(constraints.map((constraint) => constraint.scope)).toEqual([
      'pipeline',
      'pipeline',
      'stage',
      'pipeline',
      'pipeline',
    ]);

    expect(
      constraints[0]?.check([
        makeEvent({ action: 'retry' }),
        makeEvent({ action: 'retry', phase: 2 }),
        makeEvent({ action: 'retry', phase: 3 }),
        makeEvent({ action: 'retry', phase: 4 }),
      ])
    ).toEqual({
      passed: false,
      message: 'Max retries exceeded: 4 > 3',
      actualValue: 4,
      threshold: 3,
    });

    expect(
      constraints[1]?.check([
        makeEvent({ tokenUsage: { prompt: 30_000, completion: 10_000 } }),
        makeEvent({
          phase: 2,
          tokenUsage: { prompt: 5_000, completion: 5_001 },
        }),
      ])
    ).toEqual({
      passed: false,
      message: 'Token budget exceeded: 50001 > 50000',
      actualValue: 50_001,
      threshold: 50_000,
    });
  });

  it('applies partial overrides without changing the remaining defaults', () => {
    const constraints = createDefaultConstraints({
      maxRetries: 1,
      maxDurationMs: 500,
    });

    expect(
      constraints[0]?.check([
        makeEvent({ action: 'retry' }),
        makeEvent({ action: 'retry', phase: 2 }),
      ])
    ).toEqual({
      passed: false,
      message: 'Max retries exceeded: 2 > 1',
      actualValue: 2,
      threshold: 1,
    });

    expect(
      constraints[2]?.check([
        makeEvent({ action: 'complete', durationMs: 501, stage: 'review' }),
      ])
    ).toEqual({
      passed: false,
      message: 'Stage duration exceeded for review: 501ms > 500ms',
      actualValue: 501,
      threshold: 500,
    });

    expect(
      constraints[4]?.check([makeEvent({ metadata: { lintViolations: 11 } })])
    ).toEqual({
      passed: false,
      message: 'Lint violations exceeded: 11 > 10',
      actualValue: 11,
      threshold: 10,
    });
  });
});
