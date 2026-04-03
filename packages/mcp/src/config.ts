import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export const OPENSPEC_PATH = path.join(PROJECT_ROOT, 'openspec');
export const SPECS_PATH = path.join(OPENSPEC_PATH, 'specs');
export const CHANGES_PATH = path.join(OPENSPEC_PATH, 'changes');
