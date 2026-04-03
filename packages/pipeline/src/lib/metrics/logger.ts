/**
 * Metrics logger — record per-invocation metrics to PIPELINE-METRICS.md
 * and produce cost manifests.
 */

import { readFile, appendFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type {
  InvocationMetrics,
  CostManifest,
  CostManifestTotals,
  RoleMetrics,
  PhaseMetrics,
} from './types.js';
import type { AgentRole } from '../../types.js';

const METRICS_HEADER =
  '# PIPELINE-METRICS\n\n<!-- Machine-managed file. One JSON record per line below. -->\n\n';

/**
 * Append a single InvocationMetrics record as a JSON line to PIPELINE-METRICS.md.
 * Creates the file with a markdown header if it does not exist.
 * Creates parent directories if needed.
 */
export async function logInvocation(
  filePath: string,
  metrics: InvocationMetrics
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  let exists = true;
  try {
    await readFile(filePath, 'utf-8');
  } catch {
    exists = false;
  }

  const jsonLine = JSON.stringify(metrics) + '\n';

  if (!exists) {
    await writeFile(filePath, METRICS_HEADER + jsonLine, 'utf-8');
  } else {
    await appendFile(filePath, jsonLine, 'utf-8');
  }
}

/**
 * Read all invocation records from a PIPELINE-METRICS.md file.
 * Returns an empty array if the file does not exist.
 * Silently skips non-JSON lines (markdown headers, blank lines).
 */
export async function readInvocations(
  filePath: string
): Promise<readonly InvocationMetrics[]> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return [];
  }

  const records: InvocationMetrics[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('{')) {
      continue;
    }
    try {
      records.push(JSON.parse(trimmed) as InvocationMetrics);
    } catch {
      continue;
    }
  }
  return records;
}

/**
 * Aggregate invocation records into a CostManifest with totals,
 * per-role (with firstPassRate), and per-phase breakdowns.
 */
export function getCostManifest(
  runId: string,
  invocations: readonly InvocationMetrics[]
): CostManifest {
  const totals = computeTotals(invocations);
  const byRole = computeByRole(invocations);
  const byPhase = computeByPhase(invocations);

  return {
    runId,
    invocations,
    totals,
    byRole,
    byPhase,
  };
}

function computeTotals(
  invocations: readonly InvocationMetrics[]
): CostManifestTotals {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheTokens = 0;
  let totalCostUsd = 0;
  let totalDurationMs = 0;
  let successfulInvocations = 0;
  let failedInvocations = 0;

  for (const inv of invocations) {
    totalInputTokens += inv.inputTokens;
    totalOutputTokens += inv.outputTokens;
    totalCacheTokens += inv.cacheTokens;
    totalCostUsd += inv.costUsd;
    totalDurationMs += inv.durationMs;
    if (inv.outcome === 'pass') {
      successfulInvocations++;
    } else {
      failedInvocations++;
    }
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCacheTokens,
    totalCostUsd,
    totalInvocations: invocations.length,
    successfulInvocations,
    failedInvocations,
    totalDurationMs,
  };
}

function computeByRole(
  invocations: readonly InvocationMetrics[]
): readonly RoleMetrics[] {
  const grouped = new Map<
    AgentRole,
    { count: number; cost: number; passes: number; duration: number }
  >();

  for (const inv of invocations) {
    const entry = grouped.get(inv.role) ?? {
      count: 0,
      cost: 0,
      passes: 0,
      duration: 0,
    };
    entry.count++;
    entry.cost += inv.costUsd;
    entry.duration += inv.durationMs;
    if (inv.outcome === 'pass') {
      entry.passes++;
    }
    grouped.set(inv.role, entry);
  }

  const result: RoleMetrics[] = [];
  for (const [role, data] of grouped) {
    result.push({
      role,
      invocationCount: data.count,
      totalCostUsd: data.cost,
      firstPassRate: data.count > 0 ? data.passes / data.count : 0,
      avgDurationMs: data.count > 0 ? data.duration / data.count : 0,
    });
  }
  return result;
}

function computeByPhase(
  invocations: readonly InvocationMetrics[]
): readonly PhaseMetrics[] {
  const grouped = new Map<
    number,
    { count: number; cost: number; retries: number }
  >();

  for (const inv of invocations) {
    const entry = grouped.get(inv.phase) ?? {
      count: 0,
      cost: 0,
      retries: 0,
    };
    entry.count++;
    entry.cost += inv.costUsd;
    if (inv.outcome !== 'pass') {
      entry.retries++;
    }
    grouped.set(inv.phase, entry);
  }

  const result: PhaseMetrics[] = [];
  for (const [phase, data] of grouped) {
    result.push({
      phase,
      totalCostUsd: data.cost,
      invocationCount: data.count,
      retryCount: data.retries,
    });
  }
  return result;
}
