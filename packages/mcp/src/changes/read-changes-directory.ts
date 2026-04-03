import { readdir } from 'fs/promises';
import { CHANGES_PATH } from '../config.js';

export async function readChangesDirectory(): Promise<string[]> {
  try {
    const entries = await readdir(CHANGES_PATH, { withFileTypes: true });
    const changes = entries
      .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
      .map((entry) => entry.name);

    return changes;
  } catch {
    return [];
  }
}
