/**
 * ROADMAP.md generator — serializes Roadmap objects to canonical markdown format.
 */

import type {
  Roadmap,
  RoadmapPhase,
  RoadmapTask,
  ParallelGroup,
} from './types.js';

function generateTaskLine(task: RoadmapTask): string {
  const checkbox = task.completed ? '[x]' : '[ ]';
  const deps =
    task.dependencies.length === 0 ? 'None' : task.dependencies.join(', ');
  return `- ${checkbox} ${task.id} ${task.description} [deps: ${deps}] [deliverable: ${task.deliverable}]`;
}

function generateParallelGroups(groups: readonly ParallelGroup[]): string {
  if (groups.length === 0) {
    return '';
  }

  const lines = ['**Parallel Groups**:', ''];
  for (const group of groups) {
    const ids = group.taskIds.join(', ');
    const note = group.note ? ` (${group.note})` : '';
    lines.push(`- ${group.name}: ${ids}${note}`);
  }
  return lines.join('\n');
}

function generatePhase(phase: RoadmapPhase): string {
  const lines: string[] = [];

  lines.push(`## Phase ${phase.number}: ${phase.name}`);
  lines.push('');
  lines.push(`**Goal**: ${phase.goal}`);
  lines.push('');
  lines.push('### Tasks');
  lines.push('');

  for (const task of phase.tasks) {
    lines.push(generateTaskLine(task));
  }

  const groupsBlock = generateParallelGroups(phase.parallelGroups);
  if (groupsBlock) {
    lines.push('');
    lines.push(groupsBlock);
  }

  return lines.join('\n');
}

/**
 * Generate a complete ROADMAP.md markdown string from a Roadmap object.
 */
export function generateRoadmap(roadmap: Roadmap): string {
  const sections: string[] = [];

  sections.push(`# ${roadmap.title}`);
  sections.push('');
  sections.push('## Overview');
  sections.push('');
  sections.push(roadmap.overview);
  sections.push('');
  sections.push('---');

  for (const phase of roadmap.phases) {
    sections.push('');
    sections.push(generatePhase(phase));
    sections.push('');
    sections.push('---');
  }

  return sections.join('\n') + '\n';
}
