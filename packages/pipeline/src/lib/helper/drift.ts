/**
 * Drift sentinel manager — write, read, check, and clear
 * `.pipeline-drift-sentinel` files for halting runaway retry loops.
 */

import { readFile, writeFile, unlink, access, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { DriftSentinel } from '../../types.js';

const RADIX_DECIMAL = 10;

/** Error thrown for drift sentinel operation failures. */
export class DriftSentinelError extends Error {
  readonly filePath: string;

  constructor(filePath: string, message: string) {
    super(message);
    this.name = 'DriftSentinelError';
    this.filePath = filePath;
  }
}

/**
 * Serialize a DriftSentinel to key=value format.
 */
function serialize(sentinel: DriftSentinel): string {
  const lines = [
    `phase=${sentinel.phase}`,
    `reason=${sentinel.reason}`,
    `timestamp=${sentinel.timestamp}`,
    `rolled_back_to=${
      sentinel.rolledBackTo === null ? 'null' : sentinel.rolledBackTo
    }`,
    `attempts_log=${JSON.stringify(sentinel.attemptHashes)}`,
  ];
  return lines.join('\n') + '\n';
}

const REQUIRED_KEYS = [
  'phase',
  'reason',
  'timestamp',
  'rolled_back_to',
  'attempts_log',
] as const;

function parseKeyValueLines(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      map.set(line.substring(0, eqIdx), line.substring(eqIdx + 1));
    }
  }
  return map;
}

function extractRequiredFields(
  map: Map<string, string>,
  filePath: string
): {
  phaseStr: string;
  reason: string;
  timestamp: string;
  rolledBackToStr: string;
  attemptsLogStr: string;
} {
  const missing = REQUIRED_KEYS.filter((k) => !map.has(k));
  if (missing.length > 0) {
    throw new DriftSentinelError(
      filePath,
      'Malformed drift sentinel file: missing required fields'
    );
  }
  return {
    phaseStr: map.get('phase')!,
    reason: map.get('reason')!,
    timestamp: map.get('timestamp')!,
    rolledBackToStr: map.get('rolled_back_to')!,
    attemptsLogStr: map.get('attempts_log')!,
  };
}

function parseAttemptHashes(
  attemptsLogStr: string,
  filePath: string
): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(attemptsLogStr);
  } catch {
    throw new DriftSentinelError(
      filePath,
      `Invalid attempts_log JSON: ${attemptsLogStr}`
    );
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item): item is string => typeof item === 'string')
  ) {
    throw new DriftSentinelError(
      filePath,
      `Invalid attempts_log: expected string array, got ${typeof parsed}`
    );
  }
  return parsed;
}

function parse(content: string, filePath: string): DriftSentinel {
  const map = parseKeyValueLines(content);
  const fields = extractRequiredFields(map, filePath);

  const phase = parseInt(fields.phaseStr, RADIX_DECIMAL);
  if (Number.isNaN(phase)) {
    throw new DriftSentinelError(
      filePath,
      `Invalid phase number: ${fields.phaseStr}`
    );
  }

  return {
    phase,
    reason: fields.reason,
    timestamp: fields.timestamp,
    rolledBackTo:
      fields.rolledBackToStr === 'null' ? null : fields.rolledBackToStr,
    attemptHashes: parseAttemptHashes(fields.attemptsLogStr, filePath),
  };
}

/**
 * Write a `.pipeline-drift-sentinel` file in key=value format.
 * Creates parent directories if needed.
 */
export async function writeDriftSentinel(
  filePath: string,
  sentinel: DriftSentinel
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, serialize(sentinel), 'utf-8');
}

/**
 * Read and parse a `.pipeline-drift-sentinel` file.
 * Throws DriftSentinelError if file is missing or malformed.
 */
export async function readDriftSentinel(
  filePath: string
): Promise<DriftSentinel> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      throw new DriftSentinelError(
        filePath,
        `Drift sentinel file not found: ${filePath}`
      );
    }
    throw err;
  }
  return parse(content, filePath);
}

/**
 * Check whether a drift sentinel file exists.
 */
export async function checkDriftSentinel(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return false;
    }
    throw err;
  }
}

/**
 * Delete the drift sentinel file. No-op if file does not exist.
 */
export async function clearDriftSentinel(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return;
    }
    throw err;
  }
}
