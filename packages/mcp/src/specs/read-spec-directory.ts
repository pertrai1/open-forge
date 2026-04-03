import { readdir } from 'fs/promises';
import { SPECS_PATH } from '../config.js';

export async function readSpecDirectory(): Promise<string[]> {
  try {
    const entries = await readdir(SPECS_PATH, { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    return directories;
  } catch {
    return [];
  }
}
