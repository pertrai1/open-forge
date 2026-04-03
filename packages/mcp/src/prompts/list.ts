import { readSpecFile } from '../specs/read-spec-file.js';

export async function listPrompts(): Promise<{
  prompts: Array<{
    name: string;
    description: string;
    arguments?: Array<{ name: string; description: string; required: boolean }>;
  }>;
}> {
  return {
    prompts: [
      {
        name: 'understand_spec',
        description: 'Understand and explain a specification',
        arguments: [
          {
            name: 'spec_name',
            description: 'Name of the spec to understand',
            required: true,
          },
        ],
      },
      {
        name: 'compare_specs',
        description: 'Compare two specifications',
        arguments: [
          {
            name: 'spec_a',
            description: 'First spec to compare',
            required: true,
          },
          {
            name: 'spec_b',
            description: 'Second spec to compare',
            required: true,
          },
        ],
      },
    ],
  };
}

export async function getPrompt(
  name: string,
  args: Record<string, string>
): Promise<{
  messages: Array<{ role: string; content: { type: string; text: string } }>;
}> {
  if (name === 'understand_spec') {
    const specName = args.spec_name;
    if (!specName) {
      throw new Error('spec_name argument required');
    }

    const content = await readSpecFile(specName);

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please explain the following specification. What does it do? What are the key requirements? How would you test it?\n\n## Specification: ${specName}\n\n${content}`,
          },
        },
      ],
    };
  }

  if (name === 'compare_specs') {
    const specA = args.spec_a;
    const specB = args.spec_b;

    if (!specA || !specB) {
      throw new Error('spec_a and spec_b arguments required');
    }

    const contentA = await readSpecFile(specA);
    const contentB = await readSpecFile(specB);

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Compare these two specifications. What are the similarities? What are the differences? Do they overlap or depend on each other?\n\n## Specification A: ${specA}\n\n${contentA}\n\n## Specification B: ${specB}\n\n${contentB}`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
}
