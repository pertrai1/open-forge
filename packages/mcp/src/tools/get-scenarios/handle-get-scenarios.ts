import { readSpecFile } from '../../specs/read-spec-file.js';
import { extractScenarios } from '../../specs/extractors/scenarios.js';

export async function handleGetScenarios(args: { spec_name: string }): Promise<{
  specName: string;
  scenarios: Array<{
    name: string;
    when: string;
    outcome: string;
    raw: string;
  }>;
  total: number;
  isError?: boolean;
  content?: Array<{ type: string; text: string }>;
}> {
  try {
    const content = await readSpecFile(args.spec_name);
    const scenarios = extractScenarios(content);

    return {
      specName: args.spec_name,
      scenarios,
      total: scenarios.length,
    };
  } catch {
    return {
      isError: true,
      content: [{ type: 'text', text: `Spec not found: ${args.spec_name}` }],
      specName: args.spec_name,
      scenarios: [],
      total: 0,
    };
  }
}
