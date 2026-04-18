import { describe, it, expect } from 'vitest';

import type { PipelineEvent } from '../src/types.js';
import { threshold, boolean, aggregation } from '../src/constraints/builder.js';

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

describe('threshold', () => {
  it('should default scope to pipeline and pass when gt comparison is false', () => {
    const constraint = threshold({
      name: 'max-duration',
      value: 500,
      operator: 'gt',
      extract: () => 500,
    });

    expect(constraint.name).toBe('max-duration');
    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check([])).toEqual({ passed: true });
  });

  it('should fail when gt comparison is true', () => {
    const events = [
      makeEvent({ durationMs: 250 }),
      makeEvent({ durationMs: 500 }),
    ];
    const constraint = threshold({
      name: 'max-duration',
      description: 'Duration must stay below limit',
      value: 700,
      operator: 'gt',
      extract: () => 750,
      scope: 'stage',
    });

    expect(constraint.description).toBe('Duration must stay below limit');
    expect(constraint.scope).toBe('stage');
    expect(constraint.check(events)).toEqual({
      passed: false,
      actualValue: 750,
      threshold: 700,
      message: 'Threshold exceeded: 750 gt 700',
    });
  });

  it('should fail when gte comparison is true at the boundary', () => {
    const constraint = threshold({
      name: 'max-retries',
      value: 3,
      operator: 'gte',
      extract: () => 3,
    });

    expect(constraint.check([])).toEqual({
      passed: false,
      actualValue: 3,
      threshold: 3,
      message: 'Threshold exceeded: 3 gte 3',
    });
  });

  it('should fail when lt comparison is true', () => {
    const constraint = threshold({
      name: 'min-events',
      value: 2,
      operator: 'lt',
      extract: () => 1,
    });

    expect(constraint.check([])).toEqual({
      passed: false,
      actualValue: 1,
      threshold: 2,
      message: 'Threshold exceeded: 1 lt 2',
    });
  });

  it('should fail when lte comparison is true at the boundary', () => {
    const constraint = threshold({
      name: 'min-successes',
      value: 0,
      operator: 'lte',
      extract: () => 0,
    });

    expect(constraint.check([])).toEqual({
      passed: false,
      actualValue: 0,
      threshold: 0,
      message: 'Threshold exceeded: 0 lte 0',
    });
  });

  it('should fail when eq comparison is true', () => {
    const constraint = threshold({
      name: 'forbidden-escalations',
      value: 1,
      operator: 'eq',
      extract: () => 1,
    });

    expect(constraint.check([])).toEqual({
      passed: false,
      actualValue: 1,
      threshold: 1,
      message: 'Threshold exceeded: 1 eq 1',
    });
  });
});

describe('boolean', () => {
  it('should default scope to pipeline and pass when assertion returns true', () => {
    const events = [makeEvent({ action: 'complete' })];
    const constraint = boolean({
      name: 'has-complete-event',
      assert: (inputEvents) => inputEvents[0]?.action === 'complete',
    });

    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check(events)).toEqual({ passed: true });
  });

  it('should fail with the provided message when assertion returns false', () => {
    const constraint = boolean({
      name: 'no-failures',
      description: 'Pipeline should not fail',
      assert: () => false,
      message: 'Failure events detected',
      scope: 'stage',
    });

    expect(constraint.description).toBe('Pipeline should not fail');
    expect(constraint.scope).toBe('stage');
    expect(constraint.check([])).toEqual({
      passed: false,
      message: 'Failure events detected',
    });
  });

  it('should fail with a default message when assertion returns false without a message', () => {
    const constraint = boolean({
      name: 'has-events',
      assert: (events) => events.length > 0,
    });

    expect(constraint.check([])).toEqual({
      passed: false,
      message: 'Assertion failed: has-events',
    });
  });
});

describe('aggregation', () => {
  it('should default scope to pipeline and fail for sum with gt comparison', () => {
    const events = [
      makeEvent({ durationMs: 100 }),
      makeEvent({ durationMs: 200 }),
      makeEvent({ durationMs: 300 }),
    ];
    const constraint = aggregation({
      name: 'duration-budget',
      value: 500,
      operator: 'gt',
      fn: 'sum',
      extract: (event) => event.durationMs ?? 0,
    });

    expect(constraint.scope).toBe('pipeline');
    expect(constraint.check(events)).toEqual({
      passed: false,
      actualValue: 600,
      threshold: 500,
      message: 'Aggregation threshold exceeded: 600 gt 500',
    });
  });

  it('should fail for count with gte comparison at the boundary', () => {
    const events = [
      makeEvent(),
      makeEvent({ stage: 'test' }),
      makeEvent({ stage: 'qa' }),
    ];
    const constraint = aggregation({
      name: 'max-events',
      value: 3,
      operator: 'gte',
      fn: 'count',
      extract: () => 999,
      scope: 'stage',
    });

    expect(constraint.scope).toBe('stage');
    expect(constraint.check(events)).toEqual({
      passed: false,
      actualValue: 3,
      threshold: 3,
      message: 'Aggregation threshold exceeded: 3 gte 3',
    });
  });

  it('should fail for avg with lt comparison', () => {
    const events = [
      makeEvent({ durationMs: 10 }),
      makeEvent({ durationMs: 20 }),
    ];
    const constraint = aggregation({
      name: 'minimum-average-duration',
      value: 20,
      operator: 'lt',
      fn: 'avg',
      extract: (event) => event.durationMs ?? 0,
    });

    expect(constraint.check(events)).toEqual({
      passed: false,
      actualValue: 15,
      threshold: 20,
      message: 'Aggregation threshold exceeded: 15 lt 20',
    });
  });

  it('should fail for avg with lte comparison when events are empty', () => {
    const constraint = aggregation({
      name: 'minimum-average-tokens',
      value: 0,
      operator: 'lte',
      fn: 'avg',
      extract: (event) => event.tokenUsage?.completion ?? 0,
    });

    expect(constraint.check([])).toEqual({
      passed: false,
      actualValue: 0,
      threshold: 0,
      message: 'Aggregation threshold exceeded: 0 lte 0',
    });
  });

  it('should fail for sum with eq comparison', () => {
    const events = [
      makeEvent({ durationMs: 100 }),
      makeEvent({ durationMs: 150 }),
      makeEvent({ durationMs: 50 }),
    ];
    const constraint = aggregation({
      name: 'exact-duration-budget',
      value: 300,
      operator: 'eq',
      fn: 'sum',
      extract: (event) => event.durationMs ?? 0,
    });

    expect(constraint.check(events)).toEqual({
      passed: false,
      actualValue: 300,
      threshold: 300,
      message: 'Aggregation threshold exceeded: 300 eq 300',
    });
  });

  it('should pass when aggregation comparison is false', () => {
    const events = [
      makeEvent({ durationMs: 100 }),
      makeEvent({ durationMs: 200 }),
    ];
    const constraint = aggregation({
      name: 'duration-budget',
      value: 400,
      operator: 'gt',
      fn: 'sum',
      extract: (event) => event.durationMs ?? 0,
    });

    expect(constraint.check(events)).toEqual({ passed: true });
  });
});
