import { readSpecFile } from '../../specs/read-spec-file.js';
import { extractRequirements } from '../../specs/extractors/requirements.js';

export async function handleGetRequirements(args: {
  spec_name: string;
}): Promise<{
  specName: string;
  requirements: Array<{ id: string; title: string; content: string }>;
  raw?: string;
  isError?: boolean;
  content?: Array<{ type: string; text: string }>;
}> {
  try {
    const content = await readSpecFile(args.spec_name);
    const requirements = extractRequirements(content);

    const requirementsSection = content.match(
      /## Requirements\n([\s\S]*?)(?=\n##|$)/
    );
    const raw = requirementsSection ? requirementsSection[1].trim() : '';

    return {
      specName: args.spec_name,
      requirements,
      raw,
    };
  } catch {
    return {
      isError: true,
      content: [{ type: 'text', text: `Spec not found: ${args.spec_name}` }],
      specName: args.spec_name,
      requirements: [],
    };
  }
}
