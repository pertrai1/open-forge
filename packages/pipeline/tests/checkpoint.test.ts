import { join } from 'node:path';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  createCheckpoint,
  rollbackToCheckpoint,
  deleteCheckpoints,
  listCheckpoints,
  getCheckpointDiff,
  CheckpointNotFoundError,
} from '../src/lib/helper/checkpoint.js';

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'checkpoint-test-'));
  // Create some source files
  await mkdir(join(workDir, 'src'), { recursive: true });
  await writeFile(join(workDir, 'src', 'index.ts'), 'export const a = 1;\n');
  await writeFile(join(workDir, 'src', 'util.ts'), 'export const b = 2;\n');
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe('createCheckpoint', () => {
  it('should create first checkpoint for a phase', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    const labels = await listCheckpoints(workDir, 3);
    expect(labels).toContain('phase-3-start');
  });

  it('should create subsequent checkpoints in same phase', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    await writeFile(join(workDir, 'src', 'index.ts'), 'export const a = 2;\n');
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-pre-gates' });

    const labels = await listCheckpoints(workDir, 3);
    expect(labels).toContain('phase-3-start');
    expect(labels).toContain('phase-3-pre-gates');
  });

  it('should exclude node_modules and dist', async () => {
    await mkdir(join(workDir, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(
      join(workDir, 'node_modules', 'pkg', 'index.js'),
      'module.exports = {};'
    );
    await mkdir(join(workDir, 'dist'), { recursive: true });
    await writeFile(join(workDir, 'dist', 'bundle.js'), 'bundled');

    await createCheckpoint({ workDir, phase: 1, label: 'phase-1-start' });
    const labels = await listCheckpoints(workDir, 1);
    expect(labels).toContain('phase-1-start');
  });
});

describe('rollbackToCheckpoint', () => {
  it('should restore files to checkpoint state', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });

    await writeFile(join(workDir, 'src', 'index.ts'), 'MODIFIED CONTENT\n');
    await writeFile(join(workDir, 'src', 'newfile.ts'), 'new file\n');

    await rollbackToCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });

    const content = await readFile(join(workDir, 'src', 'index.ts'), 'utf-8');
    expect(content).toBe('export const a = 1;\n');
  });

  it('should preserve PIPELINE-ISSUES.md during rollback', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });

    await writeFile(
      join(workDir, 'PIPELINE-ISSUES.md'),
      '# Issues\n\nBlocker found.\n'
    );

    await rollbackToCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });

    const content = await readFile(
      join(workDir, 'PIPELINE-ISSUES.md'),
      'utf-8'
    );
    expect(content).toContain('Blocker found');
  });

  it('should throw CheckpointNotFoundError for non-existent label', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    await expect(
      rollbackToCheckpoint({ workDir, phase: 3, label: 'nonexistent' })
    ).rejects.toThrow(CheckpointNotFoundError);
  });

  it('should throw CheckpointNotFoundError with no shadow repo', async () => {
    await expect(
      rollbackToCheckpoint({ workDir, phase: 99, label: 'phase-99-start' })
    ).rejects.toThrow(CheckpointNotFoundError);
  });
});

describe('deleteCheckpoints', () => {
  it('should remove shadow repo for a phase', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    await deleteCheckpoints(workDir, 3);

    const labels = await listCheckpoints(workDir, 3);
    expect(labels).toEqual([]);
  });

  it('should be no-op for non-existent phase', async () => {
    await expect(deleteCheckpoints(workDir, 99)).resolves.toBeUndefined();
  });
});

describe('listCheckpoints', () => {
  it('should list all tags for a phase', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    await writeFile(join(workDir, 'src', 'index.ts'), 'changed\n');
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-pre-gates' });
    await writeFile(join(workDir, 'src', 'index.ts'), 'changed again\n');
    await createCheckpoint({
      workDir,
      phase: 3,
      label: 'phase-3-gate-verify-attempt-1',
    });

    const labels = await listCheckpoints(workDir, 3);
    expect(labels).toContain('phase-3-start');
    expect(labels).toContain('phase-3-pre-gates');
    expect(labels).toContain('phase-3-gate-verify-attempt-1');
  });

  it('should return empty array with no shadow repo', async () => {
    const labels = await listCheckpoints(workDir, 99);
    expect(labels).toEqual([]);
  });
});

describe('getCheckpointDiff', () => {
  it('should return diff between two labels', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    await writeFile(join(workDir, 'src', 'index.ts'), 'export const a = 99;\n');
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-pre-gates' });

    const diff = await getCheckpointDiff({
      workDir,
      phase: 3,
      fromLabel: 'phase-3-start',
      toLabel: 'phase-3-pre-gates',
    });
    expect(diff).toContain('index.ts');
    expect(diff).toContain('99');
  });

  it('should throw CheckpointNotFoundError for non-existent label', async () => {
    await createCheckpoint({ workDir, phase: 3, label: 'phase-3-start' });
    await expect(
      getCheckpointDiff({
        workDir,
        phase: 3,
        fromLabel: 'phase-3-start',
        toLabel: 'nonexistent',
      })
    ).rejects.toThrow(CheckpointNotFoundError);
  });
});
