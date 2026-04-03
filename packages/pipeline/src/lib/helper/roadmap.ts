/**
 * ROADMAP task marking utilities — mark tasks done/undone and query next actionable task.
 */

import type { Roadmap, RoadmapTask } from '../roadmap/types.js';

/** Error thrown when a task ID is not found in the ROADMAP markdown. */
export class RoadmapTaskNotFoundError extends Error {
  readonly taskId: string;

  constructor(taskId: string) {
    super(`Task "${taskId}" not found in ROADMAP`);
    this.name = 'RoadmapTaskNotFoundError';
    this.taskId = taskId;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mark a task as done (`[x]`) in the raw ROADMAP markdown.
 * No-op if already done. Throws RoadmapTaskNotFoundError if task ID not found.
 */
export function markTaskDone(markdown: string, taskId: string): string {
  const escapedId = escapeRegex(taskId);
  const pattern = new RegExp(`^(- \\[)( )(\\] ${escapedId} )`, 'm');

  if (!new RegExp(`^- \\[[x ]\\] ${escapedId} `, 'm').test(markdown)) {
    throw new RoadmapTaskNotFoundError(taskId);
  }

  return markdown.replace(pattern, '$1x$3');
}

/**
 * Mark a task as undone (`[ ]`) in the raw ROADMAP markdown.
 * No-op if already undone. Throws RoadmapTaskNotFoundError if task ID not found.
 */
export function markTaskUndone(markdown: string, taskId: string): string {
  const escapedId = escapeRegex(taskId);
  const pattern = new RegExp(`^(- \\[)(x)(\\] ${escapedId} )`, 'm');

  if (!new RegExp(`^- \\[[x ]\\] ${escapedId} `, 'm').test(markdown)) {
    throw new RoadmapTaskNotFoundError(taskId);
  }

  return markdown.replace(pattern, '$1 $3');
}

/**
 * Get the next actionable task — first pending task whose dependencies
 * are all completed. Searches across all phases (cross-phase aware).
 * Returns null if no task is actionable or all are complete.
 */
export function getNextTask(roadmap: Roadmap): RoadmapTask | null {
  // Build a set of all completed task IDs across all phases
  const completedIds = new Set<string>();
  for (const phase of roadmap.phases) {
    for (const task of phase.tasks) {
      if (task.completed) {
        completedIds.add(task.id);
      }
    }
  }

  // Find first pending task with all dependencies satisfied
  for (const phase of roadmap.phases) {
    for (const task of phase.tasks) {
      if (task.completed) {
        continue;
      }

      const allDepsSatisfied = task.dependencies.every((dep) =>
        completedIds.has(dep)
      );

      if (allDepsSatisfied) {
        return task;
      }
    }
  }

  return null;
}
