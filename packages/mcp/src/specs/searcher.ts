import { readSpecDirectory } from './read-spec-directory.js';
import { readFile } from 'fs/promises';
import { SPECS_PATH } from '../config.js';
import { extractPurpose } from './extract-purpose.js';

export interface SearchResult {
  uri: string;
  name: string;
  description: string;
  matchType: 'name' | 'description';
}

async function readPurpose(name: string): Promise<string | null> {
  try {
    const specPath = `${SPECS_PATH}/${name}/spec.md`;
    const content = await readFile(specPath, 'utf-8');
    return extractPurpose(content);
  } catch {
    console.error('Failed to read spec', { name });
    return null;
  }
}

export async function searchSpecs(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.toLowerCase();
  const specNames = await readSpecDirectory();
  const results: SearchResult[] = [];

  for (const name of specNames) {
    const nameMatch = name.toLowerCase().includes(normalizedQuery);

    if (nameMatch) {
      const purpose = await readPurpose(name);
      results.push({
        uri: `spec://${name}`,
        name,
        description: purpose ?? 'No description available',
        matchType: 'name',
      });
      continue;
    }

    const purpose = await readPurpose(name);
    if (purpose && purpose.toLowerCase().includes(normalizedQuery)) {
      results.push({
        uri: `spec://${name}`,
        name,
        description: purpose,
        matchType: 'description',
      });
    }
  }

  return results;
}
