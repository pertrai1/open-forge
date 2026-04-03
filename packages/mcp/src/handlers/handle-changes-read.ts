import { readFile } from 'fs/promises';
import { CHANGES_PATH } from '../config.js';

export async function handleChangesRead(
  name: string
): Promise<
  | { contents: Array<{ uri: string; mimeType: string; text: string }> }
  | { isError: boolean; content: Array<{ type: string; text: string }> }
> {
  try {
    const filePath = `${CHANGES_PATH}/${name}/README.md`;
    const text = await readFile(filePath, 'utf-8');

    return {
      contents: [
        {
          uri: `changes://${name}`,
          mimeType: 'text/markdown',
          text,
        },
      ],
    };
  } catch {
    return {
      isError: true,
      content: [{ type: 'text', text: `Change not found: ${name}` }],
    };
  }
}
