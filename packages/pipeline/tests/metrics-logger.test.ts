import { join } from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  logInvocation,
  readInvocations,
  getCostManifest,
} from '../src/lib/metrics/logger.js';
import type { InvocationMetrics } from '../src/lib/metrics/types.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'metrics-test-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const makeMetrics = (
  overrides: Partial<InvocationMetrics> = {}
): InvocationMetrics => ({
  invocationNumber: 1,
  role: 'implementer',
  inputTokens: 100,
  outputTokens: 10,
  cacheTokens: 50,
  costUsd: 0.01,
  outcome: 'pass',
  skillRefs: 1,
  durationMs: 100,
  timestamp: '2025-01-01T00:00:00Z',
  phase: 1,
  taskId: null,
  ...overrides,
});

describe('logInvocation', () => {
  it('should append to existing file', async () => {
    const filePath = join(tempDir, 'PIPELINE-METRICS.md');
    await logInvocation(filePath, makeMetrics({ invocationNumber: 1 }));
    await logInvocation(filePath, makeMetrics({ invocationNumber: 2 }));
    await logInvocation(filePath, makeMetrics({ invocationNumber: 3 }));

    const invocations = await readInvocations(filePath);
    expect(invocations).toHaveLength(3);
  });

  it('should create file if not exists', async () => {
    const filePath = join(tempDir, 'PIPELINE-METRICS.md');
    await logInvocation(filePath, makeMetrics());

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBeTruthy();
  });

  it('should create parent directories', async () => {
    const filePath = join(tempDir, 'nested', 'dir', 'PIPELINE-METRICS.md');
    await logInvocation(filePath, makeMetrics());

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBeTruthy();
  });

  it('should write valid JSON per line', async () => {
    const filePath = join(tempDir, 'PIPELINE-METRICS.md');
    const metrics = makeMetrics({ invocationNumber: 42, costUsd: 0.99 });
    await logInvocation(filePath, metrics);

    const invocations = await readInvocations(filePath);
    expect(invocations).toHaveLength(1);
    expect(invocations[0].invocationNumber).toBe(42);
    expect(invocations[0].costUsd).toBe(0.99);
  });
});

describe('readInvocations', () => {
  it('should read file with multiple records', async () => {
    const filePath = join(tempDir, 'PIPELINE-METRICS.md');
    for (let i = 1; i <= 5; i++) {
      await logInvocation(filePath, makeMetrics({ invocationNumber: i }));
    }

    const invocations = await readInvocations(filePath);
    expect(invocations).toHaveLength(5);
  });

  it('should return empty array for non-existent file', async () => {
    const filePath = join(tempDir, 'nonexistent.md');
    const invocations = await readInvocations(filePath);
    expect(invocations).toEqual([]);
  });

  it('should skip non-JSON lines (markdown headers)', async () => {
    const filePath = join(tempDir, 'PIPELINE-METRICS.md');
    await logInvocation(filePath, makeMetrics({ invocationNumber: 1 }));
    await logInvocation(filePath, makeMetrics({ invocationNumber: 2 }));

    const invocations = await readInvocations(filePath);
    expect(invocations).toHaveLength(2);
    expect(invocations[0].invocationNumber).toBe(1);
    expect(invocations[1].invocationNumber).toBe(2);
  });
});

describe('getCostManifest', () => {
  it('should aggregate totals', () => {
    const invocations = [
      makeMetrics({ inputTokens: 100, outputTokens: 10, costUsd: 0.01 }),
      makeMetrics({ inputTokens: 200, outputTokens: 20, costUsd: 0.02 }),
      makeMetrics({ inputTokens: 300, outputTokens: 30, costUsd: 0.03 }),
    ];
    const manifest = getCostManifest('run-1', invocations);
    expect(manifest.runId).toBe('run-1');
    expect(manifest.totals.totalInputTokens).toBe(600);
    expect(manifest.totals.totalOutputTokens).toBe(60);
    expect(manifest.totals.totalCostUsd).toBeCloseTo(0.06);
    expect(manifest.totals.totalInvocations).toBe(3);
  });

  it('should count successful and failed invocations', () => {
    const invocations = [
      makeMetrics({ outcome: 'pass' }),
      makeMetrics({ outcome: 'pass' }),
      makeMetrics({ outcome: 'fail' }),
      makeMetrics({ outcome: 'pass' }),
      makeMetrics({ outcome: 'error' }),
    ];
    const manifest = getCostManifest('run-1', invocations);
    expect(manifest.totals.successfulInvocations).toBe(3);
    expect(manifest.totals.failedInvocations).toBe(2);
  });

  it('should produce per-role breakdown', () => {
    const invocations = [
      makeMetrics({ role: 'test-author', outcome: 'pass' }),
      makeMetrics({ role: 'implementer', outcome: 'pass' }),
      makeMetrics({ role: 'test-author', outcome: 'fail' }),
    ];
    const manifest = getCostManifest('run-1', invocations);
    expect(manifest.byRole).toHaveLength(2);

    const testAuthor = manifest.byRole.find((r) => r.role === 'test-author');
    expect(testAuthor).toBeDefined();
    expect(testAuthor!.invocationCount).toBe(2);
  });

  it('should produce per-phase breakdown', () => {
    const invocations = [
      makeMetrics({ phase: 1 }),
      makeMetrics({ phase: 1 }),
      makeMetrics({ phase: 2 }),
    ];
    const manifest = getCostManifest('run-1', invocations);
    expect(manifest.byPhase).toHaveLength(2);

    const phase1 = manifest.byPhase.find((p) => p.phase === 1);
    expect(phase1).toBeDefined();
    expect(phase1!.invocationCount).toBe(2);
  });

  it('should return zeros for empty invocations', () => {
    const manifest = getCostManifest('run-1', []);
    expect(manifest.totals.totalInputTokens).toBe(0);
    expect(manifest.totals.totalInvocations).toBe(0);
    expect(manifest.byRole).toEqual([]);
    expect(manifest.byPhase).toEqual([]);
  });

  it('should calculate firstPassRate per role', () => {
    const invocations = [
      makeMetrics({ role: 'implementer', outcome: 'pass' }),
      makeMetrics({ role: 'implementer', outcome: 'fail' }),
      makeMetrics({ role: 'implementer', outcome: 'pass' }),
      makeMetrics({ role: 'implementer', outcome: 'pass' }),
    ];
    const manifest = getCostManifest('run-1', invocations);
    const impl = manifest.byRole.find((r) => r.role === 'implementer');
    expect(impl!.firstPassRate).toBe(0.75);
  });
});
