import { describe, it, expect, beforeEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import type { PipelineEvent } from '../src/types.js';
import type { StorageBackend } from '../src/storage/StorageBackend.js';
import { MemoryStorageBackend } from '../src/storage/MemoryStorageBackend.js';
import { FileStorageBackend } from '../src/storage/FileStorageBackend.js';

function makeEvent(overrides: Partial<PipelineEvent> = {}): PipelineEvent {
  return {
    timestamp: new Date().toISOString(),
    pipelineId: 'pipeline-1',
    phase: 1,
    stage: 'plan',
    action: 'start',
    ...overrides,
  };
}

function describeStorageContract(
  name: string,
  factory: () => Promise<StorageBackend>
) {
  describe(`${name} — StorageBackend contract`, () => {
    let storage: StorageBackend;

    beforeEach(async () => {
      storage = await factory();
    });

    it('should return empty array when no events exist', async () => {
      const result = await storage.query({ pipelineId: 'nonexistent' });
      expect(result).toEqual([]);
    });

    it('should return zero count when no events exist', async () => {
      const count = await storage.count({ pipelineId: 'nonexistent' });
      expect(count).toBe(0);
    });

    it('should append and query a single event', async () => {
      const event = makeEvent();
      await storage.append(event);

      const result = await storage.query({ pipelineId: 'pipeline-1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(event);
    });

    it('should preserve all event fields through append and query', async () => {
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

      await storage.append(event);
      const result = await storage.query({ pipelineId: 'pipeline-1' });
      expect(result[0]).toEqual(event);
    });

    it('should filter by pipelineId', async () => {
      await storage.append(makeEvent({ pipelineId: 'p1' }));
      await storage.append(makeEvent({ pipelineId: 'p2' }));
      await storage.append(makeEvent({ pipelineId: 'p1' }));

      const result = await storage.query({ pipelineId: 'p1' });
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.pipelineId === 'p1')).toBe(true);
    });

    it('should filter by pipelineId and stage', async () => {
      await storage.append(makeEvent({ stage: 'plan' }));
      await storage.append(makeEvent({ stage: 'test' }));
      await storage.append(makeEvent({ stage: 'plan' }));

      const result = await storage.query({
        pipelineId: 'pipeline-1',
        stage: 'plan',
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by pipelineId and action', async () => {
      await storage.append(makeEvent({ action: 'start' }));
      await storage.append(makeEvent({ action: 'complete' }));
      await storage.append(makeEvent({ action: 'fail' }));

      const result = await storage.query({
        pipelineId: 'pipeline-1',
        action: 'complete',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0]?.action).toBe('complete');
    });

    it('should filter by time range (from)', async () => {
      await storage.append(
        makeEvent({ timestamp: '2024-01-01T00:00:00.000Z' })
      );
      await storage.append(
        makeEvent({ timestamp: '2024-06-01T00:00:00.000Z' })
      );
      await storage.append(
        makeEvent({ timestamp: '2024-12-01T00:00:00.000Z' })
      );

      const result = await storage.query({
        pipelineId: 'pipeline-1',
        from: '2024-06-01T00:00:00.000Z',
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by time range (to)', async () => {
      await storage.append(
        makeEvent({ timestamp: '2024-01-01T00:00:00.000Z' })
      );
      await storage.append(
        makeEvent({ timestamp: '2024-06-01T00:00:00.000Z' })
      );
      await storage.append(
        makeEvent({ timestamp: '2024-12-01T00:00:00.000Z' })
      );

      const result = await storage.query({
        pipelineId: 'pipeline-1',
        to: '2024-06-01T00:00:00.000Z',
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by time range (from and to)', async () => {
      await storage.append(
        makeEvent({ timestamp: '2024-01-01T00:00:00.000Z' })
      );
      await storage.append(
        makeEvent({ timestamp: '2024-06-01T00:00:00.000Z' })
      );
      await storage.append(
        makeEvent({ timestamp: '2024-12-01T00:00:00.000Z' })
      );

      const result = await storage.query({
        pipelineId: 'pipeline-1',
        from: '2024-03-01T00:00:00.000Z',
        to: '2024-09-01T00:00:00.000Z',
      });
      expect(result).toHaveLength(1);
    });

    it('should count matching events', async () => {
      await storage.append(makeEvent({ pipelineId: 'p1' }));
      await storage.append(makeEvent({ pipelineId: 'p2' }));
      await storage.append(makeEvent({ pipelineId: 'p1' }));

      expect(await storage.count({ pipelineId: 'p1' })).toBe(2);
      expect(await storage.count({ pipelineId: 'p2' })).toBe(1);
      expect(await storage.count({ pipelineId: 'p3' })).toBe(0);
    });

    it('should count with combined filters', async () => {
      await storage.append(makeEvent({ stage: 'plan', action: 'start' }));
      await storage.append(makeEvent({ stage: 'plan', action: 'complete' }));
      await storage.append(makeEvent({ stage: 'test', action: 'start' }));

      expect(
        await storage.count({
          pipelineId: 'pipeline-1',
          stage: 'plan',
          action: 'start',
        })
      ).toBe(1);
    });
  });
}

describeStorageContract(
  'MemoryStorageBackend',
  async () => new MemoryStorageBackend()
);

describe('FileStorageBackend', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'telemetry-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describeStorageContract(
    'FileStorageBackend',
    async () => new FileStorageBackend(join(tempDir, 'events.jsonl'))
  );

  it('should persist events across instances', async () => {
    const filePath = join(tempDir, 'persist.jsonl');
    const storage1 = new FileStorageBackend(filePath);

    await storage1.append(makeEvent({ pipelineId: 'persist-test' }));
    await storage1.append(makeEvent({ pipelineId: 'persist-test' }));

    const storage2 = new FileStorageBackend(filePath);
    const result = await storage2.query({ pipelineId: 'persist-test' });
    expect(result).toHaveLength(2);
  });

  it('should write one JSON line per event', async () => {
    const filePath = join(tempDir, 'lines.jsonl');
    const storage = new FileStorageBackend(filePath);

    await storage.append(makeEvent());
    await storage.append(makeEvent());
    await storage.append(makeEvent());

    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(3);

    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('should handle query on non-existent file', async () => {
    const storage = new FileStorageBackend(
      join(tempDir, 'nonexistent', 'events.jsonl')
    );
    const result = await storage.query({ pipelineId: 'any' });
    expect(result).toEqual([]);
  });

  it('should handle count on non-existent file', async () => {
    const storage = new FileStorageBackend(
      join(tempDir, 'nonexistent', 'events.jsonl')
    );
    const count = await storage.count({ pipelineId: 'any' });
    expect(count).toBe(0);
  });

  it('should create parent directories on first append', async () => {
    const filePath = join(tempDir, 'nested', 'deep', 'events.jsonl');
    const storage = new FileStorageBackend(filePath);

    await storage.append(makeEvent());
    const result = await storage.query({ pipelineId: 'pipeline-1' });
    expect(result).toHaveLength(1);
  });
});

describe('MemoryStorageBackend — ephemeral behavior', () => {
  it('should not share state between instances', async () => {
    const storage1 = new MemoryStorageBackend();
    await storage1.append(makeEvent());

    const storage2 = new MemoryStorageBackend();
    const result = await storage2.query({ pipelineId: 'pipeline-1' });
    expect(result).toEqual([]);
  });
});
