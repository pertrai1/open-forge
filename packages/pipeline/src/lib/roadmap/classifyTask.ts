/**
 * Task complexity classifier — heuristic classification based on
 * dependency count and description keywords.
 */

import type { TaskComplexity } from './types.js';

const MEDIUM_DEP_THRESHOLD = 4;

const COMPLEX_KEYWORDS = [
  'architect',
  'redesign',
  'migration',
  'migrate',
  'rewrite',
  'overhaul',
];

/**
 * Classify task complexity based on dependency count (primary) and
 * description keywords (secondary, can only elevate).
 *
 * Dependency count thresholds:
 *   0 deps → trivial
 *   1-2 deps → simple
 *   3-4 deps → medium
 *   5+ deps → complex
 *
 * Keywords can elevate but never lower the classification.
 */
export function classifyTask(task: {
  description: string;
  dependencies: readonly string[];
}): TaskComplexity {
  const { description, dependencies } = task;
  const depCount = dependencies.length;

  let base: TaskComplexity;
  if (depCount === 0) {
    base = 'trivial';
  } else if (depCount <= 2) {
    base = 'simple';
  } else if (depCount <= MEDIUM_DEP_THRESHOLD) {
    base = 'medium';
  } else {
    base = 'complex';
  }

  // Keyword elevation (never lowers)
  const lowerDesc = description.toLowerCase();
  const hasComplexKeyword = COMPLEX_KEYWORDS.some((kw) =>
    lowerDesc.includes(kw)
  );

  if (hasComplexKeyword && base !== 'complex') {
    return 'complex';
  }

  return base;
}
