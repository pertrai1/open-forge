import { describe, it, expect, beforeEach } from 'vitest';
import type { PipelineEvent } from '../src/types.js';
import type { StorageBackend } from '../src/storage/StorageBackend.js';
import { MemoryStorageBackend } from '../src/storage/MemoryStorageBackend.js';
import { TelemetryImpl } from '../src/TelemetryImpl.js';

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

// ---------------------------------------------------------------------------
// 1. emit() — Validation
// ---------------------------------------------------------------------------

describe('TelemetryImpl — emit() validation', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should throw on missing timestamp', async () => {
    const event = makeEvent({ timestamp: undefined as unknown as string });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should throw on empty timestamp', async () => {
    const event = makeEvent({ timestamp: '' });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should throw on missing pipelineId', async () => {
    const event = makeEvent({ pipelineId: undefined as unknown as string });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should throw on empty pipelineId', async () => {
    const event = makeEvent({ pipelineId: '' });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should throw on missing stage', async () => {
    const event = makeEvent({
      stage: undefined as unknown as PipelineEvent['stage'],
    });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should throw on missing action', async () => {
    const event = makeEvent({
      action: undefined as unknown as PipelineEvent['action'],
    });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should throw on missing phase', async () => {
    const event = makeEvent({
      phase: undefined as unknown as number,
    });
    await expect(telemetry.emit(event)).rejects.toThrow();
  });

  it('should not persist event when validation fails', async () => {
    const badEvent = makeEvent({ pipelineId: '' });
    await expect(telemetry.emit(badEvent)).rejects.toThrow();

    const results = await telemetry.query({ pipelineId: 'pipeline-1' });
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. emit() — Delegation to storage
// ---------------------------------------------------------------------------

describe('TelemetryImpl — emit() delegation', () => {
  let storage: StorageBackend;
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    storage = new MemoryStorageBackend();
    telemetry = new TelemetryImpl(storage);
  });

  it('should persist a valid event to storage', async () => {
    const event = makeEvent();
    await telemetry.emit(event);

    const results = await storage.query({ pipelineId: 'pipeline-1' });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(event);
  });

  it('should persist event with only required fields', async () => {
    const event: PipelineEvent = {
      timestamp: '2024-06-15T10:00:00.000Z',
      pipelineId: 'pipeline-1',
      phase: 1,
      stage: 'plan',
      action: 'start',
    };
    await telemetry.emit(event);

    const results = await storage.query({ pipelineId: 'pipeline-1' });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(event);
  });

  it('should preserve all optional fields', async () => {
    const event = makeEvent({
      durationMs: 1500,
      tokenUsage: { prompt: 100, completion: 200 },
      agentId: 'agent-1',
      model: 'gpt-4',
      filesModified: ['src/foo.ts'],
      filesCreated: ['src/bar.ts'],
      error: 'some error',
      metadata: { key: 'value' },
    });
    await telemetry.emit(event);

    const results = await storage.query({ pipelineId: 'pipeline-1' });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(event);
  });

  it('should persist multiple events', async () => {
    await telemetry.emit(makeEvent({ action: 'start' }));
    await telemetry.emit(makeEvent({ action: 'complete' }));

    const results = await storage.query({ pipelineId: 'pipeline-1' });
    expect(results).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 3. emit() — Error handling (NF-011)
// ---------------------------------------------------------------------------

describe('TelemetryImpl — emit() error handling', () => {
  it('should not throw when storage append fails', async () => {
    const failingStorage: StorageBackend = {
      append: async () => {
        throw new Error('disk full');
      },
      query: async () => [],
      count: async () => 0,
    };
    const telemetry = new TelemetryImpl(failingStorage);

    // Should resolve without throwing
    await expect(telemetry.emit(makeEvent())).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. query() — Delegation
// ---------------------------------------------------------------------------

describe('TelemetryImpl — query() delegation', () => {
  let telemetry: TelemetryImpl;

  beforeEach(async () => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
    await telemetry.emit(
      makeEvent({ pipelineId: 'p1', stage: 'plan', action: 'start' })
    );
    await telemetry.emit(
      makeEvent({ pipelineId: 'p1', stage: 'plan', action: 'complete' })
    );
    await telemetry.emit(
      makeEvent({ pipelineId: 'p1', stage: 'test', action: 'start' })
    );
    await telemetry.emit(
      makeEvent({ pipelineId: 'p2', stage: 'plan', action: 'start' })
    );
  });

  it('should return matching events by pipelineId', async () => {
    const results = await telemetry.query({ pipelineId: 'p1' });
    expect(results).toHaveLength(3);
  });

  it('should return empty array for no matches', async () => {
    const results = await telemetry.query({ pipelineId: 'nonexistent' });
    expect(results).toEqual([]);
  });

  it('should filter by pipelineId and stage', async () => {
    const results = await telemetry.query({ pipelineId: 'p1', stage: 'plan' });
    expect(results).toHaveLength(2);
  });

  it('should filter by pipelineId and action', async () => {
    const results = await telemetry.query({
      pipelineId: 'p1',
      action: 'complete',
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.action).toBe('complete');
  });

  it('should filter by time range (from)', async () => {
    const results = await telemetry.query({
      pipelineId: 'p1',
      from: '2024-06-15T10:00:00.000Z',
    });
    expect(results).toHaveLength(3);
  });

  it('should filter by time range (to)', async () => {
    const results = await telemetry.query({
      pipelineId: 'p1',
      to: '2024-06-15T10:00:00.000Z',
    });
    // All events have the same timestamp, so to is inclusive
    expect(results).toHaveLength(3);
  });

  it('should filter with all fields combined', async () => {
    const results = await telemetry.query({
      pipelineId: 'p1',
      stage: 'plan',
      action: 'start',
      from: '2024-06-15T00:00:00.000Z',
      to: '2024-06-16T00:00:00.000Z',
    });
    expect(results).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 5. getPipelineSummary() — totalDurationMs
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() totalDurationMs', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should sum durationMs from complete events', async () => {
    await telemetry.emit(makeEvent({ action: 'start', stage: 'plan' }));
    await telemetry.emit(
      makeEvent({ action: 'complete', stage: 'plan', durationMs: 100 })
    );
    await telemetry.emit(makeEvent({ action: 'start', stage: 'test' }));
    await telemetry.emit(
      makeEvent({ action: 'complete', stage: 'test', durationMs: 200 })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.totalDurationMs).toBe(300);
  });

  it('should return 0 when no complete events', async () => {
    await telemetry.emit(makeEvent({ action: 'start' }));
    await telemetry.emit(makeEvent({ action: 'fail' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.totalDurationMs).toBe(0);
  });

  it('should exclude durationMs from non-complete events', async () => {
    await telemetry.emit(makeEvent({ action: 'start', durationMs: 999 }));
    await telemetry.emit(makeEvent({ action: 'fail', durationMs: 888 }));
    await telemetry.emit(makeEvent({ action: 'retry', durationMs: 777 }));
    await telemetry.emit(
      makeEvent({ action: 'complete', stage: 'plan', durationMs: 100 })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.totalDurationMs).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 6. getPipelineSummary() — totalTokens
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() totalTokens', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should sum tokenUsage across events', async () => {
    await telemetry.emit(
      makeEvent({ tokenUsage: { prompt: 100, completion: 50 } })
    );
    await telemetry.emit(
      makeEvent({ tokenUsage: { prompt: 200, completion: 100 } })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.totalTokens).toBe(450);
  });

  it('should return 0 when no events have tokenUsage', async () => {
    await telemetry.emit(makeEvent());
    await telemetry.emit(makeEvent());

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.totalTokens).toBe(0);
  });

  it('should skip events without tokenUsage', async () => {
    await telemetry.emit(
      makeEvent({ tokenUsage: { prompt: 100, completion: 50 } })
    );
    await telemetry.emit(makeEvent()); // no tokenUsage
    await telemetry.emit(
      makeEvent({ tokenUsage: { prompt: 50, completion: 25 } })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.totalTokens).toBe(225);
  });
});

// ---------------------------------------------------------------------------
// 7. getPipelineSummary() — stagesCompleted
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() stagesCompleted', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should list unique stages from complete events', async () => {
    await telemetry.emit(makeEvent({ action: 'complete', stage: 'plan' }));
    await telemetry.emit(makeEvent({ action: 'complete', stage: 'test' }));
    await telemetry.emit(makeEvent({ action: 'complete', stage: 'implement' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.stagesCompleted).toEqual(['plan', 'test', 'implement']);
  });

  it('should deduplicate repeated completions', async () => {
    await telemetry.emit(makeEvent({ action: 'complete', stage: 'plan' }));
    await telemetry.emit(makeEvent({ action: 'complete', stage: 'plan' }));
    await telemetry.emit(makeEvent({ action: 'complete', stage: 'test' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.stagesCompleted).toEqual(['plan', 'test']);
  });

  it('should return empty array with no completions', async () => {
    await telemetry.emit(makeEvent({ action: 'start' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.stagesCompleted).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 8. getPipelineSummary() — currentStage
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() currentStage', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should return stage of chronologically last event', async () => {
    await telemetry.emit(
      makeEvent({ stage: 'plan', timestamp: '2024-01-01T00:00:00.000Z' })
    );
    await telemetry.emit(
      makeEvent({ stage: 'test', timestamp: '2024-01-02T00:00:00.000Z' })
    );
    await telemetry.emit(
      makeEvent({ stage: 'implement', timestamp: '2024-01-03T00:00:00.000Z' })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.currentStage).toBe('implement');
  });

  it('should return undefined when no events exist', async () => {
    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.currentStage).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 9. getPipelineSummary() — retryCount
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() retryCount', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should count retry events', async () => {
    await telemetry.emit(makeEvent({ action: 'retry' }));
    await telemetry.emit(makeEvent({ action: 'retry' }));
    await telemetry.emit(makeEvent({ action: 'retry' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.retryCount).toBe(3);
  });

  it('should return 0 with no retries', async () => {
    await telemetry.emit(makeEvent({ action: 'start' }));
    await telemetry.emit(makeEvent({ action: 'complete' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.retryCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 10. getPipelineSummary() — status derivation
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() status', () => {
  let telemetry: TelemetryImpl;

  beforeEach(() => {
    telemetry = new TelemetryImpl(new MemoryStorageBackend());
  });

  it('should be halted when escalate action exists', async () => {
    await telemetry.emit(makeEvent({ action: 'fail' }));
    await telemetry.emit(makeEvent({ action: 'escalate' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.status).toBe('halted');
  });

  it('should be failed when fail action exists without escalate', async () => {
    await telemetry.emit(makeEvent({ action: 'start' }));
    await telemetry.emit(makeEvent({ action: 'fail' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.status).toBe('failed');
  });

  it('should be completed when last event is complete', async () => {
    await telemetry.emit(
      makeEvent({ action: 'start', timestamp: '2024-01-01T00:00:00.000Z' })
    );
    await telemetry.emit(
      makeEvent({ action: 'complete', timestamp: '2024-01-02T00:00:00.000Z' })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.status).toBe('completed');
  });

  it('should be running when in-progress', async () => {
    await telemetry.emit(
      makeEvent({ action: 'start', timestamp: '2024-01-01T00:00:00.000Z' })
    );

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.status).toBe('running');
  });

  it('should have escalation take precedence over failure', async () => {
    await telemetry.emit(makeEvent({ action: 'fail' }));
    await telemetry.emit(makeEvent({ action: 'escalate' }));
    await telemetry.emit(makeEvent({ action: 'complete' }));

    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.status).toBe('halted');
  });

  it('should be running with no events', async () => {
    const summary = await telemetry.getPipelineSummary('pipeline-1');
    expect(summary.status).toBe('running');
  });
});

// ---------------------------------------------------------------------------
// 11. getPipelineSummary() — pipelineId
// ---------------------------------------------------------------------------

describe('TelemetryImpl — getPipelineSummary() pipelineId', () => {
  it('should return the pipelineId from the argument', async () => {
    const telemetry = new TelemetryImpl(new MemoryStorageBackend());
    const summary = await telemetry.getPipelineSummary('pipeline-42');
    expect(summary.pipelineId).toBe('pipeline-42');
  });
});
