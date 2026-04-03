/**
 * Checkpoint manager — shadow git checkpoint operations for safe retry cycles.
 * Uses isolated GIT_DIR/GIT_WORK_TREE to avoid contaminating user's git history.
 */

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { access, mkdir, rm, writeFile, readFile } from 'node:fs/promises';

const execFile = promisify(execFileCb);

export class CheckpointNotFoundError extends Error {
  constructor(readonly phase: number, readonly label: string) {
    super(`Checkpoint "${label}" not found for phase ${phase}`);
    this.name = 'CheckpointNotFoundError';
  }
}

export class CheckpointBudgetExceededError extends Error {
  constructor(readonly fileCount: number) {
    super(`Checkpoint budget exceeded: ${fileCount} files (max 50000)`);
    this.name = 'CheckpointBudgetExceededError';
  }
}

export class CheckpointGitError extends Error {
  constructor(readonly command: string, readonly stderr: string) {
    super(`Git command failed: ${command}\n${stderr}`);
    this.name = 'CheckpointGitError';
  }
}

/** Files that should never be rolled back. */
const PRESERVED_FILES = [
  'PIPELINE-ISSUES.md',
  'PIPELINE-METRICS.md',
  'PIPELINE-LOG.md',
  'HANDOFF.md',
];

/** Directories excluded from checkpointing. */
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.env', '.forge'];

function getShadowDir(workDir: string, phase: number): string {
  return join(workDir, '.forge', 'checkpoints', `phase-${phase}`);
}

export interface CheckpointTarget {
  readonly workDir: string;
  readonly phase: number;
  readonly label: string;
}

export interface CheckpointDiffOptions {
  readonly workDir: string;
  readonly phase: number;
  readonly fromLabel: string;
  readonly toLabel: string;
}

interface GitCommand {
  readonly workDir: string;
  readonly gitDir: string;
  readonly args: string[];
  readonly useWorkTree?: boolean;
}

async function shadowGit(cmd: GitCommand): Promise<string> {
  const env: Record<string, string | undefined> = {
    ...process.env,
    GIT_DIR: cmd.gitDir,
  };
  if (cmd.useWorkTree !== false) env.GIT_WORK_TREE = cmd.workDir;
  try {
    const { stdout } = await execFile('git', cmd.args, {
      env,
      cwd: cmd.workDir,
    });
    return stdout.trim();
  } catch (err: unknown) {
    const error = err as { stderr?: string };
    throw new CheckpointGitError(
      `git ${cmd.args.join(' ')}`,
      error.stderr ?? String(err)
    );
  }
}

async function shadowRepoExists(
  workDir: string,
  phase: number
): Promise<boolean> {
  try {
    await access(join(getShadowDir(workDir, phase), 'HEAD'));
    return true;
  } catch {
    return false;
  }
}

async function writeExcludeFile(gitDir: string): Promise<void> {
  await mkdir(join(gitDir, 'info'), { recursive: true });
  await writeFile(
    join(gitDir, 'info', 'exclude'),
    EXCLUDED_DIRS.join('\n') + '\n',
    'utf-8'
  );
}

/**
 * Create a shadow git checkpoint of the working directory.
 * Initializes the shadow repo if needed.
 */
export async function createCheckpoint(
  target: CheckpointTarget
): Promise<void> {
  const { workDir, phase, label } = target;
  const gitDir = getShadowDir(workDir, phase);
  const git = (args: string[], useWorkTree?: boolean) =>
    shadowGit({ workDir, gitDir, args, useWorkTree });

  if (!(await shadowRepoExists(workDir, phase))) {
    await mkdir(gitDir, { recursive: true });
    await git(['init', '--bare'], false);
    await writeExcludeFile(gitDir);
    await git(['config', 'user.email', 'forge-pipeline@local'], false);
    await git(['config', 'user.name', 'Forge Pipeline'], false);
  }

  const MAX_CHECKPOINT_FILES = 50000;
  const fileList = await git(['ls-files', '--others', '--cached']);
  const fileCount = fileList ? fileList.split('\n').filter(Boolean).length : 0;
  if (fileCount > MAX_CHECKPOINT_FILES) {
    throw new CheckpointBudgetExceededError(fileCount);
  }

  await git(['add', '--all']);
  await git(['commit', '--allow-empty', '-m', `checkpoint: ${label}`]);
  await git(['tag', '-f', label]);
}

/**
 * Restore the working directory to a checkpoint state.
 * Preserves PIPELINE-ISSUES.md, PIPELINE-METRICS.md, PIPELINE-LOG.md, and HANDOFF.md.
 */
export async function rollbackToCheckpoint(
  target: CheckpointTarget
): Promise<void> {
  const { workDir, phase, label } = target;
  const gitDir = getShadowDir(workDir, phase);
  const git = (args: string[]) => shadowGit({ workDir, gitDir, args });

  if (!(await shadowRepoExists(workDir, phase))) {
    throw new CheckpointNotFoundError(phase, label);
  }

  try {
    await git(['rev-parse', '--verify', label]);
  } catch {
    throw new CheckpointNotFoundError(phase, label);
  }

  const saved = new Map<string, string>();
  for (const name of PRESERVED_FILES) {
    try {
      saved.set(name, await readFile(join(workDir, name), 'utf-8'));
    } catch {
      continue;
    }
  }

  await git(['checkout', label, '--', '.']);
  await git(['clean', '-fd', '--exclude', '.forge']);

  for (const [name, content] of saved) {
    await writeFile(join(workDir, name), content, 'utf-8');
  }
}

/**
 * Remove the entire shadow git repo for a phase.
 * No-op if the repo doesn't exist.
 */
export async function deleteCheckpoints(
  workDir: string,
  phase: number
): Promise<void> {
  const gitDir = getShadowDir(workDir, phase);
  await rm(gitDir, { recursive: true, force: true });
}

/**
 * List all checkpoint labels (tags) for a phase.
 * Returns an empty array if no shadow repo exists.
 */
export async function listCheckpoints(
  workDir: string,
  phase: number
): Promise<readonly string[]> {
  if (!(await shadowRepoExists(workDir, phase))) {
    return [];
  }

  const gitDir = getShadowDir(workDir, phase);
  const output = await shadowGit({
    workDir,
    gitDir,
    args: ['tag', '--list'],
  });
  return output ? output.split('\n').filter((line) => line.length > 0) : [];
}

/**
 * Get the git diff between two checkpoint labels.
 * Throws CheckpointNotFoundError if either label doesn't exist.
 */
export async function getCheckpointDiff(
  options: CheckpointDiffOptions
): Promise<string> {
  const { workDir, phase, fromLabel, toLabel } = options;
  const gitDir = getShadowDir(workDir, phase);
  const git = (args: string[]) => shadowGit({ workDir, gitDir, args });

  if (!(await shadowRepoExists(workDir, phase))) {
    throw new CheckpointNotFoundError(phase, fromLabel);
  }

  for (const label of [fromLabel, toLabel]) {
    try {
      await git(['rev-parse', '--verify', label]);
    } catch {
      throw new CheckpointNotFoundError(phase, label);
    }
  }

  return await git(['diff', fromLabel, toLabel]);
}
