import { describe, it, expect } from 'vitest';

import type { PipelineEvent } from '../src/types.js';
import { ConstraintEvaluatorImpl } from '../src/ConstraintEvaluatorImpl.js';
import { MemoryStorageBackend } from '../src/storage/MemoryStorageBackend.js';

const STAGES = ['plan', 'implement', 'test', 'review', 'qa'] as const;

function makeEvent(index: number): PipelineEvent {
  const stage = STAGES[index % STAGES.length]!;
  return {
    timestamp: new Date(Date.now() + index).toISOString(),
    pipelineId: 'perf-pipeline',
    phase: 1,
    stage,
    action: index % 5 === 4 ? 'complete' : 'start',
    durationMs: index,
    tokenUsage: { prompt: index * 10, completion: index * 5 },
  };
}

async function seedEvents(
  evaluator: ConstraintEvaluatorImpl,
  count: number
): Promise<void> {
  const storage = (evaluator as unknown as { storage: MemoryStorageBackend })
    .storage;
  for (let i = 0; i < count; i++) {
    await storage.append(makeEvent(i));
  }
}

describe('ConstraintEvaluatorImpl performance (NF-002)', () => {
  it('completes evaluate() under 50ms with 10 constraints and 1000 events', async () => {
    const storage = new MemoryStorageBackend();
    const evaluator = new ConstraintEvaluatorImpl(storage);

    // Register 10 constraints (mix of pipeline and stage scope)
    for (let i = 0; i < 5; i++) {
      evaluator.addConstraint({
        name: `pipeline-constraint-${i}`,
        scope: 'pipeline',
        check: (events) => {
          const total = events.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);
          return { passed: total < 10_000_000 };
        },
      });
    }

    for (let i = 0; i < 5; i++) {
      evaluator.addConstraint({
        name: `stage-constraint-${i}`,
        scope: 'stage',
        check: (events) => {
          return { passed: events.length < 10_000 };
        },
      });
    }

    // Seed 1000 events
    await seedEvents(evaluator, 1000);

    // Warm up
    await evaluator.evaluate('perf-pipeline');

    // Measure p99: run 100 iterations, 99th percentile must be < 50ms
    const durations: number[] = [];
    for (let run = 0; run < 100; run++) {
      const start = performance.now();
      await evaluator.evaluate('perf-pipeline');
      durations.push(performance.now() - start);
    }

    durations.sort((a, b) => a - b);
    const p99 = durations[98]!; // index 98 = 99th percentile of 100 samples

    expect(p99).toBeLessThan(50);
  });
});
