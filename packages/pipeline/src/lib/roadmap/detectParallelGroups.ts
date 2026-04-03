/**
 * Parallel group detector — computes groups of concurrently executable
 * tasks from their dependency graph.
 */

import type { RoadmapTask, ParallelGroup } from './types.js';

const GROUP_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface GroupNoteContext {
  groupIndex: number;
  groupTaskIds: string[];
  tasks: readonly RoadmapTask[];
  taskIds: Set<string>;
}

function generateGroupNote(ctx: GroupNoteContext): string {
  if (ctx.groupIndex === 0) {
    const allIndependent = ctx.groupTaskIds.every((id) => {
      const task = ctx.tasks.find((t) => t.id === id);
      return task
        ? task.dependencies.filter((d) => ctx.taskIds.has(d)).length === 0
        : true;
    });
    return allIndependent ? 'all independent' : '';
  }

  const depIds = new Set<string>();
  for (const id of ctx.groupTaskIds) {
    const task = ctx.tasks.find((t) => t.id === id);
    if (!task) continue;
    for (const dep of task.dependencies) {
      if (ctx.taskIds.has(dep) && !ctx.groupTaskIds.includes(dep)) {
        depIds.add(dep);
      }
    }
  }
  return depIds.size > 0 ? `requires ${[...depIds].join(', ')}` : '';
}

interface TaskGraphContext {
  tasks: readonly RoadmapTask[];
  assigned: Set<string>;
  taskIds: Set<string>;
}

function findReadyTasks(ctx: TaskGraphContext): string[] {
  const ready: string[] = [];
  for (const task of ctx.tasks) {
    if (ctx.assigned.has(task.id)) {
      continue;
    }
    const intraPhraseDeps = task.dependencies.filter((d) => ctx.taskIds.has(d));
    const allDepsSatisfied = intraPhraseDeps.every((d) => ctx.assigned.has(d));
    if (allDepsSatisfied) {
      ready.push(task.id);
    }
  }
  return ready;
}

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
    const groupTaskIds = findReadyTasks({ tasks, assigned, taskIds });

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

    const note = generateGroupNote({
      groupIndex,
      groupTaskIds,
      tasks,
      taskIds,
    });
    const label = GROUP_LABELS[groupIndex] ?? `${groupIndex + 1}`;

    groups.push({ name: `Group ${label}`, taskIds: groupTaskIds, note });

    for (const id of groupTaskIds) {
      assigned.add(id);
    }
    groupIndex++;
  }

  return groups;
}
