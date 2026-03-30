import { parseSpecURI } from '../specs/uri-parser.js';
import { readSpecFile } from '../specs/file-reader.js';

export function createResourcesReadHandler(): (request: { params: { uri: string } }) => Promise<{ contents?: Array<{ uri: string; mimeType: string; text: string }>; isError?: boolean; content?: Array<{ type: string; text: string }> }> {
  return async (request: { params: { uri: string } }) => {
    const uri = request.params.uri;
    const specName = parseSpecURI(uri);

    if (!specName) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Invalid spec URI: ${uri}` }],
      };
    }

    try {
      const content = await readSpecFile(specName);

      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Spec not found: ${specName}` }],
      };
    }
  };
}
