import { join } from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  writeDriftSentinel,
  readDriftSentinel,
  checkDriftSentinel,
  clearDriftSentinel,
  DriftSentinelError,
} from '../src/lib/helper/drift.js';
import type { DriftSentinel } from '../src/types.js';

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'drift-test-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const SAMPLE_SENTINEL: DriftSentinel = {
  phase: 3,
  reason: 'quality checks failed after 3 cycles',
  timestamp: '2025-01-15T10:00:00Z',
  rolledBackTo: 'phase-3-pre-gates',
  attemptHashes: ['abc', 'def', 'ghi'],
};

describe('writeDriftSentinel', () => {
  it('should write sentinel with all fields in key=value format', async () => {
    const filePath = join(tempDir, '.pipeline-drift-sentinel');
    await writeDriftSentinel(filePath, SAMPLE_SENTINEL);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('phase=3');
    expect(content).toContain('reason=quality checks failed after 3 cycles');
    expect(content).toContain('timestamp=2025-01-15T10:00:00Z');
    expect(content).toContain('rolled_back_to=phase-3-pre-gates');
    expect(content).toContain('attempts_log=["abc","def","ghi"]');
  });

  it('should write sentinel with null rolledBackTo', async () => {
    const filePath = join(tempDir, '.pipeline-drift-sentinel');
    const sentinel: DriftSentinel = {
      ...SAMPLE_SENTINEL,
      rolledBackTo: null,
    };
    await writeDriftSentinel(filePath, sentinel);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('rolled_back_to=null');
  });

  it('should create parent directories', async () => {
    const filePath = join(tempDir, 'nested', 'dir', '.pipeline-drift-sentinel');
    await writeDriftSentinel(filePath, SAMPLE_SENTINEL);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('phase=3');
  });
});

describe('readDriftSentinel', () => {
  it('should read and parse valid sentinel file', async () => {
    const filePath = join(tempDir, '.pipeline-drift-sentinel');
    await writeDriftSentinel(filePath, SAMPLE_SENTINEL);

    const result = await readDriftSentinel(filePath);
    expect(result.phase).toBe(3);
    expect(result.reason).toBe('quality checks failed after 3 cycles');
    expect(result.timestamp).toBe('2025-01-15T10:00:00Z');
    expect(result.rolledBackTo).toBe('phase-3-pre-gates');
    expect(result.attemptHashes).toEqual(['abc', 'def', 'ghi']);
  });

  it('should throw DriftSentinelError for non-existent file', async () => {
    const filePath = join(tempDir, 'nonexistent');
    await expect(readDriftSentinel(filePath)).rejects.toThrow(
      DriftSentinelError
    );
  });

  it('should include filePath in DriftSentinelError', async () => {
    const filePath = join(tempDir, 'nonexistent');
    try {
      await readDriftSentinel(filePath);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DriftSentinelError);
      expect((error as DriftSentinelError).filePath).toBe(filePath);
    }
  });
});

describe('checkDriftSentinel', () => {
  it('should return true when file exists', async () => {
    const filePath = join(tempDir, '.pipeline-drift-sentinel');
    await writeDriftSentinel(filePath, SAMPLE_SENTINEL);

    expect(await checkDriftSentinel(filePath)).toBe(true);
  });

  it('should return false when file does not exist', async () => {
    const filePath = join(tempDir, 'nonexistent');
    expect(await checkDriftSentinel(filePath)).toBe(false);
  });
});

describe('clearDriftSentinel', () => {
  it('should delete existing sentinel file', async () => {
    const filePath = join(tempDir, '.pipeline-drift-sentinel');
    await writeDriftSentinel(filePath, SAMPLE_SENTINEL);

    await clearDriftSentinel(filePath);
    expect(await checkDriftSentinel(filePath)).toBe(false);
  });

  it('should not throw for non-existent file', async () => {
    const filePath = join(tempDir, 'nonexistent');
    await expect(clearDriftSentinel(filePath)).resolves.toBeUndefined();
  });
});
