/**
 * Parallel group detector — computes groups of concurrently executable
 * tasks from their dependency graph.
 */

import type { RoadmapTask, ParallelGroup } from './types.js';

const GROUP_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Detect parallel groups from a list of tasks based on their dependencies.
 * Only considers intra-phase dependencies (deps referencing tasks in the list).
 * Cross-phase dependencies are ignored.
 */
export function detectParallelGroups(
  tasks: readonly RoadmapTask[]
): ParallelGroup[] {
  if (tasks.length === 0) {
    return [];
  }

  const taskIds = new Set(tasks.map((t) => t.id));
  const groups: ParallelGroup[] = [];
  const assigned = new Set<string>();

  let groupIndex = 0;

  while (assigned.size < tasks.length) {
    const groupTaskIds: string[] = [];

    for (const task of tasks) {
      if (assigned.has(task.id)) {
        continue;
      }

      // Check if all intra-phase dependencies are satisfied (assigned to earlier groups)
      const intraPhraseDeps = task.dependencies.filter((d) => taskIds.has(d));
      const allDepsSatisfied = intraPhraseDeps.every((d) => assigned.has(d));

      if (allDepsSatisfied) {
        groupTaskIds.push(task.id);
      }
    }

    if (groupTaskIds.length === 0) {
      const unassigned = tasks
        .filter((t) => !assigned.has(t.id))
        .map((t) => t.id);
      throw new Error(
        `Circular dependency detected: tasks [${unassigned.join(
          ', '
        )}] have unsatisfiable dependencies`
      );
    }

    // Generate note
    let note: string;
    if (groupIndex === 0) {
      const allIndependent = groupTaskIds.every((id) => {
        const task = tasks.find((t) => t.id === id)!;
        return task.dependencies.filter((d) => taskIds.has(d)).length === 0;
      });
      note = allIndependent ? 'all independent' : '';
    } else {
      // Find dependencies from previous groups
      const depIds = new Set<string>();
      for (const id of groupTaskIds) {
        const task = tasks.find((t) => t.id === id)!;
        for (const dep of task.dependencies) {
          if (taskIds.has(dep) && !groupTaskIds.includes(dep)) {
            depIds.add(dep);
          }
        }
      }
      note = depIds.size > 0 ? `requires ${[...depIds].join(', ')}` : '';
    }

    const label = GROUP_LABELS[groupIndex] ?? `${groupIndex + 1}`;

    groups.push({
      name: `Group ${label}`,
      taskIds: groupTaskIds,
      note,
    });

    for (const id of groupTaskIds) {
      assigned.add(id);
    }
    groupIndex++;
  }

  return groups;
}
