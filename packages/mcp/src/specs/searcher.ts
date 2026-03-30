import { readSpecDirectory } from './reader.js';
import { readFile } from 'fs/promises';
import { SPECS_PATH } from '../config.js';
import { extractPurpose } from './purpose-extractor.js';

export interface SearchResult {
  uri: string;
  name: string;
  description: string;
  matchType: 'name' | 'description';
}

export async function searchSpecs(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.toLowerCase();
  const specNames = await readSpecDirectory();
  const results: SearchResult[] = [];

  for (const name of specNames) {
    const nameMatch = name.toLowerCase().includes(normalizedQuery);

    if (nameMatch) {
      let description = 'No description available';
      try {
        const specPath = `${SPECS_PATH}/${name}/spec.md`;
        const content = await readFile(specPath, 'utf-8');
        const purpose = extractPurpose(content);
        if (purpose) {
          description = purpose;
        }
      } catch (error) {
        console.error(`Failed to read spec ${name}:`, error);
      }

      results.push({
        uri: `spec://${name}`,
        name,
        description,
        matchType: 'name',
      });
      continue;
    }

    try {
      const specPath = `${SPECS_PATH}/${name}/spec.md`;
      const content = await readFile(specPath, 'utf-8');
      const purpose = extractPurpose(content);

      if (purpose && purpose.toLowerCase().includes(normalizedQuery)) {
        results.push({
          uri: `spec://${name}`,
          name,
          description: purpose,
          matchType: 'description',
        });
      }
    } catch (error) {
      console.error(`Failed to read spec ${name}:`, error);
    }
  }

  return results;
}
