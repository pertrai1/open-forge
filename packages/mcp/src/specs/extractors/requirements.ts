export interface Requirement {
  id: string;
  title: string;
  content: string;
}

export function extractRequirements(markdown: string): Requirement[] {
  if (!markdown) {
    return [];
  }

  const requirementsSection = markdown.match(/## Requirements\n([\s\S]*?)(?=\n## |$)/);
  if (!requirementsSection) {
    return [];
  }

  const requirementsText = requirementsSection[1];
  const requirementBlocks = requirementsText.split(/### Requirement:/).filter(Boolean);

  const requirements: Requirement[] = [];

  for (const block of requirementBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    if (title) {
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      requirements.push({ id, title, content });
    }
  }

  return requirements;
}
