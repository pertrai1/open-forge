export interface Scenario {
  name: string;
  when: string;
  outcome: string;
  raw: string;
}

export function extractScenarios(markdown: string): Scenario[] {
  if (!markdown) {
    return [];
  }

  const scenariosSection = markdown.match(/## Scenarios\n([\s\S]*?)(?=\n## |$)/);
  if (!scenariosSection) {
    return [];
  }

  const scenariosText = scenariosSection[1];
  const scenarioBlocks = scenariosText
    .split(/#### Scenario:/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const scenarios: Scenario[] = [];

  for (const block of scenarioBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    const name = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    const whenMatch = content.match(/- \*\*WHEN\*\* ([^\n]+)/);
    const thenMatch = content.match(/- \*\*THEN\*\* ([^\n]+)/);

    scenarios.push({
      name,
      when: whenMatch ? whenMatch[1] : '',
      outcome: thenMatch ? thenMatch[1] : '',
      raw: block.trim(),
    });
  }

  return scenarios;
}
