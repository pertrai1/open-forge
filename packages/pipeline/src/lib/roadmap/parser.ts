/**
 * ROADMAP.md parser — converts markdown into typed Roadmap structures.
 */

import type {
  Roadmap,
  RoadmapPhase,
  RoadmapTask,
  ParallelGroup,
  TaskComplexity,
} from './types.js';

/** Error thrown when ROADMAP.md content is malformed. */
export class RoadmapParseError extends Error {
  readonly line: number;
  readonly context: string;

  constructor(line: number, message: string, context: string = '') {
    super(`Line ${line}: ${message}`);
    this.name = 'RoadmapParseError';
    this.line = line;
    this.context = context;
  }
}

const TASK_PATTERN = /^- \[([ x])\] (\d+\.\d+) (.+)$/;
const DEPS_PATTERN = /\[deps: ([^\]]+)\]/;
const DELIVERABLE_PATTERN = /\[deliverable: ([^\]]+)\]/;
const PHASE_HEADER_PATTERN = /^## Phase (\d+): (.+)$/;
const GOAL_PATTERN = /^\*\*Goal\*\*: (.+)$/;
const PARALLEL_GROUP_PATTERN = /^- (Group [A-Z\d]+): (.+)$/;

/**
 * Parse a single ROADMAP task line into a RoadmapTask.
 * Throws RoadmapParseError if the line is malformed.
 */
export function parseTask(line: string, lineNumber: number = 0): RoadmapTask {
  const taskMatch = TASK_PATTERN.exec(line);
  if (!taskMatch) {
    throw new RoadmapParseError(lineNumber, 'Invalid task line format', line);
  }

  const [, checkbox, id, rest] = taskMatch;
  const completed = checkbox === 'x';

  const depsMatch = DEPS_PATTERN.exec(rest);
  if (!depsMatch) {
    throw new RoadmapParseError(
      lineNumber,
      'Task line missing [deps: ...] tag',
      line
    );
  }

  const deliverableMatch = DELIVERABLE_PATTERN.exec(rest);
  if (!deliverableMatch) {
    throw new RoadmapParseError(
      lineNumber,
      'Task line missing [deliverable: ...] tag',
      line
    );
  }

  const depsRaw = depsMatch[1].trim();
  const dependencies: string[] =
    depsRaw === 'None' ? [] : depsRaw.split(',').map((d) => d.trim());

  const deliverable = deliverableMatch[1].trim();

  // Extract description: text between task ID and first tag
  const firstTagIndex = Math.min(
    rest.indexOf('[deps:'),
    rest.indexOf('[deliverable:') >= 0
      ? rest.indexOf('[deliverable:')
      : rest.length
  );
  const description = rest.substring(0, firstTagIndex).trim();

  const complexity: TaskComplexity = 'medium';

  return {
    id,
    description,
    dependencies,
    deliverable,
    completed,
    complexity,
  };
}

/**
 * Parse a parallel group line into a ParallelGroup.
 */
function parseParallelGroup(line: string): ParallelGroup | null {
  const match = PARALLEL_GROUP_PATTERN.exec(line);
  if (!match) {
    return null;
  }

  const name = match[1];
  const rest = match[2].trim();

  // Check for parenthetical note
  const noteMatch = /^(.+?)\s*\((.+)\)\s*$/.exec(rest);
  let taskIdsPart: string;
  let note: string;

  if (noteMatch) {
    taskIdsPart = noteMatch[1];
    note = noteMatch[2];
  } else {
    taskIdsPart = rest;
    note = '';
  }

  const taskIds = taskIdsPart.split(',').map((id) => id.trim());

  return { name, taskIds, note };
}

/**
 * Parse a phase block (array of lines) into a RoadmapPhase.
 */
export function parsePhase(lines: string[], phaseNumber: number): RoadmapPhase {
  let name = '';
  let goal = '';
  const tasks: RoadmapTask[] = [];
  const parallelGroups: ParallelGroup[] = [];
  let inParallelGroups = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Phase header
    const headerMatch = PHASE_HEADER_PATTERN.exec(line);
    if (headerMatch) {
      name = headerMatch[2];
      continue;
    }

    // Goal
    const goalMatch = GOAL_PATTERN.exec(line);
    if (goalMatch) {
      goal = goalMatch[1];
      continue;
    }

    // Detect parallel groups section
    if (
      line.startsWith('**Parallel Groups**') ||
      line.startsWith('**Parallel Groups:')
    ) {
      inParallelGroups = true;
      continue;
    }

    // Task line
    if (TASK_PATTERN.test(line)) {
      const task = parseTask(line, i);
      tasks.push(task);
      continue;
    }

    // Parallel group line
    if (inParallelGroups) {
      const group = parseParallelGroup(line);
      if (group) {
        parallelGroups.push(group);
      }
    }
  }

  return {
    number: phaseNumber,
    name,
    goal,
    tasks,
    parallelGroups,
  };
}

/**
 * Parse a complete ROADMAP.md markdown string into a Roadmap.
 * Throws RoadmapParseError if the title is missing.
 */
export function parseRoadmap(markdown: string): Roadmap {
  const lines = markdown.split('\n');

  // Find title (first # header)
  let title = '';
  let titleLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const match = /^# (.+)$/.exec(lines[i]);
    if (match) {
      title = match[1];
      titleLineIndex = i;
      break;
    }
  }

  if (titleLineIndex === -1) {
    throw new RoadmapParseError(0, 'ROADMAP title (# header) is missing');
  }

  // Extract overview: text between ## Overview and first ## Phase
  let overview = '';
  let overviewStart = -1;
  let firstPhaseIndex = -1;

  for (let i = titleLineIndex + 1; i < lines.length; i++) {
    if (/^## Overview/.test(lines[i])) {
      overviewStart = i + 1;
    }
    if (PHASE_HEADER_PATTERN.test(lines[i])) {
      firstPhaseIndex = i;
      break;
    }
  }

  if (overviewStart >= 0) {
    const end = firstPhaseIndex >= 0 ? firstPhaseIndex : lines.length;
    overview = lines
      .slice(overviewStart, end)
      .join('\n')
      .replace(/^---\s*$/m, '')
      .trim();
  }

  // Split into phase blocks
  const phases: RoadmapPhase[] = [];
  if (firstPhaseIndex >= 0) {
    const phaseStarts: number[] = [];
    for (let i = firstPhaseIndex; i < lines.length; i++) {
      if (PHASE_HEADER_PATTERN.test(lines[i])) {
        phaseStarts.push(i);
      }
    }

    for (let p = 0; p < phaseStarts.length; p++) {
      const start = phaseStarts[p];
      const end =
        p + 1 < phaseStarts.length ? phaseStarts[p + 1] : lines.length;
      const phaseLines = lines.slice(start, end);

      // Extract phase number from header
      const headerMatch = PHASE_HEADER_PATTERN.exec(phaseLines[0]);
      const phaseNumber = headerMatch ? parseInt(headerMatch[1], 10) : p;

      phases.push(parsePhase(phaseLines, phaseNumber));
    }
  }

  return { title, overview, phases };
}
