import { describe, it, expect } from 'vitest';
import { extractRequirements } from '../../../src/specs/extractors/requirements.js';

describe('Requirements Extractor', () => {
  describe('extractRequirements', () => {
    it('should extract requirements from markdown', () => {
      const markdown = `# Spec Title

## Purpose

Some purpose text.

## Requirements

### Requirement: First requirement
The system SHALL do something.

### Requirement: Second requirement
The system SHALL do something else.

## Scenarios

Some scenarios.`;

      const result = extractRequirements(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('first-requirement');
      expect(result[0].content).toContain('do something');
    });

    it('should return empty array for missing Requirements section', () => {
      const markdown = `# Spec Title

## Purpose

Some purpose text.`;

      const result = extractRequirements(markdown);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      const result = extractRequirements('');
      expect(result).toEqual([]);
    });
  });
});
