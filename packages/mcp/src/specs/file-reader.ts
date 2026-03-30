import { readFile } from 'fs/promises';
import { SPECS_PATH } from '../config.js';

export async function readSpecFile(name: string): Promise<string> {
  const specPath = `${SPECS_PATH}/${name}/spec.md`;
  return await readFile(specPath, 'utf-8');
}
