import { describe, it, expect } from 'vitest';
import { extractScenarios } from '../../../src/specs/extractors/scenarios.js';

describe('Scenarios Extractor', () => {
  describe('extractScenarios', () => {
    it('should extract scenarios from markdown', () => {
      const markdown = `# Spec Title

## Requirements

Some requirements.

## Scenarios

#### Scenario: First scenario
- **WHEN** something happens
- **THEN** something else happens

#### Scenario: Second scenario
- **WHEN** another thing happens
- **THEN** another thing else happens`;

      const result = extractScenarios(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('First scenario');
      expect(result[0].when).toContain('something happens');
    });

    it('should return empty array for missing Scenarios section', () => {
      const markdown = `# Spec Title

## Requirements

Some requirements.`;

      const result = extractScenarios(markdown);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      const result = extractScenarios('');
      expect(result).toEqual([]);
    });
  });
});
