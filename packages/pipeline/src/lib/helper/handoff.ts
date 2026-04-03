/**
 * HANDOFF helper — pure convenience functions for extracting data
 * from HandoffState objects.
 */

import type {
  HandoffState,
  Convention,
  WakeContext,
} from '../handoff/types.js';

/**
 * Return the active conventions from a HandoffState.
 */
export function getActiveConventions(
  state: HandoffState
): readonly Convention[] {
  return state.conventions;
}

interface WakeContextInput {
  readonly state: HandoffState;
  readonly nextTask: string;
  readonly progress: string;
}

/**
 * Build a structured WakeContext from a HandoffState for session handoff.
 * Filters resolved issues and summarizes goal context.
 */
export function getWakeContext(input: WakeContextInput): WakeContext {
  const { state, nextTask, progress } = input;
  const unresolvedIssues = state.openIssues
    .filter((issue) => !issue.resolved)
    .map((issue) => issue.description);

  const goalSummary = `${state.goalContext.problem} → ${state.goalContext.userStory} → ${state.goalContext.specRequirement}`;

  return {
    changeName: state.sessionId,
    branch: state.currentState.branch,
    nextTask,
    progress,
    goalContext: goalSummary,
    packagesTouched: [...state.currentState.packagesTouched],
    activeConventions: state.conventions.map((c) => c.name),
    openIssues: unresolvedIssues,
    lastCommit: getLastCommit(state),
  };
}

/**
 * Extract the commit hash and description from the most recent task log entry.
 * Returns empty string if no task log entries exist.
 */
export function getLastCommit(state: HandoffState): string {
  if (state.taskLog.length === 0) {
    return '';
  }

  const last = state.taskLog[state.taskLog.length - 1];
  const hash = last.commitHash || '(no commit)';
  return `${hash} — ${last.description}`;
}
