import { describe, it, expect } from 'vitest';
import type { PipelineEvent, StageName, Constraint } from '../src/index.js';

describe('telemetry types', () => {
  it('should allow creating a valid PipelineEvent', () => {
    const event: PipelineEvent = {
      timestamp: new Date().toISOString(),
      pipelineId: 'test-pipeline',
      phase: 1,
      stage: 'plan',
      action: 'start',
    };

    expect(event.pipelineId).toBe('test-pipeline');
    expect(event.action).toBe('start');
  });

  it('should allow all stage names', () => {
    const stages: StageName[] = [
      'intent-router',
      'roadmap',
      'plan',
      'test',
      'implement',
      'qa',
      'security',
      'architect',
      'review',
      'integration',
      'cleanup',
    ];

    expect(stages).toHaveLength(11);
  });

  it('should allow defining a constraint', () => {
    const constraint: Constraint = {
      name: 'max-retries',
      scope: 'stage',
      check: (events) => ({
        passed: events.length < 3,
        message: events.length >= 3 ? 'Too many retries' : undefined,
      }),
    };

    expect(constraint.name).toBe('max-retries');
    expect(constraint.check([]).passed).toBe(true);
  });
});
