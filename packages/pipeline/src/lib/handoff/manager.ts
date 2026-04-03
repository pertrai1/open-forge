/**
 * HANDOFF manager — read, write, and manipulate HANDOFF.md state.
 * Persists HandoffState as JSON inside a markdown file.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type {
  HandoffState,
  TaskLogEntry,
  CurrentState,
  CompressedHistoryEntry,
} from './types.js';

const MAX_TASK_LOG = 5;
const MAX_COMPRESSED_HISTORY = 10;

/** Error thrown when reading a HANDOFF.md file fails. */
export class HandoffReadError extends Error {
  readonly filePath: string;

  constructor(filePath: string, message: string) {
    super(message);
    this.name = 'HandoffReadError';
    this.filePath = filePath;
  }
}

/** Error thrown when writing a HANDOFF.md file fails. */
export class HandoffWriteError extends Error {
  readonly filePath: string;

  constructor(filePath: string, message: string) {
    super(message);
    this.name = 'HandoffWriteError';
    this.filePath = filePath;
  }
}

/**
 * Extract the JSON content from a fenced code block in markdown.
 */
function extractJsonBlock(content: string): string | null {
  const match = /```json\s*\n([\s\S]*?)\n```/.exec(content);
  return match ? match[1] : null;
}

/**
 * Wrap a HandoffState JSON string in markdown for human readability.
 */
function wrapInMarkdown(jsonStr: string): string {
  return `# HANDOFF\n\n<!-- Machine-managed file. Edit the JSON block below. -->\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n`;
}

/**
 * Enforce bounding rules on a HandoffState before persistence.
 */
function enforceBounds(state: HandoffState): HandoffState {
  const taskLog =
    state.taskLog.length > MAX_TASK_LOG
      ? state.taskLog.slice(state.taskLog.length - MAX_TASK_LOG)
      : state.taskLog;

  const compressedHistory =
    state.compressedHistory.length > MAX_COMPRESSED_HISTORY
      ? state.compressedHistory.slice(
          state.compressedHistory.length - MAX_COMPRESSED_HISTORY
        )
      : state.compressedHistory;

  return { ...state, taskLog, compressedHistory };
}

/**
 * Read a HANDOFF.md file and return the parsed HandoffState.
 * Throws HandoffReadError if the file is missing, has no JSON block, or has malformed JSON.
 */
export async function readHandoff(filePath: string): Promise<HandoffState> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    throw new HandoffReadError(filePath, `HANDOFF file not found: ${filePath}`);
  }

  const jsonStr = extractJsonBlock(content);
  if (!jsonStr) {
    throw new HandoffReadError(
      filePath,
      'No JSON code block found in HANDOFF.md'
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new HandoffReadError(filePath, 'Malformed JSON in HANDOFF.md');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('sessionId' in parsed) ||
    !('currentState' in parsed) ||
    !('taskLog' in parsed)
  ) {
    throw new HandoffReadError(
      filePath,
      'Invalid HANDOFF structure: missing required fields (sessionId, currentState, taskLog)'
    );
  }

  return parsed as HandoffState;
}

/**
 * Write a HandoffState to a HANDOFF.md file.
 * Creates parent directories if needed.
 * Enforces task log bound (5) and compressed history bound (10).
 */
export async function writeHandoff(
  filePath: string,
  state: HandoffState
): Promise<void> {
  const bounded = enforceBounds(state);
  const jsonStr = JSON.stringify(bounded, null, 2);
  const markdown = wrapInMarkdown(jsonStr);

  await mkdir(dirname(filePath), { recursive: true });

  try {
    await writeFile(filePath, markdown, 'utf-8');
  } catch (err) {
    throw new HandoffWriteError(
      filePath,
      `Failed to write HANDOFF.md: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Append a task log entry to a HandoffState.
 * Returns a new HandoffState with the entry appended.
 * If the task log exceeds 5 entries, the oldest is evicted and compressed.
 */
export function appendTaskLog(
  state: HandoffState,
  entry: TaskLogEntry
): HandoffState {
  const newLog = [...state.taskLog, entry];
  let newHistory = [...state.compressedHistory];

  if (newLog.length > MAX_TASK_LOG) {
    const evicted = newLog.shift();
    if (!evicted) {
      return { ...state, taskLog: newLog, compressedHistory: newHistory };
    }
    const compressed: CompressedHistoryEntry = {
      taskRange: evicted.taskId,
      summary: evicted.description,
      files: [...evicted.filesModified],
    };
    newHistory = [...newHistory, compressed];

    if (newHistory.length > MAX_COMPRESSED_HISTORY) {
      newHistory = newHistory.slice(newHistory.length - MAX_COMPRESSED_HISTORY);
    }
  }

  return {
    ...state,
    taskLog: newLog,
    compressedHistory: newHistory,
  };
}

/**
 * Update the currentState field of a HandoffState.
 * Returns a new HandoffState with the partial update merged and updatedAt refreshed.
 */
export function updateCurrentState(
  state: HandoffState,
  update: Partial<CurrentState>
): HandoffState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
    currentState: {
      ...state.currentState,
      ...update,
    },
  };
}
