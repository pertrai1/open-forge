import { readFile } from 'fs/promises';
import { readSpecDirectory } from '../specs/read-spec-directory.js';
import { extractPurpose } from '../specs/extract-purpose.js';
import { SPECS_PATH } from '../config.js';

export function createResourcesListHandler(): () => Promise<{
  resources: Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }>;
}> {
  return async () => {
    const specNames = await readSpecDirectory();

    const resources = await Promise.all(
      specNames.map(async (name) => {
        let description = 'No description available';

        try {
          const specPath = `${SPECS_PATH}/${name}/spec.md`;
          const content = await readFile(specPath, 'utf-8');
          const purpose = extractPurpose(content);

          if (purpose) {
            description = purpose;
          }
        } catch (error) {
          console.error('Failed to read spec', { name, error });
        }

        return {
          uri: `spec://${name}`,
          name,
          description,
          mimeType: 'text/markdown',
        };
      })
    );

    return { resources };
  };
}
